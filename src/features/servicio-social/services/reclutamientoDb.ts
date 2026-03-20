import { supabase } from '@/lib/supabase';

/**
 * Tipos para Reclutamiento de Estudiantes
 */
export type EstadoEstudiante = 'activo' | 'completado' | 'cancelado';

export interface Reclutamiento {
  id: string;
  universidad_id: string | null;
  infoplaza_id: string | null;
  created_at: string;
  updated_at: string;
  // Datos del estudiante
  nombre_estudiante: string | null;
  cedula: string | null;
  carrera: string | null;
  anio_cursa: string | null;
  estado: EstadoEstudiante;
  // Para mostrar nombre de universidad e infoplaza
  nombre_universidad?: string;
  nombre_infoplaza?: string;
}

/**
 * Obtiene todos los reclutamientos con join a universidades e infoplazas.
 * Optimizado: hace máximo 3 queries (no N+1).
 */
export const getReclutamientos = async (): Promise<Reclutamiento[]> => {
  const { data, error } = await supabase
    .from('reclutamiento_estudiantes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener reclutamientos:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Recolectar IDs únicos para evitar N+1 queries
  const uniIds = [...new Set(data.map(r => r.universidad_id).filter(Boolean))];
  const ipIds = [...new Set(data.map(r => r.infoplaza_id).filter(Boolean))];

  // Queries bulk en paralelo
  const [uniData, ipData] = await Promise.all([
    uniIds.length > 0
      ? supabase.from('alianzas_universidades').select('id,nombre_universidad').in('id', uniIds)
      : { data: [] },
    ipIds.length > 0
      ? supabase.from('catalogo_infoplazas').select('id,nombre').in('id', ipIds)
      : { data: [] },
  ]);

  // Mapear por ID para lookup O(1)
  const uniMap = new Map((uniData.data || []).map(u => [u.id, u.nombre_universidad]));
  const ipMap = new Map((ipData.data || []).map(i => [i.id, i.nombre]));

  return data.map(r => ({
    ...r,
    nombre_universidad: r.universidad_id ? uniMap.get(r.universidad_id) || '' : '',
    nombre_infoplaza: r.infoplaza_id ? ipMap.get(r.infoplaza_id) || '' : '',
  }));
};

/**
 * Crea un nuevo estudiante reclutado
 */
export const createReclutamiento = async (
  universidadId: string | null,
  infoplazaId: string | null,
  nombreEstudiante: string,
  cedula: string,
  carrera: string,
  anioCursa: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('reclutamiento_estudiantes')
    .insert({
      universidad_id: universidadId,
      infoplaza_id: infoplazaId,
      nombre_estudiante: nombreEstudiante,
      cedula: cedula,
      carrera: carrera,
      anio_cursa: anioCursa,
    });

  if (error) {
    console.error('Error al crear reclutamiento:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene el total de estudiantes reclutados
 */
export const getTotalEstudiantesReclutados = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('reclutamiento_estudiantes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error al obtener total de estudiantes:', error);
    return 0;
  }

  return count || 0;
};

/**
 * Actualiza el estado de un estudiante
 */
export const updateEstadoEstudiante = async (
  estudianteId: string,
  nuevoEstado: EstadoEstudiante
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('reclutamiento_estudiantes')
    .update({ 
      estado: nuevoEstado,
      updated_at: new Date().toISOString()
    })
    .eq('id', estudianteId);

  if (error) {
    console.error('Error al actualizar estado:', error);
    return { success: false, error };
  }

  return { success: true };
};
