/**
 * Servicio de persistencia para Mesas de Transformación (Meta 3).
 * Usa Supabase (PostgreSQL).
 */

import { supabase } from '@/lib/supabase';

// --- Tipos exportados ---
export interface MesaRecord {
  id?: string;           // UUID generado por Supabase
  mesa_id: string;       // ID único: infoplaza-mesa (ej. "penonome-mesa-1")
  infoplaza: string;     // Nombre de la Infoplaza
  region: string;        // Coclé | Los Santos | Herrera
  mesa: number;          // 1, 2, o 3
  sesionActual: number;  // 1 a 10 (progreso)
  participantes: number;  // Cantidad de participantes
  dinamizador: string;   // Nombre del dinamizador capacitado
  fechaInicio: string;   // Fecha de inicio (YYYY-MM-DD)
  fechaFin: string;      // Fecha de fin (YYYY-MM-DD o vacío)
  estado: 'pendiente' | 'en_progreso' | 'completada';
  created_at?: string;
  updated_at?: string;
}

// --- Tipo para el catálogo de infoplazas ---
export interface InfoplazaCatalogo {
  id: string;
  nombre: string;
  region: string;
}

// --- Obtiene el catálogo de infoplazas desde Supabase ---
export const getCatalogoInfoplazas = async (): Promise<InfoplazaCatalogo[]> => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('id, nombre, region')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('[Mesas] Error al obtener catálogo:', error);
    return [];
  }

  return (data || []) as InfoplazaCatalogo[];
};

// --- Mapeo de campos entre DB y app ---
interface DbMesaRow {
  id: string;
  mesa_id: string;
  infoplaza: string;
  region: string;
  mesa: number;
  sesion_actual: number;
  participantes: number;
  dinamizador: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  created_at?: string;
  updated_at?: string;
}

const mapRowToMesa = (row: DbMesaRow): MesaRecord => ({
  id: row.id,
  mesa_id: row.mesa_id,
  infoplaza: row.infoplaza,
  region: row.region,
  mesa: row.mesa,
  sesionActual: row.sesion_actual,
  participantes: row.participantes,
  dinamizador: row.dinamizador || '',
  fechaInicio: row.fecha_inicio || '',
  fechaFin: row.fecha_fin || '',
  estado: row.estado,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapMesaToRow = (mesa: Partial<MesaRecord>): Partial<DbMesaRow> => ({
  mesa_id: mesa.mesa_id,
  infoplaza: mesa.infoplaza,
  region: mesa.region,
  mesa: mesa.mesa,
  sesion_actual: mesa.sesionActual,
  participantes: mesa.participantes,
  dinamizador: mesa.dinamizador || null,
  fecha_inicio: mesa.fechaInicio || null,
  fecha_fin: mesa.fechaFin || null,
  estado: mesa.estado,
});

// --- Genera el ID único de una mesa ---
export const generarMesaId = (infoplaza: string, mesa: number): string =>
  `${infoplaza.toLowerCase().replace(/\s/g, '-')}-mesa-${mesa}`;

// --- Upsert: Guarda o actualiza una mesa ---
export const upsertMesa = async (record: MesaRecord): Promise<void> => {
  const rowData = mapMesaToRow(record);
  
  const { error } = await supabase
    .from('mesas_transformacion')
    .upsert(rowData, {
      onConflict: 'mesa_id',
    });

  if (error) {
    console.error('[Mesas] Error en upsert:', error);
    throw error;
  }
};

// --- Lee todas las mesas ---
export const getAllMesas = async (): Promise<MesaRecord[]> => {
  const { data, error } = await supabase
    .from('mesas_transformacion')
    .select('*')
    .order('infoplaza', { ascending: true })
    .order('mesa', { ascending: true });

  if (error) {
    console.error('[Mesas] Error al leer:', error);
    return [];
  }

  return (data || []).map(mapRowToMesa);
};

// --- Elimina una mesa por ID ---
export const deleteMesa = async (id: string): Promise<void> => {
  // Buscar por mesa_id (que es el id visible para el usuario)
  const { error } = await supabase
    .from('mesas_transformacion')
    .delete()
    .eq('mesa_id', id);

  if (error) {
    console.error('[Mesas] Error al eliminar:', error);
    throw error;
  }
};
