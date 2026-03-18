import { supabase } from '@/lib/supabase';
import { fetchAllInfoplazas, type Infoplaza } from './infoplazasService';

/**
 * Extrae la primera secuencia numérica de un texto (ej: "599 - Barrios" -> "599").
 */
const extractInfoplazaNumber = (text: string): string | null => {
  const match = text.match(/\d+/);
  return match ? match[0] : null;
};

/**
 * Interfaz para el Itinerario de Enlaces en Supabase.
 */
export interface Itinerario {
  id?: string;
  enlace_nombre: string;
  dia_ruta: string;
  dia_semana: string;
  infoplaza_id: string; // Relación UUID a catalogo_infoplazas
}

/**
 * Clase auxiliar para la resolución de IDs de Infoplazas.
 * Mantiene una caché en memoria para evitar múltiples consultas a la base de datos.
 */
export class InfoplazaLookup {
  private cache: Infoplaza[] = [];

  constructor(cache: Infoplaza[]) {
    this.cache = cache;
  }

  /**
   * Busca el UUID de una infoplaza por número, código o nombre.
   * Prioriza la extracción de números para un cruce más preciso.
   */
  findId(searchValue: string): string | null {
    const normalize = (val: string) => 
      val.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const searchNumber = extractInfoplazaNumber(searchValue);
    const searchNormalized = normalize(searchValue);

    // 1. Nivel 1: Cruce Numérico Estricto (Mandatorio por arquitectura)
    // Si el CSV tiene un número, buscamos en el catálogo el mismo número extraído del nombre
    if (searchNumber) {
      const numMatch = this.cache.find(ip => {
        const dbNumber = extractInfoplazaNumber(ip.nombre) || extractInfoplazaNumber(ip.codigo || '');
        return dbNumber === searchNumber;
      });
      if (numMatch) return numMatch.id || null;
    }

    // 2. Nivel 2: Match Exactos (Normalizados) como fallback
    const exactMatch = this.cache.find(ip => 
      normalize(ip.codigo || '') === searchNormalized || normalize(ip.nombre) === searchNormalized
    );
    if (exactMatch) return exactMatch.id || null;

    // 3. Nivel 3: Match por Inclusión (Si el catálogo está dentro del string del CSV)
    const inclusionMatch = this.cache.find(ip => {
      const dbNombreNorm = normalize(ip.nombre);
      return searchNormalized.includes(dbNombreNorm) || dbNombreNorm.includes(searchNormalized);
    });
    if (inclusionMatch) return inclusionMatch.id || null;

    return null;
  }
}

/**
 * Inicializa la caché de infoplazas y devuelve una instancia de lookup.
 */
export const getInfoplazaLookup = async (): Promise<InfoplazaLookup> => {
  const infoplazas = await fetchAllInfoplazas();
  return new InfoplazaLookup(infoplazas);
};

/**
 * Elimina todos los itinerarios de un enlace específico.
 * Se usa antes de cargar un nuevo archivo para evitar duplicados.
 */
export const deleteItinerariosByEnlace = async (enlaceNombre: string) => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .delete()
    .eq('enlace_nombre', enlaceNombre);

  if (error) {
    console.error('Error eliminando itinerarios previos:', error);
    throw error;
  }
};

/**
 * Inserta un lote de itinerarios en Supabase.
 */
export const insertItinerariosBatch = async (data: Itinerario[]) => {
  if (data.length === 0) return;

  const { error } = await supabase
    .from('itinerario_enlaces')
    .insert(data);

  if (error) {
    console.error('Error insertando itinerarios:', error);
    throw error;
  }
};

/**
 * Obtiene todos los itinerarios de la base de datos.
 * Incluye el nombre de la infoplaza mediante un join.
 */
export const fetchAllItinerarios = async () => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`
      id,
      enlace_nombre,
      dia_ruta,
      dia_semana,
      infoplaza_id,
      catalogo_infoplazas (
        nombre
      )
    `);

  if (error) {
    console.error('Error al obtener todos los itinerarios:', error);
    throw error;
  }

  // Aplanamos la respuesta para facilitar el uso en el frontend
  return (data || []).map(it => {
    const cp = it.catalogo_infoplazas;
    const nombre = Array.isArray(cp) ? cp[0]?.nombre : (cp as { nombre?: string } | null)?.nombre || 'Desconocida';
    
    return {
      id: it.id,
      enlace: it.enlace_nombre,
      dia_ruta: it.dia_ruta,
      dia_semana: it.dia_semana,
      infoplaza: nombre,
      infoplaza_id: it.infoplaza_id || null
    };
  });
};

