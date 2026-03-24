import { supabase } from '@/lib/supabase';

/**
 * Interfaz para el Catálogo Maestro de Infoplazas en Supabase.
 */
export interface Infoplaza {
  id?: string;       // UUID generado por Supabase
  codigo: string;   // Identificador único de negocio (IP-XXX o slug)
  nombre: string;   // Nombre descriptivo
  region: string;   // Región/Provincia (Obligatorio)
  cerrada?: boolean;  // Estado: true = cerrada, false = abierta
  fecha_cierre?: string | null;  // Fecha cuando se cerró
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

/**
 * Obtiene todas las infoplazas (incluye campos de cierre).
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
 * Crea una nueva infoplaza en el catálogo.
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
 * Alterna el estado de una infoplaza (abierta <-> cerrada).
 * Si se cierra, registra la fecha actual. Si se abre, limpia la fecha.
 */
export const toggleEstadoInfoplaza = async (
  id: string,
  cerrar: boolean
): Promise<{ success: boolean; error?: Error }> => {
  const updates: Partial<Infoplaza> = {
    cerrada: cerrar,
  };

  if (cerrar) {
    // Agregar fecha de cierre
    updates.fecha_cierre = new Date().toISOString().split('T')[0];
    
    // IMPORTANTE: Eliminar las rutas asociadas a esta infoplaza cuando se cierra
    const { error: deleteError } = await supabase
      .from('itinerario_enlaces')
      .delete()
      .eq('infoplaza_id', id);
    
    if (deleteError) {
      console.warn('Warning: No se pudieron eliminar rutas asociadas:', deleteError);
    }
  } else {
    // Limpiar fecha de cierre al abrir
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
 * Interfaz para las rutas de enlaces.
 */
export interface ItinerarioEnlace {
  id: string;
  enlace_nombre: string;
  dia_ruta: string | null;
  dia_semana: string | null;
  infoplaza_id: string;
  infoplaza_nombre?: string;
  infoplaza_codigo?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las infoplazas (para dropdowns de rutas).
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

/**
 * Obtiene todas las rutas de enlaces con datos de infoplaza.
 */
export const getItinerarioEnlaces = async (): Promise<ItinerarioEnlace[]> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select('*')
    .order('enlace_nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener itinerario de enlaces:', error);
    throw error;
  }

  if (!data || data.length === 0) return [];

  // Obtener nombres de infoplazas
  const ipIds = [...new Set(data.map(r => r.infoplaza_id).filter(Boolean))];
  const { data: ipData } = await supabase
    .from('catalogo_infoplazas')
    .select('id, nombre, codigo')
    .in('id', ipIds);

  const ipMap = new Map((ipData || []).map(i => [i.id, { nombre: i.nombre, codigo: i.codigo }]));

  return data.map(r => ({
    ...r,
    infoplaza_nombre: ipMap.get(r.infoplaza_id)?.nombre || 'Sin asignar',
    infoplaza_codigo: ipMap.get(r.infoplaza_id)?.codigo || '',
  }));
};

/**
 * Actualiza una ruta de enlace (asignar infoplaza, cambiar día, etc.).
 */
export const updateItinerarioEnlace = async (
  id: string,
  updates: Partial<ItinerarioEnlace>
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar ruta:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Crea una nueva ruta de enlace.
 */
export const createItinerarioEnlace = async (
  enlace_nombre: string,
  infoplaza_id: string,
  dia_ruta?: string,
  dia_semana?: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .insert({
      enlace_nombre,
      infoplaza_id,
      dia_ruta: dia_ruta || null,
      dia_semana: dia_semana || null,
    });

  if (error) {
    console.error('Error al crear ruta:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Elimina una ruta de enlace.
 */
export const deleteItinerarioEnlace = async (
  id: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('itinerario_enlaces')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar ruta:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Elimina todas las infoplazas del catálogo (para poder reimportar).
 * Primero elimina las referencias en radar_kpax_unificado.
 */
export const truncateCatalogoInfoplazas = async (): Promise<{ success: boolean; error?: Error }> => {
  try {
    // 1. Primero obtener los IDs de las infoplazas
    const { data: ips, error: fetchError } = await supabase
      .from('catalogo_infoplazas')
      .select('id');

    if (fetchError) throw fetchError;
    if (!ips || ips.length === 0) return { success: true };

    const ipIds = ips.map(ip => ip.id);

    // 2. Eliminar referencias en radar_kpax_unificado
    const { error: radarError } = await supabase
      .from('radar_kpax_unificado')
      .delete()
      .in('infoplaza_id', ipIds);

    if (radarError) {
      console.warn('Warning: No se pudieron eliminar referencias en radar_kpax_unificado:', radarError);
    }

    // 3. Eliminar referencias en itinerario_enlaces
    const { error: itinError } = await supabase
      .from('itinerario_enlaces')
      .delete()
      .in('infoplaza_id', ipIds);

    if (itinError) {
      console.warn('Warning: No se pudieron eliminar referencias en itinerario_enlaces:', itinError);
    }

    // 4. Finalmente eliminar las infoplazas
    const { error } = await supabase
      .from('catalogo_infoplazas')
      .delete()
      .in('id', ipIds);

    if (error) {
      console.error('Error al eliminar infoplazas:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en truncate:', err);
    return { success: false, error: err as Error };
  }
};
