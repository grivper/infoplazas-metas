import { supabase } from '@/lib/supabase';

/**
 * Tipos para Talleres Impartidos
 */
export interface Taller {
  id: string;
  reclutamiento_id: string | null;
  tema_taller: string;
  usuarios_capacitados: number;
  fecha_ejecucion: string | null;
  created_at: string;
  updated_at: string;
  // Para mostrar nombres relacionados
  nombre_infoplaza?: string;
  periodo_lectivo?: string;
}

/**
 * Obtiene todos los talleres con join a reclutamiento e infoplaza
 * Optimizado: usa queries bulk para evitar N+1
 */
export const getTalleres = async (): Promise<Taller[]> => {
  const { data, error } = await supabase
    .from('talleres_impartidos')
    .select('*')
    .order('fecha_ejecucion', { ascending: false });

  if (error) {
    console.error('Error al obtener talleres:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Recolectar IDs únicos para evitar N+1 queries
  const reclutamientoIds = [...new Set(data.map(t => t.reclutamiento_id).filter(Boolean))];

  // Queries bulk en paralelo: obtener reclutamientos e infoplazas
  const [recluData, infoData] = await Promise.all([
    reclutamientoIds.length > 0
      ? supabase.from('reclutamiento_estudiantes').select('id, infoplaza_id, periodo_lectivo').in('id', reclutamientoIds)
      : { data: [] },
    supabase.from('catalogo_infoplazas').select('id, nombre')
  ]);

  // Mapear por ID para lookup O(1)
  const recluMap = new Map((recluData.data || []).map(r => [r.id, r]));
  const infoMap = new Map((infoData.data || []).map(i => [i.id, i.nombre]));

  // Mapear talleres con datos relacionados
  return data.map(t => {
    const reclu = t.reclutamiento_id ? recluMap.get(t.reclutamiento_id) : null;
    const nombreInfoplaza = reclu?.infoplaza_id ? infoMap.get(reclu.infoplaza_id) || '' : '';
    
    return {
      ...t,
      nombre_infoplaza: nombreInfoplaza,
      periodo_lectivo: reclu?.periodo_lectivo || '',
    };
  });
};

/**
 * Crea un nuevo taller
 */
export const createTaller = async (
  reclutamientoId: string | null,
  temaTaller: string,
  usuariosCapacitados: number,
  fechaEjecucion: string | null
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('talleres_impartidos')
    .insert({
      reclutamiento_id: reclutamientoId,
      tema_taller: temaTaller,
      usuarios_capacitados: usuariosCapacitados,
      fecha_ejecucion: fechaEjecucion,
    });

  if (error) {
    console.error('Error al crear taller:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene el conteo de talleres
 */
export const getTalleresCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('talleres_impartidos')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error al contar talleres:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Obtiene el total de usuarios capacitados
 */
export const getTotalUsuariosCapacitados = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('talleres_impartidos')
    .select('usuarios_capacitados');

  if (error) {
    console.error('Error al obtener total de usuarios capacitados:', error);
    return 0;
  }

  return (data || []).reduce((sum, t) => sum + (t.usuarios_capacitados || 0), 0);
};

/**
 * Obtiene el conteo de talleres por reclutamiento_id
 */
export const getTalleresCountByReclutamiento = async (reclutamientoId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('talleres_impartidos')
    .select('*', { count: 'exact', head: true })
    .eq('reclutamiento_id', reclutamientoId);

  if (error) {
    console.error('Error al contar talleres por reclutamiento:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Obtiene el conteo de talleres para múltiples reclutamientos en una sola query (evita N+1)
 * Retorna un Map con reclutamientoId -> conteo
 */
export const getTalleresCountBulk = async (reclutamientoIds: string[]): Promise<Map<string, number>> => {
  if (reclutamientoIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('talleres_impartidos')
    .select('reclutamiento_id')
    .in('reclutamiento_id', reclutamientoIds);

  if (error) {
    console.error('Error al obtener conteo bulk de talleres:', error);
    return new Map();
  }

  // Contar por reclutamiento
  const countMap = new Map<string, number>();
  (data || []).forEach(t => {
    const id = t.reclutamiento_id;
    countMap.set(id, (countMap.get(id) || 0) + 1);
  });

  return countMap;
};
