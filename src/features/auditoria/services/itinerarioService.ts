import { supabase } from '@/lib/supabase';
import type { Infoplaza } from './infoplazasService';

/**
 * Interfaz para el Itinerario de Enlaces en Supabase.
 */
export interface ItinerarioEnlace {
  id: string;
  enlace_nombre: string;
  dia_ruta: string | null;
  dia_semana: string | null;
  infoplaza_id: string;
  infoplaza_nombre?: string;
  infoplaza_codigo?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las rutas de enlaces con datos de infoplaza.
 */
export const getItinerarioEnlaces = async (): Promise<ItinerarioEnlace[]> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select('*')
    .order('enlace_nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener itinerario de enlaces:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Obtener nombres de infoplazas
  const ipIds = [...new Set(data.map(r => r.infoplaza_id).filter(Boolean))];
  const { data: ipData } = await supabase
    .from('catalogo_infoplazas')
    .select('id, nombre, codigo')
    .in('id', ipIds);

  const ipMap = new Map((ipData || []).map(ip => [ip.id, ip]));

  return data.map(r => ({
    ...r,
    infoplaza_nombre: ipMap.get(r.infoplaza_id)?.nombre,
    infoplaza_codigo: ipMap.get(r.infoplaza_id)?.codigo
  }));
};

/**
 * Actualiza un registro de itinerario.
 */
export const updateItinerarioEnlace = async (
  id: string,
  updates: Partial<ItinerarioEnlace>
) => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar itinerario:', error);
    throw error;
  }

  return data;
};

/**
 * Crea un nuevo registro de itinerario.
 */
export const createItinerarioEnlace = async (
  enlace_nombre: string,
  infoplaza_id: string,
  dia_ruta?: string,
  dia_semana?: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .insert({
      enlace_nombre,
      infoplaza_id,
      dia_ruta: dia_ruta || null,
      dia_semana: dia_semana || null,
    });

  if (error) {
    console.error('Error al crear itinerario:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Elimina un registro de itinerario.
 */
export const deleteItinerarioEnlace = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar itinerario:', error);
    return { success: false };
  }

  return { success: true };
};