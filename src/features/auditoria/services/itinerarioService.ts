import { supabase } from '@/lib/supabase';

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
 * Usa un JOIN para evitar N+1 queries.
 */
export const getItinerarioEnlaces = async (): Promise<ItinerarioEnlace[]> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`
      *,
      catalogo_infoplazas:id(infoplaza_id:id, nombre, codigo)
    `)
    .order('enlace_nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener itinerario de enlaces:', error);
    throw error;
  }

  // Fallback: si el JOIN no funciona, usar query simple
  if (!data || data.length === 0) return [];

  // Verificar si el JOIN retornó datos relacionados
  const hasJoinData = data[0] && 'catalogo_infoplazas' in data[0];
  
  if (!hasJoinData) {
    // Fallback: obtener nombres de infoplazas por separado
    const ipIds = [...new Set(data.map(r => r.infoplaza_id).filter(Boolean))];
    if (ipIds.length === 0) return data;

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
  }

  // Datos con JOIN
  return data.map(r => ({
    ...r,
    infoplaza_nombre: r.catalogo_infoplazas?.nombre,
    infoplaza_codigo: r.catalogo_infoplazas?.codigo
  }));
};

/**
 * Tipo de retorno unificado para operaciones de itinerario.
 */
type ItinerarioResult<T = ItinerarioEnlace> = 
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * Actualiza un registro de itinerario.
 */
export const updateItinerarioEnlace = async (
  id: string,
  updates: Partial<ItinerarioEnlace>
): Promise<ItinerarioResult> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar itinerario:', error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, data };
};

/**
 * Crea un nuevo registro de itinerario.
 * Valida parámetros de entrada.
 */
export const createItinerarioEnlace = async (
  enlace_nombre: string,
  infoplaza_id: string,
  dia_ruta?: string,
  dia_semana?: string
): Promise<{ success: boolean; error?: Error }> => {
  // Validar parámetros obligatorios
  if (!enlace_nombre?.trim()) {
    return { success: false, error: new Error('El nombre del enlace es obligatorio') };
  }
  if (!infoplaza_id?.trim()) {
    return { success: false, error: new Error('El ID de la infoplaza es obligatorio') };
  }

  const { error } = await supabase
    .from('itinerario_enlaces')
    .insert({
      enlace_nombre: enlace_nombre.trim(),
      infoplaza_id: infoplaza_id.trim(),
      dia_ruta: dia_ruta?.trim() || null,
      dia_semana: dia_semana?.trim() || null,
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