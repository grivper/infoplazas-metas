import { supabase } from '@/lib/supabase';

/**
 * Catálogo Maestro de Infoplazas en Supabase.
 */
export interface Infoplaza {
  id?: string;
  codigo: string;
  nombre: string;
  region: string;
  cerrada?: boolean;
  fecha_cierre?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Mapeo de código de infoplaza -> información de enlace.
 */
export interface InfoplazaEnlace {
  codigo: string;
  enlace: string;
  dia: string;
  dia_semana: string | null;
  cerrada: boolean;
}

/**
 * Resultado de query join de itinerario_enlaces con catalogo_infoplazas.
 */
interface ItinerarioEnlaceRow {
  enlace_nombre: string | null;
  dia_semana: string | null;
  catalogo_infoplazas: { codigo: string; cerrada: boolean } | null;
}

/**
 * Upsert masivo de Infoplazas en el catálogo.
 */
export const upsertInfoplazasBatch = async (data: Infoplaza[]) => {
  if (data.length === 0) return { error: null };

  const { data: result, error } = await supabase
    .from('catalogo_infoplazas')
    .upsert(data, { 
      onConflict: 'codigo',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('Error en upsertInfoplazasBatch:', error);
    throw error;
  }

  return { data: result, error: null };
};

/**
 * Obtiene todas las infoplazas del catálogo.
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
 * Genera un código (slug) a partir del nombre.
 */
export const generateInfoplazaCode = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Obtiene mapa de número de Infoplaza -> info de enlace.
 */
export const fetchInfoplazasEnlaceMap = async (): Promise<Record<string, InfoplazaEnlace>> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`
      enlace_nombre,
      dia_semana,
      catalogo_infoplazas!inner(
        codigo,
        cerrada
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
      const numero = codigoCompleto.split('-')[0];
      map[numero] = {
        codigo: codigoCompleto,
        enlace: item.enlace_nombre || 'Sin asignar',
        dia: item.dia_semana || '',
        dia_semana: item.dia_semana,
        cerrada: item.catalogo_infoplazas?.cerrada ?? false
      };
    }
  });

  return map;
};

/**
 * Infoplazas sin ruta en itinerario (sin asignar).
 */
export const getInfoplazasSinItinerario = async (): Promise<Infoplaza[]> => {
  const { data: conRuta, error: errorRuta } = await supabase
    .from('itinerario_enlaces')
    .select('infoplaza_id');

  if (errorRuta) {
    console.error('Error al obtener itinerario:', errorRuta);
    throw errorRuta;
  }

  const idsConRuta = new Set(conRuta?.map(r => r.infoplaza_id) || []);

  const { data: todas, error: errorTodas } = await supabase
    .from('catalogo_infoplazas')
    .select('*')
    .order('codigo', { ascending: true });

  if (errorTodas) {
    console.error('Error al obtener catálogo:', errorTodas);
    throw errorTodas;
  }

  const sinItinerario = (todas || []).filter(ip => 
    !idsConRuta.has(ip.id || '') && !ip.cerrada
  );

  return sinItinerario;
};

/**
 * Infoplazas cerradas.
 */
export const getInfoplazasCerradas = async (): Promise<Infoplaza[]> => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('*')
    .eq('cerrada', true)
    .order('codigo', { ascending: true });

  if (error) {
    console.error('Error al obtener infoplazas cerradas:', error);
    throw error;
  }

  return data as Infoplaza[];
};

/**
 * Obtiene todas las infoplazas.
 */
export const getAllInfoplazas = async (): Promise<Infoplaza[]> => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('*')
    .order('codigo', { ascending: true });

  if (error) {
    console.error('Error al obtener infoplazas:', error);
    throw error;
  }

  return data as Infoplaza[];
};

/**
 * Crea una nueva infoplaza.
 */
export const createInfoplaza = async (
  codigo: string,
  nombre: string,
  region: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('catalogo_infoplazas')
    .insert({
      codigo,
      nombre,
      region,
      cerrada: false,
    });

  if (error) {
    console.error('Error al crear infoplaza:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Alterna estado abierto/cerrado de una infoplaza.
 */
export const toggleEstadoInfoplaza = async (
  id: string,
  cerrar: boolean
): Promise<{ success: boolean; error?: Error }> => {
  const updates: Partial<Infoplaza> = {
    cerrada: cerrar,
  };

  if (cerrar) {
    updates.fecha_cierre = new Date().toISOString().split('T')[0];
    
    const { error: deleteError } = await supabase
      .from('itinerario_enlaces')
      .delete()
      .eq('infoplaza_id', id);
    
    if (deleteError) {
      console.warn('Warning: No se pudieron eliminar rutas asociadas:', deleteError);
    }
  } else {
    updates.fecha_cierre = null;
  }

  const { error } = await supabase
    .from('catalogo_infoplazas')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error al togglear estado:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene todas las infoplazas (para dropdowns).
 */
export const getInfoplazasAbiertas = async (): Promise<Infoplaza[]> => {
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