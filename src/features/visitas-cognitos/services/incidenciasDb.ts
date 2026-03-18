import { supabase } from '@/lib/supabase';

/**
 * Tipos para Incidencias
 */
export type EstadoTicket = 'abierto' | 'en_seguimiento' | 'resuelto' | 'escalado';

export interface Incidencia {
  id: string;
  infoplaza_id: string;
  infoplaza_nombre?: string;
  categoria: string;
  urgencia: 'alta' | 'media' | 'baja';
  descripcion: string;
  estado_ticket: EstadoTicket;
  created_at: string;
  updated_at?: string;
}

/**
 * Tipos para Seguimientos
 */
export interface Seguimiento {
  id: string;
  incidencia_id: string;
  nota: string;
  accion: 'seguimiento' | 'resuelto' | 'escalado';
  created_at: string;
}

/**
 * Obtiene todas las incidencias con el nombre de la Infoplaza
 */
export const getIncidencias = async (): Promise<Incidencia[]> => {
  // Primero obtenemos las incidencias
  const { data: incidencias, error } = await supabase
    .from('incidencias_reportes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener incidencias:', error);
    return [];
  }

  if (!incidencias || incidencias.length === 0) {
    return [];
  }

  // Obtener los IDs de infoplazas únicas
  const infoplazaIds = [...new Set(incidencias.map(i => i.infoplaza_id))];
  
  // Obtener los nombres de las infoplazas
  const { data: infoplazas } = await supabase
    .from('catalogo_infoplazas')
    .select('id, nombre')
    .in('id', infoplazaIds);

  // Crear un mapa de ID -> nombre
  const infoplazaMap = new Map(
    (infoplazas || []).map(ip => [ip.id, ip.nombre])
  );

  // Transformar datos para incluir el nombre de la Infoplaza
  return incidencias.map(item => ({
    ...item,
    infoplaza_nombre: infoplazaMap.get(item.infoplaza_id) || 'Sin asignar',
  }));
};

/**
 * Crea una nueva incidencia
 */
export const createIncidencia = async (
  infoplazaId: string,
  categoria: string,
  urgencia: 'alta' | 'media' | 'baja',
  descripcion: string
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('incidencias_reportes')
    .insert({
      infoplaza_id: infoplazaId,
      categoria,
      urgencia,
      descripcion,
      estado_ticket: 'abierto',
    });

  if (error) {
    console.error('Error al crear incidencia:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene la lista de Infoplazas del catálogo
 */
export const getInfoplazas = async (): Promise<{ id: string; nombre: string }[]> => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al obtener infoplazas:', error);
    return [];
  }

  return data || [];
};

/**
 * Obtiene los seguimientos de una incidencia
 */
export const getSeguimientosByIncidencia = async (incidenciaId: string): Promise<Seguimiento[]> => {
  const { data, error } = await supabase
    .from('incidencias_seguimientos')
    .select('*')
    .eq('incidencia_id', incidenciaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al obtener seguimientos:', error);
    return [];
  }

  return data || [];
};

/**
 * Crea un nuevo seguimiento para una incidencia
 */
export const createSeguimiento = async (
  incidenciaId: string,
  nota: string,
  accion: 'seguimiento' | 'resuelto' | 'escalado'
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('incidencias_seguimientos')
    .insert({
      incidencia_id: incidenciaId,
      nota,
      accion,
    });

  if (error) {
    console.error('Error al crear seguimiento:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Actualiza el estado de una incidencia
 */
export const updateIncidenciaEstado = async (
  incidenciaId: string,
  nuevoEstado: EstadoTicket
): Promise<{ success: boolean; error?: Error }> => {
  const { error } = await supabase
    .from('incidencias_reportes')
    .update({ 
      estado_ticket: nuevoEstado,
      updated_at: new Date().toISOString()
    })
    .eq('id', incidenciaId);

  if (error) {
    console.error('Error al actualizar estado:', error);
    return { success: false, error };
  }

  return { success: true };
};

/**
 * Obtiene el conteo de incidencias resueltas
 */
export const getIncidenciasResueltasCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('incidencias_reportes')
    .select('*', { count: 'exact', head: true })
    .eq('estado_ticket', 'resuelto');

  if (error) {
    console.error('Error al contar incidencias resueltas:', error);
    return 0;
  }

  return count || 0;
};
