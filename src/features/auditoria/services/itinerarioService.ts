import { supabase } from '@/lib/supabase';
import { fetchAllInfoplazas, type Infoplaza } from './infoplazasService';

// ── Tipos compartidos ────────────────────────────────────────────────────────

/** Itinerario de Enlace (DB row) */
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

/** Itinerario para inserción batch (CSV upload) */
export interface ItinerarioInsert {
  id?: string;
  enlace_nombre: string;
  dia_ruta: string;
  dia_semana: string;
  infoplaza_id: string;
}

// ── Operaciones CRUD individuales ───────────────────────────────────────────

/** Obtiene todas las rutas de enlaces con datos de infoplaza (JOIN). */
export const getItinerarioEnlaces = async (): Promise<ItinerarioEnlace[]> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`*, catalogo_infoplazas(nombre, codigo)`)
    .order('enlace_nombre', { ascending: true });

  if (error) { console.error('Error al obtener itinerario:', error); throw error; }
  if (!data || data.length === 0) return [];

  return data.map(r => ({
    ...r,
    infoplaza_nombre: r.catalogo_infoplazas?.nombre,
    infoplaza_codigo: r.catalogo_infoplazas?.codigo,
  }));
};

type ItinerarioResult<T = ItinerarioEnlace> = { success: true; data: T } | { success: false; error: Error };

export const updateItinerarioEnlace = async (id: string, updates: Partial<ItinerarioEnlace>): Promise<ItinerarioResult> => {
  const { data, error } = await supabase.from('itinerario_enlaces').update(updates).eq('id', id).select().single();
  if (error) return { success: false, error: new Error(error.message) };
  return { success: true, data };
};

export const createItinerarioEnlace = async (
  enlace_nombre: string, infoplaza_id: string, dia_ruta?: string, dia_semana?: string
): Promise<{ success: boolean; error?: Error }> => {
  if (!enlace_nombre?.trim()) return { success: false, error: new Error('Nombre del enlace obligatorio') };
  if (!infoplaza_id?.trim()) return { success: false, error: new Error('ID de infoplaza obligatorio') };
  const { error } = await supabase.from('itinerario_enlaces').insert({
    enlace_nombre: enlace_nombre.trim(), infoplaza_id: infoplaza_id.trim(),
    dia_ruta: dia_ruta?.trim() || null, dia_semana: dia_semana?.trim() || null,
  });
  if (error) { console.error('Error al crear itinerario:', error); return { success: false, error }; }
  return { success: true };
};

export const deleteItinerarioEnlace = async (id: string): Promise<{ success: boolean }> => {
  const { error } = await supabase.from('itinerario_enlaces').delete().eq('id', id);
  if (error) { console.error('Error al eliminar itinerario:', error); return { success: false }; }
  return { success: true };
};

// ── Operaciones batch (CSV upload) ──────────────────────────────────────────

const extractInfoplazaNumber = (text: string): string | null => {
  const match = text.match(/\d+/);
  return match ? match[0] : null;
};

export class InfoplazaLookup {
  private cache: Infoplaza[];

  constructor(cache: Infoplaza[]) {
    this.cache = cache;
  }

  findId(searchValue: string): string | null {
    const norm = (v: string) => v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const searchNum = extractInfoplazaNumber(searchValue);
    const searchNorm = norm(searchValue);
    if (searchNum) {
      const m = this.cache.find(ip => extractInfoplazaNumber(ip.nombre) === searchNum || extractInfoplazaNumber(ip.codigo || '') === searchNum);
      if (m) return m.id || null;
    }
    const exact = this.cache.find(ip => norm(ip.codigo || '') === searchNorm || norm(ip.nombre) === searchNorm);
    if (exact) return exact.id || null;
    const incl = this.cache.find(ip => searchNorm.includes(norm(ip.nombre)) || norm(ip.nombre).includes(searchNorm));
    return incl?.id || null;
  }
}

export const getInfoplazaLookup = async (): Promise<InfoplazaLookup> => {
  const infoplazas = await fetchAllInfoplazas();
  return new InfoplazaLookup(infoplazas);
};

export const deleteItinerariosByEnlace = async (enlaceNombre: string) => {
  const { error } = await supabase.from('itinerario_enlaces').delete().eq('enlace_nombre', enlaceNombre);
  if (error) { console.error('Error eliminando itinerarios previos:', error); throw error; }
};

export const insertItinerariosBatch = async (data: ItinerarioInsert[]) => {
  if (data.length === 0) return;
  const { error } = await supabase.from('itinerario_enlaces').insert(data);
  if (error) { console.error('Error insertando itinerarios:', error); throw error; }
};

export const fetchAllItinerarios = async () => {
  const { data, error } = await supabase.from('itinerario_enlaces').select(`
    id, enlace_nombre, dia_ruta, dia_semana, infoplaza_id,
    catalogo_infoplazas (nombre)
  `);
  if (error) { console.error('Error al obtener todos los itinerarios:', error); throw error; }
  return (data || []).map(it => {
    const cp = it.catalogo_infoplazas;
    const nombre = Array.isArray(cp) ? cp[0]?.nombre : (cp as { nombre?: string } | null)?.nombre || 'Desconocida';
    return { id: it.id, enlace: it.enlace_nombre, dia_ruta: it.dia_ruta, dia_semana: it.dia_semana, infoplaza: nombre, infoplaza_id: it.infoplaza_id || null };
  });
};
