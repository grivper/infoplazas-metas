/**
 * Servicio de rutas - Lee de Supabase
 * Reemplaza la versión legacy que usaba IndexedDB
 */

import { supabase } from '@/lib/supabase';

/** Tipo para el registro de Cognito en la base de datos. */
export interface CognitoRegistroDb {
  id: string;
  cognito_referencia: string;
  infoplaza_id: string;
  fecha: string;
  mes: number;
  visitas: number;
  horas: number;
  infoplaza_original: string;
  enlace_original: string;
  created_at?: string;
}

/**
 * Obtiene todas las visitas de Cognito desde Supabase.
 */
export const getAllVisitasCognito = async (): Promise<CognitoRegistroDb[]> => {
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
