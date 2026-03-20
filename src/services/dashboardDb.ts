import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';
import { getMeta30SnapshotHistory } from '@/features/visitas-cognitos/services/meta30SnapshotsDb';
import { calcularPromedioAnual } from '@/features/radar-conectividad/services/radarSnapshotsDb';

// ============================================
// Meta 1: Servicio Social
// ============================================
export const getMeta1ServicioSocial = async (): Promise<MetaItem> => {
  const [alianzasCount, estudiantesCount, talleresCount, usuariosCapacitados] = await Promise.all([
    supabase.from('alianzas_universidades').select('*', { count: 'exact', head: true }),
    supabase.from('reclutamiento_estudiantes').select('*', { count: 'exact', head: true }),
    supabase.from('talleres_impartidos').select('*', { count: 'exact', head: true }),
    supabase.from('talleres_impartidos').select('usuarios_capacitados'),
  ]);

  const alianzas = alianzasCount.count || 0;
  const estudiantes = estudiantesCount.count || 0;
  const talleres = talleresCount.count || 0;
  const usuarios = (usuariosCapacitados.data || []).reduce((sum, t) => sum + (t.usuarios_capacitados || 0), 0);

  // Promedio ponderado: Alianzas 40%, Estudiantes 30%, Talleres 15%, Usuarios 15%
  const progreso = Math.round(
    (alianzas / 5) * 100 * 0.4 +
    (estudiantes / 60) * 100 * 0.3 +
    (talleres / 140) * 100 * 0.15 +
    (usuarios / 600) * 100 * 0.15
  );

  const metricas: MetaMetrica[] = [
    { label: 'Alianzas universitarias', valor: alianzas, meta: 5, peso: 40 },
    { label: 'Estudiantes reclutados', valor: estudiantes, meta: 60, peso: 30 },
    { label: 'Talleres impartidos', valor: talleres, meta: 140, peso: 15 },
    { label: 'Usuarios capacitados', valor: usuarios, meta: 600, peso: 15 },
  ];

  return {
    id: 'meta-1',
    titulo: 'Servicio Social',
    numero: 1,
    progreso: Math.min(progreso, 100),
    metricas,
    color: 'bg-blue-500',
    link: '/servicio-social',
  };
};

// ============================================
// Meta 2: Cumplimiento del 30% (Visitas Cognitos)
// ============================================
export const getMeta2Cumplimiento = async (): Promise<MetaItem> => {
  const añoActual = new Date().getFullYear();
  
  // 1. Obtener total de infoplazas del catálogo
  const { count: totalCatalogo } = await supabase
    .from('catalogo_infoplazas')
    .select('*', { count: 'exact', head: true });

  const totalIP = totalCatalogo || 0;

  // 2. Obtener datos de Meta 30 (última sincronización)
  const { data: sync } = await supabase
    .from('meta_30_sincronizacion')
    .select('data')
    .order('fecha_sincronizacion', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Meses ordenados
  const mesesOrdenados = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // 3. Procesar datos
  let ipSobre30 = 0;
  let ipDebajo30 = 0;
  let mesAnteriorSobre30 = 0;
  let mesActualNombre = '';

  if (sync?.data && Array.isArray(sync.data)) {
    const data = sync.data as Array<{
      Infoplaza?: string;
      Año?: string | number;
      Mes?: string;
      Porcentaje?: number | string;
    }>;

    // Filtrar por año actual
    const registrosAño = data.filter(r => {
      const añoReg = typeof r.Año === 'string' ? parseInt(r.Año) : r.Año;
      return añoReg === añoActual;
    });

    // Encontrar último mes con datos
    for (let i = mesesOrdenados.length - 1; i >= 0; i--) {
      const mes = mesesOrdenados[i];
      const registrosMes = registrosAño.filter(r => r.Mes === mes);
      
      if (registrosMes.length > 0) {
        mesActualNombre = mes;
        
        // Contar IPs sobre/debajo 30%
        registrosMes.forEach(r => {
          const pct = typeof r.Porcentaje === 'string' ? parseFloat(r.Porcentaje) : (r.Porcentaje || 0);
          if (pct >= 30) ipSobre30++;
          else ipDebajo30++;
        });
        
        // Buscar mes anterior para incremento
        if (i > 0) {
          const mesAnt = mesesOrdenados[i - 1];
          const registrosAnt = registrosAño.filter(r => r.Mes === mesAnt);
          registrosAnt.forEach(r => {
            const pct = typeof r.Porcentaje === 'string' ? parseFloat(r.Porcentaje) : (r.Porcentaje || 0);
            if (pct >= 30) mesAnteriorSobre30++;
          });
        }
        break;
      }
    }
  }

  // 4. Calcular incrementos
  const incrementoMes = ipSobre30 - mesAnteriorSobre30;
  const mesIndex = mesesOrdenados.indexOf(mesActualNombre);
  const metaAcumulada = mesIndex * 7; // Enero=0, Feb=7, Mar=14...

  // 5. Progreso global vs meta de 95 infoplazas sobre 30% al final del año
  const metaAnual = 95;
  const progreso = Math.min(Math.round((ipSobre30 / metaAnual) * 100), 100);

  const metricas: MetaMetrica[] = [
    { label: 'Sobre 30%', valor: ipSobre30, meta: totalIP },
    { label: 'Bajo 30%', valor: ipDebajo30, meta: totalIP },
    { label: 'Incremento mes', valor: incrementoMes, meta: 7 },
    { label: 'vs Meta acumulada', valor: ipSobre30, meta: metaAcumulada },
  ];

  // Obtener historial de snapshots para gráficos de evolución
  const historialRaw = await getMeta30SnapshotHistory(añoActual);
  const historial = historialRaw.map(s => ({
    fecha: s.fecha,
    mes_nombre: s.mes_nombre,
    ip_sobre_30: s.ip_sobre_30,
    meta_acumulada: s.meta_acumulada,
    meta_base: (s as any).meta_base || 0,
    progreso_pct: s.progreso_pct,
  }));

  return {
    id: 'meta-2',
    titulo: 'Cumplimiento del 30%',
    numero: 2,
    progreso,
    metricas,
    color: 'bg-emerald-500',
    link: '/visitas-incidencias',
    historial,
  };
};

// ============================================
// Meta 3: Mesas de Transformación
// ============================================
export const getMeta3Mesas = async (): Promise<MetaItem> => {
  // Obtener solo las completadas por región
  const { data: completadas } = await supabase
    .from('mesas_transformacion')
    .select('region, estado')
    .eq('estado', 'completada');

  // Contar completadas por región
  const completadasPorRegion: Record<string, number> = {};
  completadas?.forEach(m => {
    completadasPorRegion[m.region] = (completadasPorRegion[m.region] || 0) + 1;
  });

  // Configuración de regiones con pesos fijos (meta de 21 mesas)
  const configRegiones = [
    { region: 'Herrera', total: 6 },
    { region: 'Los Santos', total: 9 },
    { region: 'Coclé', total: 6 },
  ];
  const totalMeta = 21;

  // Calcular Avance Global ponderado y datos por región
  let progresoGlobal = 0;
  const metricasPorRegion: { region: string; completadas: number; total: number; avance: number; peso: number }[] = [];

  configRegiones.forEach(({ region, total }) => {
    const comp = completadasPorRegion[region] || 0;
    const avance = total > 0 ? Math.round((comp / total) * 100) : 0;
    const peso = total / totalMeta;

    // Avance ponderado
    progresoGlobal += (avance / 100) * peso;

    metricasPorRegion.push({ region, completadas: comp, total, avance, peso });
  });

  // Total completadas
  const totalCompletadas = completadas?.length || 0;

  const metricas: MetaMetrica[] = [
    { label: 'Mesas completadas', valor: totalCompletadas, meta: totalMeta },
  ];

  return {
    id: 'meta-3',
    titulo: 'Mesas de Transformación',
    numero: 3,
    progreso: Math.round(progresoGlobal * 100),
    metricas,
    color: 'bg-amber-500',
    link: '/mesas',
    regiones: metricasPorRegion,
  };
};

/**
 * Datos de un enlace para la Meta 4.
 * Incluye todas las métricas: Meta Mínima, Cumplimiento Mensual, Brecha, Tasa Éxito YTD.
 */
export interface EnlaceRutaData {
  enlace: string;
  totalIp: number;          // Total IPs en el itinerario
  metaMinima: number;        // ⌈IPs × 0.95⌉
  mesActual: {
    visitadas: number;       // IPs únicas visitadas este mes
    cumplimiento: number;    // % Cumplimiento
    brecha: number;          // Meta mínima - visitadas
    nombreMes: string;       // "Marzo"
  };
  tasaExitoYtd: number;      // % de meses que cumplió (mesesOK / mesesEval × 100)
  mesesCumplidos: number;    // Cantidad de meses OK
  mesesEvaluados: number;    // Cantidad de meses evaluados
  historial: {
    mes: string;
    visitadas: number;
    metaMinima: number;
    cumplimiento: number;
    cumple: boolean;
  }[];
}

// ============================================
// Meta 4: Cumplimiento de Rutas (Auditoría)
// Aplica las 4 fórmulas:
// 1. Meta Mínima = ⌈IPs × 0.95⌉
// 2. % Cumplimiento = (IPs visitadas / Total IPs) × 100
// 3. Brecha = Meta mínima - Visitadas
// 4. Tasa Éxito YTD = (MesesOK / MesesEval) × 100
// ============================================
export const getMeta4Rutas = async (): Promise<MetaItem> => {
  const mesActualNum = new Date().getMonth() + 1; // 1-12

  // Meses del año ordenados
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
  // visitMap[enlace][mes] = Set de IPs únicas
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
    const metaMinima = Math.ceil(totalIp * 0.95); // ⌈IPs × 0.95⌉
    const mesMap = visitMap.get(enlace) || new Map();

    // Historial por mes
    const historial: EnlaceRutaData['historial'] = [];
    let mesesCumplidos = 0;
    let mesesEvaluados = 0;
    let visitadasMesActual = 0;

    for (let i = 0; i < 12; i++) {
      const mesNum = i + 1;
      const mesNombre = mesesOrdenados[i];

      // Solo evaluar meses hasta el actual
      if (mesNum > mesActualNum) break;

      // Filtrar solo año actual
      const ipsVisitadasMes = [...(mesMap.get(mesNum) || [])].filter(ip => progSet.has(ip));
      const visitadas = ipsVisitadasMes.length;
      const cumplimiento = totalIp > 0 ? Math.round((visitadas / totalIp) * 100) : 0;
      const cumple = visitadas >= metaMinima;

      historial.push({
        mes: mesNombre.substring(0, 3), // "Ene", "Feb", etc.
        visitadas,
        metaMinima,
        cumplimiento,
        cumple,
      });

      mesesEvaluados++;
      if (cumple) mesesCumplidos++;

      // Guardar datos del mes actual
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

// ============================================
// Meta 5: KPAX (Radar Conectividad)
// ============================================
export const getMeta5Kpax = async (): Promise<MetaItem> => {
  // Ahora lee de radar_kpax_unificado (archivo 68)
  const [totalResult, criticosResult, promedioAnual] = await Promise.all([
    supabase.from('radar_kpax_unificado').select('*', { count: 'exact', head: true }),
    supabase.from('radar_kpax_unificado').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
    calcularPromedioAnual()
  ]);

  const total = totalResult.count || 0;
  const criticos = criticosResult.count || 0;
  const conectividad = total > 0 ? Math.round(((total - criticos) / total) * 100) : 0;

  const equiposOnline = total - criticos;

  const metricas: MetaMetrica[] = [
    { label: 'Equipos online', valor: equiposOnline, meta: 0 },
    { label: 'Índice de conectividad', valor: conectividad, meta: 100, unidad: '%' },
    { label: 'Equipos críticos', valor: criticos, meta: 0 },
    { label: 'Promedio anual', valor: promedioAnual, meta: 100, unidad: '%' },
  ];

  return {
    id: 'meta-5',
    titulo: 'KPAX',
    numero: 5,
    progreso: conectividad,
    metricas,
    color: 'bg-purple-500',
    link: '/radar',
  };
};

// ============================================
// Función principal: Obtener todas las metas
// ============================================
export const getDatosDashboard = async (): Promise<MetaItem[]> => {
  const [meta1, meta2, meta3, meta4, meta5] = await Promise.all([
    getMeta1ServicioSocial(),
    getMeta2Cumplimiento(),
    getMeta3Mesas(),
    getMeta4Rutas(),
    getMeta5Kpax(),
  ]);

  // Ordenar por número de meta
  return [meta1, meta2, meta3, meta4, meta5];
};
