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
 * Obtiene todos los talleres conjoin a reclutamiento e infoplaza
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

  // Si hay datos, obtenemos los nombres relacionados
  if (data && data.length > 0) {
    const talleres = await Promise.all(
      data.map(async (t) => {
        let nombreInfoplaza = '';
        let periodoLectivo = '';

        // Obtener infoplaza desde reclutamiento
        if (t.reclutamiento_id) {
          const { data: reclu } = await supabase
            .from('reclutamiento_estudiantes')
            .select('infoplaza_id, periodo_lectivo')
            .eq('id', t.reclutamiento_id)
            .single();

          if (reclu?.infoplaza_id) {
            const { data: info } = await supabase
              .from('catalogo_infoplazas')
              .select('nombre')
              .eq('id', reclu.infoplaza_id)
              .single();
            nombreInfoplaza = info?.nombre || '';
          }

          periodoLectivo = reclu?.periodo_lectivo || '';
        }

        return {
          ...t,
          nombre_infoplaza: nombreInfoplaza,
          periodo_lectivo: periodoLectivo,
        };
      })
    );

    return talleres;
  }

  return data || [];
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
