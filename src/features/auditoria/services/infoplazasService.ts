import { supabase } from '@/lib/supabase';

/**
 * Interfaz para el Catálogo Maestro de Infoplazas en Supabase.
 */
export interface Infoplaza {
  id?: string;       // UUID generado por Supabase
  codigo: string;   // Identificador único de negocio (IP-XXX o slug)
  nombre: string;   // Nombre descriptivo
  region: string;   // Región/Provincia (Obligatorio)
  created_at?: string;
  updated_at?: string;
}

/**
 * Realiza un upsert masivo de Infoplazas en la tabla `catalogo_infoplazas`.
 * Utiliza el campo `codigo` para manejar conflictos y actualizaciones.
 * 
 * @param data Array de objetos Infoplaza a procesar.
 * @returns Promesa con el resultado de la operación.
 */
export const upsertInfoplazasBatch = async (data: Infoplaza[]) => {
  if (data.length === 0) return { error: null };

  const { data: result, error } = await supabase
    .from('catalogo_infoplazas')
    .upsert(data, { 
      onConflict: 'codigo',
      ignoreDuplicates: false // Queremos que actualice nombre/region si el código coincide
    })
    .select();

  if (error) {
    console.error('Error en upsertInfoplazasBatch:', error);
    throw error;
  }

  return { data: result, error: null };
};

/**
 * Obtiene todas las infoplazas activas en el catálogo.
 */
export const fetchAllInfoplazas = async () => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener infoplazas:', error);
    throw error;
  }

  return data as Infoplaza[];
};

/**
 * Genera un código (slug) basado en el nombre si no se proporciona uno.
 */
export const generateInfoplazaCode = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza no-alfanuméricos por guiones
    .replace(/^-+|-+$/g, '');       // Limpia guiones al inicio/fin
};
