import { supabase } from '@/lib/supabase';

/**
 * Catálogo - Operaciones de limpieza masiva.
 * ⚠️ PELIGRO: truncateCatalogoInfoplazas elimina TODAS las infoplazas del catálogo,
 * incluyendo sus referencias en radar_kpax_unificado e itinerario_enlaces.
 * Usar solo cuando se necesita reimportar todo el catálogo desde cero.
 */
export const truncateCatalogoInfoplazas = async (): Promise<{ success: boolean; error?: Error }> => {
  try {
    const { data: ips, error: fetchError } = await supabase
      .from('catalogo_infoplazas')
      .select('id');

    if (fetchError) throw fetchError;
    if (!ips || ips.length === 0) return { success: true };

    const ipIds = ips.map(ip => ip.id);

    await supabase
      .from('radar_kpax_unificado')
      .delete()
      .in('infoplaza_id', ipIds);

    await supabase
      .from('itinerario_enlaces')
      .delete()
      .in('infoplaza_id', ipIds);

    const { error } = await supabase
      .from('catalogo_infoplazas')
      .delete()
      .in('id', ipIds);

    if (error) {
      console.error('Error al eliminar infoplazas:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en truncate:', err);
    return { success: false, error: err as Error };
  }
};