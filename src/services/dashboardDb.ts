import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';

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

  const progreso = Math.round(
    ((alianzas / 5) * 100 + (estudiantes / 60) * 100 + (talleres / 140) * 100 + (usuarios / 600) * 100) / 4
  );

  const metricas: MetaMetrica[] = [
    { label: 'Alianzas universitarias', valor: alianzas, meta: 5 },
    { label: 'Estudiantes reclutados', valor: estudiantes, meta: 60 },
    { label: 'Talleres impartidos', valor: talleres, meta: 140 },
    { label: 'Usuarios capacitados', valor: usuarios, meta: 600 },
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
  const { count: totalVisitas } = await supabase
    .from('cognito_registros')
    .select('*', { count: 'exact', head: true });

  const [incidenciasTotal, incidenciasResueltas] = await Promise.all([
    supabase.from('incidencias_reportes').select('*', { count: 'exact', head: true }),
    supabase.from('incidencias_reportes').select('*', { count: 'exact', head: true }).eq('estado_ticket', 'resuelto'),
  ]);

  const visitas = totalVisitas || 0;
  const incidencias = incidenciasTotal.count || 0;
  const resueltas = incidenciasResueltas.count || 0;

  // Meta: 900 visitas por año (300 por enlace)
  const progreso = Math.min(Math.round((visitas / 900) * 100), 100);

  const metricas: MetaMetrica[] = [
    { label: 'Visitas registradas', valor: visitas, meta: 900 },
    { label: 'Incidencias reportadas', valor: incidencias, meta: 0 },
    { label: 'Incidencias resueltas', valor: resueltas, meta: incidencias },
  ];

  return {
    id: 'meta-2',
    titulo: 'Cumplimiento del 30%',
    numero: 2,
    progreso,
    metricas,
    color: 'bg-emerald-500',
    link: '/visitas-incidencias',
  };
};

// ============================================
// Meta 3: Mesas de Transformación
// ============================================
export const getMeta3Mesas = async (): Promise<MetaItem> => {
  const { count: totalMesasSupabase } = await supabase
    .from('mesas_transformacion')
    .select('*', { count: 'exact', head: true });

  const { count: completadasSupabase } = await supabase
    .from('mesas_transformacion')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'completada');

  const instaladas = totalMesasSupabase || 0;
  const finalizadas = completadasSupabase || 0;
  const meta = 15;

  const progreso = Math.round((instaladas / meta) * 100);

  const metricas: MetaMetrica[] = [
    { label: 'Mesas instaladas', valor: instaladas, meta },
    { label: 'Mesas finalizadas', valor: finalizadas, meta },
  ];

  return {
    id: 'meta-3',
    titulo: 'Mesa de Transformación',
    numero: 3,
    progreso: Math.min(progreso, 100),
    metricas,
    color: 'bg-amber-500',
    link: '/mesas',
  };
};

// ============================================
// Meta 4: Cumplimiento de Rutas (Auditoría)
// Calcula el % de visitas que coinciden con el itinerario de cada enlace
// (igual que PlanVisitasView)
// ============================================
export const getMeta4Rutas = async (): Promise<MetaItem> => {
  // 1. Obtener itinerarios (rutas planificadas por enlace)
  const { data: itinerarios } = await supabase
    .from('itinerario_enlaces')
    .select('enlace_nombre, infoplaza_id');

  // 2. Obtener visitas de Cognito (sin filtro de fecha para simplificar)
  const { data: cognito } = await supabase
    .from('cognito_registros')
    .select('enlace_original, infoplaza_id');

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

  // 3. Agrupar itinerarios por enlace
  const progMap = new Map<string, Set<string>>(); // enlace -> infoplazas_programadas
  itinerarios.forEach((i) => {
    if (!progMap.has(i.enlace_nombre)) progMap.set(i.enlace_nombre, new Set());
    progMap.get(i.enlace_nombre)!.add(i.infoplaza_id);
  });

  // 4. Obtener solo enlaces que están en el itinerario (ignora visitas especiales)
  const enlacesEnItinerario = new Set(progMap.keys());

  // 5. Cruce: solo contar visitas de enlaces que están en el itinerario
  const visitMap = new Map<string, Set<string>>(); // enlace -> infoplazas_visitadas
  cognito.forEach((c) => {
    // Solo considerar si el enlace está en el itinerario
    if (c.enlace_original && enlacesEnItinerario.has(c.enlace_original) && c.infoplaza_id) {
      if (!visitMap.has(c.enlace_original)) visitMap.set(c.enlace_original, new Set());
      visitMap.get(c.enlace_original)!.add(c.infoplaza_id);
    }
  });

  // 6. Calcular cumplimiento por enlace
  const datosEnlaces: { enlace: string; cumplimiento: number }[] = [];
  progMap.forEach((progSet, enlace) => {
    const visitSet = visitMap.get(enlace) || new Set();
    // Contar solo las visitadas que estaban programadas
    const visitadas = [...progSet].filter(ip => visitSet.has(ip)).length;
    const cumplimiento = progSet.size > 0 ? Math.round((visitadas / progSet.size) * 100) : 0;
    datosEnlaces.push({ enlace, cumplimiento });
  });

  // 7. Calcular promedio global
  const promedioGlobal = datosEnlaces.length > 0
    ? Math.round(datosEnlaces.reduce((sum, e) => sum + e.cumplimiento, 0) / datosEnlaces.length)
    : 0;

  const metricas: MetaMetrica[] = datosEnlaces.map(e => ({
    label: e.enlace,
    valor: e.cumplimiento,
    meta: 85,
    unidad: '%'
  }));

  // Agregar promedio global al inicio
  metricas.unshift({
    label: 'Promedio Global',
    valor: promedioGlobal,
    meta: 85,
    unidad: '%'
  });

  return {
    id: 'meta-4',
    titulo: 'Cumplimiento de Rutas',
    numero: 4,
    progreso: promedioGlobal,
    metricas,
    color: 'bg-indigo-500',
    link: '/auditoria',
  };
};

// ============================================
// Meta 5: KPAX (Radar Conectividad)
// ============================================
export const getMeta5Kpax = async (): Promise<MetaItem> => {
  // Ahora lee de radar_kpax_unificado (archivo 68)
  const { count: totalEquipos } = await supabase
    .from('radar_kpax_unificado')
    .select('*', { count: 'exact', head: true });

  const { count: equiposCriticos } = await supabase
    .from('radar_kpax_unificado')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'critico');

  const total = totalEquipos || 0;
  const criticos = equiposCriticos || 0;
  const conectividad = total > 0 ? Math.round(((total - criticos) / total) * 100) : 0;

  const metricas: MetaMetrica[] = [
    { label: 'Índice de conectividad', valor: conectividad, meta: 100, unidad: '%' },
    { label: 'Equipos críticos', valor: criticos, meta: 0 },
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
