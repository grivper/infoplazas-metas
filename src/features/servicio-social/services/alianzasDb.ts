import { supabase } from '@/lib/supabase';

/**
 * Tipos para Alianzas con Universidades
 */
export interface Alianza {
  id: string;
  nombre_universidad: string;
  fecha_reunion: string | null;
  acuerdos_minuta: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene todas las alianzas
 */
export const getAlianzas = async (): Promise<Alianza[]> => {
  const { data, error } = await supabase
    .from('alianzas_universidades')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener alianzas:', error);
    return [];
  }

  return data || [];
};

/**
 * Crea una nueva alianza
 */
export const createAlianza = async (
  nombreUniversidad: string,
  fechaReunion: string | null,
  acuerdosMinuta: string | null
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('alianzas_universidades')
    .insert({
      nombre_universidad: nombreUniversidad,
      fecha_reunion: fechaReunion,
      acuerdos_minuta: acuerdosMinuta,
    });

  if (error) {
    console.error('Error al crear alianza:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene el conteo de alianzas
 */
export const getAlianzasCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('alianzas_universidades')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error al contar alianzas:', error);
    return 0;
  }

  return count || 0;
};
