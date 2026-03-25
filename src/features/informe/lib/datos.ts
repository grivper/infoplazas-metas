/**
 * Obtiene los datos de cada meta desde Supabase
 */
import { supabase } from '@/lib/supabase';

export interface Meta1Data {
  universidades: number;
  estudiantes: number;
  talleres: number;
  usuarios: number;
  talleresPorMes: { mes: string; cantidad: number; usuarios: number }[];
}

export interface Meta2Data {
  historial: { mes: string; ip_sobre_30: number; total: number; progreso: number }[];
  incidencias: number;
}

export interface Meta3Data {
  mesas: { region: string; mesa: number; estado: string; participantes: number; dinamizador: string; infoplaza: string }[];
  totalCompletadas: number;
  totalProgreso: number;
}

export interface Meta4Data {
  tasaExito: number;
  enlaces: { nombre: string; cumplimiento: number; visitadas: number; meta: number }[];
}

export interface Meta5Data {
  equiposOnline: number;
  equiposTotal: number;
  conectividad: number;
  criticos: number;
}

/**
 * Meta 1: Servicio Social
 */
export const getMeta1Data = async (): Promise<Meta1Data> => {
  const [{ count: universidades }, { count: estudiantes }, { data: talleresData }] = await Promise.all([
    supabase.from('alianzas_universidades').select('*', { count: 'exact', head: true }),
    supabase.from('reclutamiento_estudiantes').select('*', { count: 'exact', head: true }),
    supabase.from('talleres_impartidos').select('fecha_ejecucion, usuarios_capacitados')
  ]);

  const talleres = talleresData?.length || 0;
  const usuarios = talleresData?.reduce((sum, t) => sum + (t.usuarios_capacitados || 0), 0) || 0;

  // Agrupar por mes
  const talleresPorMesMap = new Map<string, { cantidad: number; usuarios: number }>();
  talleresData?.forEach(t => {
    if (t.fecha_ejecucion) {
      const mes = new Date(t.fecha_ejecucion).toLocaleString('es-ES', { month: 'long' });
      const actual = talleresPorMesMap.get(mes) || { cantidad: 0, usuarios: 0 };
      actual.cantidad += 1;
      actual.usuarios += t.usuarios_capacitados || 0;
      talleresPorMesMap.set(mes, actual);
    }
  });

  const mesesOrden = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const talleresPorMes = mesesOrden.map(mes => ({
    mes,
    cantidad: talleresPorMesMap.get(mes)?.cantidad || 0,
    usuarios: talleresPorMesMap.get(mes)?.usuarios || 0
  }));

  return { universidades: universidades || 0, estudiantes: estudiantes || 0, talleres, usuarios, talleresPorMes };
};

/**
 * Meta 2: Cumplimiento 30%
 */
export const getMeta2Data = async (): Promise<Meta2Data> => {
  const [{ data: snapshots }, { count: incidencias }] = await Promise.all([
    supabase.from('meta_30_snapshots').select('mes_nombre, ip_sobre_30, total_ip, progreso_pct').order('fecha'),
    supabase.from('incidencias_reportes').select('*', { count: 'exact', head: true })
  ]);

  const historial = (snapshots || []).map(s => ({
    mes: s.mes_nombre || '',
    ip_sobre_30: s.ip_sobre_30 || 0,
    total: s.total_ip || 0,
    progreso: parseFloat(s.progreso_pct) || 0
  }));

  return { historial, incidencias: incidencias || 0 };
};

/**
 * Meta 3: Mesas de Transformación
 */
export const getMeta3Data = async (): Promise<Meta3Data> => {
  const { data: mesas } = await supabase
    .from('mesas_transformacion')
    .select('region, mesa, estado, participantes, dinamizador, infoplaza');

  const mesasData = (mesas || []).map(m => ({
    region: m.region || '',
    mesa: m.mesa || 0,
    estado: m.estado || 'pendiente',
    participantes: m.participantes || 0,
    dinamizador: m.dinamizador || '',
    infoplaza: m.infoplaza || ''
  }));

  return {
    mesas: mesasData,
    totalCompletadas: mesasData.filter(m => m.estado === 'completada').length,
    totalProgreso: mesasData.filter(m => m.estado === 'en_progreso').length
  };
};

/**
 * Meta 4: Plan de Visitas
 */
export const getMeta4Data = async (): Promise<Meta4Data> => {
  const [{ data: itinerarios }, { data: visitas }] = await Promise.all([
    supabase.from('itinerario_enlaces').select('enlace_nombre, infoplaza_id'),
    supabase.from('cognito_registros').select('enlace_original, infoplaza_id')
  ]);

  const progMap = new Map<string, Set<string>>();
  itinerarios?.forEach(i => {
    if (!progMap.has(i.enlace_nombre)) progMap.set(i.enlace_nombre, new Set());
    progMap.get(i.enlace_nombre)!.add(i.infoplaza_id);
  });

  const enlaces: { nombre: string; cumplimiento: number; visitadas: number; meta: number }[] = [];
  progMap.forEach((progSet, enlace) => {
    const meta = progSet.size;
    const visitSet = new Set<string>();
    visitas?.forEach(v => {
      if (v.enlace_original === enlace && progSet.has(v.infoplaza_id)) {
        visitSet.add(v.infoplaza_id);
      }
    });
    const visitadas = visitSet.size;
    const cumplimiento = meta > 0 ? Math.round((visitadas / meta) * 100) : 0;
    enlaces.push({ nombre: enlace, cumplimiento, visitadas, meta });
  });

  const tasaExito = enlaces.length > 0
    ? Math.round(enlaces.reduce((sum, e) => sum + e.cumplimiento, 0) / enlaces.length)
    : 0;

  return { tasaExito, enlaces };
};

/**
 * Meta 5: KPAX
 */
export const getMeta5Data = async (): Promise<Meta5Data> => {
  const { data: kpax } = await supabase.from('radar_kpax_unificado').select('estado');
  const equiposTotal = kpax?.length || 0;
  const equiposOnline = kpax?.filter(e => e.estado === 'online').length || 0;
  const criticos = kpax?.filter(e => e.estado === 'critico').length || 0;
  const conectividad = equiposTotal > 0 ? Math.round((equiposOnline / equiposTotal) * 100) : 0;
  return { equiposOnline, equiposTotal, conectividad, criticos };
};

/**
 * Obtiene todos los datos de una vez
 */
export const getAllMetasData = async () => {
  return Promise.all([getMeta1Data(), getMeta2Data(), getMeta3Data(), getMeta4Data(), getMeta5Data()]);
};
