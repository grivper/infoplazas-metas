import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';

/**
 * Datos de un enlace para la Meta 4.
 * Incluye todas las métricas: Meta Mínima, Cumplimiento Mensual, Brecha, Tasa Éxito YTD.
 */
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

/**
 * Meta 4: Cumplimiento de Rutas (Auditoría)
 * Aplica las 4 fórmulas:
 * 1. Meta Mínima = ⌈IPs × 0.95⌉
 * 2. % Cumplimiento = (IPs visitadas / Total IPs) × 100
 * 3. Brecha = Meta mínima - Visitadas
 * 4. Tasa Éxito YTD = (MesesOK / MesesEval) × 100
 */
export const getMeta4Rutas = async (): Promise<MetaItem> => {
  const mesActualNum = new Date().getMonth() + 1;

  const mesesOrdenados = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // 1. Obtener itinerarios (rutas planificadas por enlace)
  const { data: itinerarios } = await supabase
    .from('itinerario_enlaces')
    .select('enlace_nombre, infoplaza_id');

  // 2. Obtener visitas de Cognito con mes
  const { data: cognito } = await supabase
    .from('cognito_registros')
    .select('enlace_original, infoplaza_id, mes');

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

  // 3. Agrupar IPs programadas por enlace
  const progMap = new Map<string, Set<string>>();
  itinerarios.forEach((i) => {
    if (!progMap.has(i.enlace_nombre)) progMap.set(i.enlace_nombre, new Set());
    progMap.get(i.enlace_nombre)!.add(i.infoplaza_id);
  });

  // 4. Agrupar IPs visitadas por enlace y por mes (IPs únicas)
  const enlacesEnItinerario = new Set(progMap.keys());
  const visitMap = new Map<string, Map<number, Set<string>>>();

  cognito.forEach((c) => {
    if (c.enlace_original && enlacesEnItinerario.has(c.enlace_original) && c.infoplaza_id && c.mes) {
      if (!visitMap.has(c.enlace_original)) {
        visitMap.set(c.enlace_original, new Map());
      }
      const mesMap = visitMap.get(c.enlace_original)!;
      if (!mesMap.has(c.mes)) {
        mesMap.set(c.mes, new Set());
      }
      mesMap.get(c.mes)!.add(c.infoplaza_id);
    }
  });

  // 5. Calcular métricas por enlace
  const datosEnlaces: EnlaceRutaData[] = [];

  progMap.forEach((progSet, enlace) => {
    const totalIp = progSet.size;
    const metaMinima = Math.ceil(totalIp * 0.95);
    const mesMap = visitMap.get(enlace) || new Map();

    const historial: EnlaceRutaData['historial'] = [];
    let mesesCumplidos = 0;
    let mesesEvaluados = 0;
    let visitadasMesActual = 0;

    for (let i = 0; i < 12; i++) {
      const mesNum = i + 1;
      const mesNombre = mesesOrdenados[i];

      if (mesNum > mesActualNum) break;

      const ipsVisitadasMes = [...(mesMap.get(mesNum) || [])].filter(ip => progSet.has(ip));
      const visitadas = ipsVisitadasMes.length;
      const cumplimiento = totalIp > 0 ? Math.round((visitadas / totalIp) * 100) : 0;
      const cumple = visitadas >= metaMinima;

      historial.push({
        mes: mesNombre.substring(0, 3),
        visitadas,
        metaMinima,
        cumplimiento,
        cumple,
      });

      mesesEvaluados++;
      if (cumple) mesesCumplidos++;

      if (mesNum === mesActualNum) {
        visitadasMesActual = visitadas;
      }
    }

    const brecha = metaMinima - visitadasMesActual;
    const tasaExitoYtd = mesesEvaluados > 0
      ? Math.round((mesesCumplidos / mesesEvaluados) * 100)
      : 0;

    datosEnlaces.push({
      enlace,
      totalIp,
      metaMinima,
      mesActual: {
        visitadas: visitadasMesActual,
        cumplimiento: totalIp > 0 ? Math.round((visitadasMesActual / totalIp) * 100) : 0,
        brecha,
        nombreMes: mesesOrdenados[mesActualNum - 1],
      },
      tasaExitoYtd,
      mesesCumplidos,
      mesesEvaluados,
      historial,
    });
  });

  // 6. Calcular promedio de tasa de éxito YTD global
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
