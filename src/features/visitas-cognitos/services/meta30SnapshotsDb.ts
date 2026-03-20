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

