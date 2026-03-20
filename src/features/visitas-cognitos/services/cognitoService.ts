import { supabase } from '@/lib/supabase';

/**
 * Interfaz para los registros de Cognito en Supabase.
 */
export interface CognitoRegistro {
  id?: string;
  cognito_referencia: string;
  infoplaza_id: string; // Relación foránea obligatoria (UUID)
  fecha: string;        // Formato ISO o YYYY-MM-DD
  mes: number;
  visitas: number;
  horas: number;
  infoplaza_original?: string;
  enlace_original?: string;
}

/**
 * Inserta un lote de registros de Cognito en la base de datos de Supabase.
 * Usa upsert para evitar duplicados (basado en cognito_referencia único).
 * @param registros Array de registros a insertar.
 */
export const insertCognitoBatch = async (registros: CognitoRegistro[]) => {
  if (registros.length === 0) return { error: null };

  // Eliminar duplicados del array por cognito_referencia
  const uniqueMap = new Map<string, CognitoRegistro>();
  registros.forEach(reg => uniqueMap.set(reg.cognito_referencia, reg));
  const uniqueRegistros = Array.from(uniqueMap.values());

  const { data, error } = await supabase
    .from('cognito_registros')
    .upsert(uniqueRegistros, { 
      onConflict: 'cognito_referencia',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('Error al insertar registros de Cognito:', error);
    throw error;
  }

  return { data, error: null };
};

/**
 * Obtiene las referencias de Cognito ya existentes para un conjunto de meses.
 * Útil para prevenir duplicados antes de subir.
 * 
 * @param meses Array de meses a consultar.
 */
export const getExistingReferences = async (meses: number[]): Promise<Set<string>> => {
  if (meses.length === 0) return new Set();

  const { data, error } = await supabase
    .from('cognito_registros')
    .select('cognito_referencia')
    .in('mes', meses);

  if (error) {
    console.error('Error al obtener referencias existentes:', error);
    throw error;
  }

  return new Set(data.map(r => r.cognito_referencia));
};

/**
 * Obtiene todos los registros de Cognito con información de la Infoplaza.
 */
export const fetchCognitoRegistros = async () => {
  const { data, error } = await supabase
    .from('cognito_registros')
    .select(`
      *,
      catalogo_infoplazas (
        nombre,
        codigo
      )
    `)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener registros de Cognito:', error);
    throw error;
  }

  return data;
};


