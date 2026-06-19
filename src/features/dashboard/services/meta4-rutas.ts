import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';

export interface EnlaceRutaData {
  enlace: string;
  totalIp: number;
  metaMinima: number;
  mesActual: {
    visitadas: number;
    cumplimiento: number;
    brecha: number;
    nombreMes: string;
  };
  tasaExitoYtd: number;
  mesesCumplidos: number;
  mesesEvaluados: number;
  historial: {
    mes: string;
    visitadas: number;
    metaMinima: number;
    cumplimiento: number;
    cumple: boolean;
  }[];
}

export const getMeta4Rutas = async (): Promise<MetaItem> => {
  const mesActualNum = new Date().getMonth() + 1;
  const añoActual = new Date().getFullYear();

  const mesesOrdenados = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const { data: itinerarios } = await supabase
    .from('itinerario_enlaces')
    .select('enlace_nombre, infoplaza_id');

  const { data: cognito } = await supabase
    .from('cognito_registros')
    .select('enlace_original, infoplaza_id, mes');

  // Obtener la memoria (snapshots) de meses anteriores
  const { data: snapshotsData } = await supabase
    .from('meta_4_snapshots')
    .select('enlace_nombre, mes_num, total_ip')
    .eq('año', añoActual);

  if (!itinerarios || !cognito) {
    return {
      id: 'meta-4',
      titulo: 'Cumplimiento de Rutas',
      numero: 4,
      progreso: 0,
      metricas: [{ label: 'Sin datos', valor: 0, meta: 0 }],
      color: 'bg-indigo-500',
      link: '/auditoria',
    };
  }

  const snapshotsMap = new Map<string, Map<number, number>>();
  if (snapshotsData) {
    snapshotsData.forEach(s => {
      if (!snapshotsMap.has(s.enlace_nombre)) snapshotsMap.set(s.enlace_nombre, new Map());
      snapshotsMap.get(s.enlace_nombre)!.set(s.mes_num, s.total_ip);
    });
  }

  const progMap = new Map<string, Set<string>>();
  itinerarios.forEach((i) => {
    if (!progMap.has(i.enlace_nombre)) progMap.set(i.enlace_nombre, new Set());
    progMap.get(i.enlace_nombre)!.add(i.infoplaza_id);
  });

  const ipToOwnerMap = new Map<string, string>();
  itinerarios.forEach((i) => {
    ipToOwnerMap.set(i.infoplaza_id, i.enlace_nombre);
  });

  const visitMap = new Map<string, Map<number, Set<string>>>();
  cognito.forEach((c) => {
    if (c.infoplaza_id && c.mes) {
      const routeOwner = ipToOwnerMap.get(c.infoplaza_id);
      if (!routeOwner) return;

      if (!visitMap.has(routeOwner)) {
        visitMap.set(routeOwner, new Map());
      }
      const mesMap = visitMap.get(routeOwner)!;
      if (!mesMap.has(c.mes)) {
        mesMap.set(c.mes, new Set());
      }
      mesMap.get(c.mes)!.add(c.infoplaza_id);
    }
  });

  const datosEnlaces: EnlaceRutaData[] = [];
  const snapshotsToUpsert: any[] = [];

  progMap.forEach((progSet, enlace) => {
    const totalIpActual = progSet.size;
    const metaMinimaActual = Math.ceil(totalIpActual * 0.95);
    const mesMap = visitMap.get(enlace) || new Map();

    const historial: EnlaceRutaData['historial'] = [];
    let mesesCumplidos = 0;
    let mesesEvaluados = 0;
    let visitadasMesActual = 0;
    
    // Preparar el snapshot del mes actual (para guardar la "foto" en vivo)
    snapshotsToUpsert.push({
      enlace_nombre: enlace,
      mes_num: mesActualNum,
      año: añoActual,
      total_ip: totalIpActual,
      infoplazas_json: Array.from(progSet)
    });

    for (let i = 0; i < 12; i++) {
      const mesNum = i + 1;
      const mesNombre = mesesOrdenados[i];

      if (mesNum > mesActualNum) break;

      // Magia de Persistencia: Si es un mes pasado, buscamos la foto histórica.
      // Si no hay foto histórica, usamos el valor actual como respaldo.
      let totalIpMes = totalIpActual;
      if (mesNum < mesActualNum && snapshotsMap.has(enlace) && snapshotsMap.get(enlace)!.has(mesNum)) {
        totalIpMes = snapshotsMap.get(enlace)!.get(mesNum)!;
      }
      
      const metaMinimaMes = Math.ceil(totalIpMes * 0.95);
      const visitadas = (mesMap.get(mesNum) || new Set()).size;
      const cumplimiento = totalIpMes > 0 ? Math.round((visitadas / totalIpMes) * 100) : 0;
      const cumple = visitadas >= metaMinimaMes;

      historial.push({
        mes: mesNombre.substring(0, 3),
        visitadas,
        metaMinima: metaMinimaMes,
        cumplimiento,
        cumple,
      });

      mesesEvaluados++;
      if (cumple) mesesCumplidos++;

      if (mesNum === mesActualNum) {
        visitadasMesActual = visitadas;
      }
    }

    const brecha = metaMinimaActual - visitadasMesActual;
    const tasaExitoYtd = mesesEvaluados > 0
      ? Math.round((mesesCumplidos / mesesEvaluados) * 100)
      : 0;

    datosEnlaces.push({
      enlace,
      totalIp: totalIpActual,
      metaMinima: metaMinimaActual,
      mesActual: {
        visitadas: visitadasMesActual,
        cumplimiento: totalIpActual > 0 ? Math.round((visitadasMesActual / totalIpActual) * 100) : 0,
        brecha,
        nombreMes: mesesOrdenados[mesActualNum - 1],
      },
      tasaExitoYtd,
      mesesCumplidos,
      mesesEvaluados,
      historial,
    });
  });

  // Guardamos la foto del mes actual silenciosamente en background
  if (snapshotsToUpsert.length > 0) {
    supabase.from('meta_4_snapshots').upsert(snapshotsToUpsert, {
      onConflict: 'enlace_nombre, mes_num, año'
    }).then(({ error }) => {
      if (error) console.error('Error al guardar snapshot de Meta 4:', error);
    });
  }

  const promedioGlobal = datosEnlaces.length > 0
    ? Math.round(datosEnlaces.reduce((sum, e) => sum + e.tasaExitoYtd, 0) / datosEnlaces.length)
    : 0;

  const metricas: MetaMetrica[] = [
    { label: 'Tasa Éxito YTD', valor: promedioGlobal, meta: 100, unidad: '%' },
  ];

  return {
    id: 'meta-4',
    titulo: 'Cumplimiento de Rutas',
    numero: 4,
    progreso: promedioGlobal,
    metricas,
    color: 'bg-indigo-500',
    link: '/auditoria',
    enlaces: datosEnlaces,
  };
};
