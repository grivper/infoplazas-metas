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

/**
 * Mapeo de código de infoplaza -> { enlace, dia }.
 */
export interface InfoplazaEnlace {
  codigo: string;
  enlace: string;
  dia: string;
}

/** Tipo para el resultado de la query join de itinerario_enlaces. */
interface ItinerarioEnlaceRow {
  enlace_nombre: string | null;
  dia_semana: string | null;
  catalogo_infoplazas: { codigo: string } | null;
}

export const fetchInfoplazasEnlaceMap = async (): Promise<Record<string, InfoplazaEnlace>> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`
      enlace_nombre,
      dia_semana,
      catalogo_infoplazas!inner(
        codigo
      )
    `);

  if (error) {
    console.error('Error al obtener mapeo infoplaza-enlace:', error);
    throw error;
  }

  const map: Record<string, InfoplazaEnlace> = {};
  
  (data as unknown as ItinerarioEnlaceRow[] | null)?.forEach((item) => {
    const codigoCompleto = item.catalogo_infoplazas?.codigo;
    if (codigoCompleto) {
      // Extraer número del código (ej: "132-pese" -> "132")
      const numero = codigoCompleto.split('-')[0];
      map[numero] = {
        codigo: codigoCompleto,
        enlace: item.enlace_nombre || 'Sin asignar',
        dia: item.dia_semana || ''
      };
    }
  });

  return map;
};
