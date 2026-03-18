import { supabase } from '@/lib/supabase';

/**
 * Tipo para historial de fallas
 */
export interface HistorialFalla {
  id?: string;
  agente_id: string;
  infoplaza?: string;
  motivo_falla: string;
  fecha_registro?: string;
  fecha_arqueo?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todo el historial de fallas desde Supabase
 * Ordenado por fecha de registro descendente (más recientes primero)
 */
export const fetchHistorialFallas = async (): Promise<HistorialFalla[]> => {
  const { data, error } = await supabase
    .from('radar_historial_fallas')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error) {
    console.error('Error obteniendo historial de fallas:', error);
    return [];
  }

  return data || [];
};
