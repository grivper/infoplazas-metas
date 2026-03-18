/**
 * Servicio de rutas - Lee de Supabase
 * Reemplaza la versión legacy que usaba IndexedDB
 */

import { supabase } from '@/lib/supabase';

/**
 * Obtiene todas las visitas de Cognito desde Supabase
 */
export const getAllVisitasCognito = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('cognito_registros')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener visitas de Cognito:', error);
    return [];
  }

  return data || [];
};
