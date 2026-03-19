import { supabase } from '@/lib/supabase';

/**
 * Snapshot mensual de Meta 30%
 */
export interface Meta30Snapshot {
  id: string;
  fecha: string;
  ip_sobre_30: number;
  ip_debajo_30: number;
  total_ip: number;
  meta_acumulada: number;
  progreso_pct: number;
  mes_nombre: string;
  created_at: string;
  updated_at: string;
}

/**
 * Guarda/actualiza el snapshot del mes actual
 */
export const saveMeta30Snapshot = async (): Promise<Meta30Snapshot | null> => {
  const { data, error } = await supabase.rpc('save_meta_30_snapshot');
  
  if (error) {
    console.error('Error al guardar snapshot:', error);
    return null;
  }
  
  return data;
};

/**
 * Obtiene el historial de snapshots
 */
export const getMeta30SnapshotHistory = async (year?: number): Promise<Meta30Snapshot[]> => {
  const { data, error } = await supabase.rpc('get_meta_30_snapshot_history', { 
    year_filter: year || null 
  });
  
  if (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
  
  return data || [];
};

/**
 * Obtiene solo el último snapshot
 */
export const getLastMeta30Snapshot = async (): Promise<Meta30Snapshot | null> => {
  const { data, error } = await supabase
    .from('meta_30_snapshots')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error('Error al obtener último snapshot:', error);
    return null;
  }
  
  return data;
};
