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
 * Obtiene todos los reclutamientos con join a universidades e infoplazas
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

  // Si hay datos, intentamos obtener los nombres relacionados
  if (data && data.length > 0) {
    const reclutamientos = await Promise.all(
      data.map(async (r) => {
        let nombreUniversidad = '';
        let nombreInfoplaza = '';

        // Obtener nombre de universidad
        if (r.universidad_id) {
          const { data: uni } = await supabase
            .from('alianzas_universidades')
            .select('nombre_universidad')
            .eq('id', r.universidad_id)
            .single();
          nombreUniversidad = uni?.nombre_universidad || '';
        }

        // Obtener nombre de infoplaza
        if (r.infoplaza_id) {
          const { data: info } = await supabase
            .from('catalogo_infoplazas')
            .select('nombre')
            .eq('id', r.infoplaza_id)
            .single();
          nombreInfoplaza = info?.nombre || '';
        }

        return {
          ...r,
          nombre_universidad: nombreUniversidad,
          nombre_infoplaza: nombreInfoplaza,
        };
      })
    );

    return reclutamientos;
  }

  return data || [];
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
 * Obtiene el conteo de reclutamientos
 */
export const getReclutamientosCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('reclutamiento_estudiantes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error al contar reclutamientos:', error);
    return 0;
  }

  return count || 0;
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
