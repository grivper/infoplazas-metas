import { supabase } from '@/lib/supabase';

/**
 * Snapshot mensual del radar de conectividad
 */
export interface RadarMensualSnapshot {
  id: string;
  mes: string;  // YYYY-MM-DD (primer día del mes)
  total_dispositivos: number;
  online: number;
  critico: number;
  tasa_disponibilidad: number;
  nuevas_fallas: number;
  fallas_resueltas: number;
  created_at: string;
}

/**
 * Métricas calculadas para un snapshot
 */
export interface RadarMetricas {
  total_dispositivos: number;
  online: number;
  critico: number;
  tasa_disponibilidad: number;
  nuevas_fallas: number;
  fallas_resueltas: number;
}

/**
 * Obtiene el mes en formato YYYY-MM-01
 */
export const getMesActual = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

/**
 * Obtiene el mes anterior en formato YYYY-MM-01
 */
export const getMesAnterior = (): string => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

/**
 * Calcula métricas actuales del radar
 */
export const calcularMetricasActuales = async (): Promise<RadarMetricas> => {
  // Obtener todos los dispositivos
  const { data: dispositivos, count: total } = await supabase
    .from('radar_kpax_unificado')
    .select('estado', { count: 'exact' });

  if (!dispositivos || total === null) {
    return {
      total_dispositivos: 0,
      online: 0,
      critico: 0,
      tasa_disponibilidad: 0,
      nuevas_fallas: 0,
      fallas_resueltas: 0,
    };
  }

  const online = dispositivos.filter(d => d.estado === 'online').length;
  const critico = dispositivos.filter(d => d.estado === 'critico').length;
  const tasa_disponibilidad = total > 0 ? Number(((online / total) * 100).toFixed(2)) : 0;

  // Contar fallas del mes actual
  const mesActual = getMesActual();
  const mesSiguiente = new Date(mesActual);
  mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);

  const { count: nuevasFallas } = await supabase
    .from('radar_historial_fallas')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_registro', mesActual)
    .lt('fecha_registro', mesSiguiente.toISOString().split('T')[0]);

  const { count: fallasResueltas } = await supabase
    .from('radar_historial_fallas')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_arqueo', mesActual)
    .lt('fecha_arqueo', mesSiguiente.toISOString().split('T')[0])
    .eq('activo', false);

  return {
    total_dispositivos: total,
    online,
    critico,
    tasa_disponibilidad,
    nuevas_fallas: nuevasFallas || 0,
    fallas_resueltas: fallasResueltas || 0,
  };
};

/**
 * Guarda un snapshot mensual usando la función RPC
 */
export const guardarSnapshot = async (): Promise<RadarMensualSnapshot | null> => {
  const metricas = await calcularMetricasActuales();
  const mes = getMesActual();

  // Llamar a la función RPC que tiene bypass de RLS
  const { data, error } = await supabase.rpc('guardar_radar_snapshot', {
    p_mes: mes,
    p_total: metricas.total_dispositivos,
    p_online: metricas.online,
    p_critico: metricas.critico,
    p_tasa: metricas.tasa_disponibilidad,
    p_nuevas_fallas: metricas.nuevas_fallas,
    p_fallas_resueltas: metricas.fallas_resueltas,
  });

  if (error) {
    console.error('Error guardando snapshot:', error);
    return null;
  }

  // Recargar todos los snapshots para actualizar la vista
  await fetchSnapshots();
  
  return data as RadarMensualSnapshot;
};

/**
 * Obtiene todos los snapshots ordenados por mes
 */
export const fetchSnapshots = async (): Promise<RadarMensualSnapshot[]> => {
  const { data, error } = await supabase.rpc('get_radar_snapshots');

  if (error) {
    console.error('Error obteniendo snapshots:', error);
    return [];
  }

  // La función retorna un JSON array
  return (data || []) as RadarMensualSnapshot[];
};

/**
 * Obtiene el snapshot del mes anterior al dado
 */
export const fetchSnapshotAnterior = async (mes: string): Promise<RadarMensualSnapshot | null> => {
  const fecha = new Date(mes);
  fecha.setMonth(fecha.getMonth() - 1);
  const mesAnterior = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase.rpc('get_radar_snapshot_anterior', {
    p_mes: mesAnterior
  });

  if (error || !data) {
    return null;
  }

  return data as RadarMensualSnapshot;
};

/**
 * Obtiene el último snapshot registrado
 */
export const fetchUltimoSnapshot = async (): Promise<RadarMensualSnapshot | null> => {
  const { data, error } = await supabase.rpc('get_ultimo_radar_snapshot');

  if (error || !data) {
    return null;
  }

  return data as RadarMensualSnapshot;
};

/**
 * Calcula el promedio anual de efectividad
 */
export const calcularPromedioAnual = async (): Promise<number> => {
  const snapshots = await fetchSnapshots();
  
  if (snapshots.length === 0) {
    return 0;
  }

  const suma = snapshots.reduce((acc, s) => acc + s.tasa_disponibilidad, 0);
  return Number((suma / snapshots.length).toFixed(2));
};

/**
 * Formatea el mes para mostrar (ej: "Ene 2024")
 */
export const formatMes = (mes: string): string => {
  const fecha = new Date(mes);
  return fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

/**
 * Obtiene datos para el gráfico de evolución
 */
export const getEvolucionData = async () => {
  const snapshots = await fetchSnapshots();
  
  // Invertir para mostrar cronológicamente
  return snapshots.reverse().map(s => ({
    mes: formatMes(s.mes),
    total: s.total_dispositivos,
    online: s.online,
    critico: s.critico,
    efectividad: s.tasa_disponibilidad,
  }));
};
