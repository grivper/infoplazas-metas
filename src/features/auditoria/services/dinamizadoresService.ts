import { supabase } from '@/lib/supabase';
import { crearConfirmacionPendiente } from '@/features/encuentros/services/confirmacionesService';

export type DinamizadorEstatus = 'Activo' | 'Inactivo';

export interface Dinamizador {
  id: string;
  infoplaza_codigo: string;
  nombre: string;
  cedula: string | null;
  celular: string | null;
  email: string | null;
  sexo: string | null;
  talla: string | null;
  estatus: DinamizadorEstatus;
  created_at: string;
  updated_at: string;
}

export interface DinamizadorInput {
  infoplaza_codigo: string;
  nombre: string;
  cedula: string;
  celular: string;
  email: string;
  sexo: string;
  talla: string;
  estatus: DinamizadorEstatus;
}

export interface InfoplazaCatalogo {
  codigo: string;
  nombre: string;
  cerrada: boolean;
}

/** Fila del roster, con o sin dinamizador asignado. */
export interface EncuentroViewRow {
  infoplaza: InfoplazaCatalogo;
  dinamizador: Dinamizador | null;
}

type DinamizadorRow = Omit<Dinamizador, 'cedula' | 'celular' | 'email' | 'sexo' | 'talla'> & {
  cedula: string | null;
  celular: string | null;
  email: string | null;
  sexo: string | null;
  talla: string | null;
};

const mapInputToRow = (input: DinamizadorInput) => ({
  ...input,
  nombre: input.nombre.trim(),
  cedula: input.cedula.trim() || null,
  celular: input.celular.trim() || null,
  email: input.email.trim() || null,
  sexo: input.sexo.trim() || null,
  talla: input.talla.trim() || null,
});

/** Obtiene los dinamizadores ordenados alfabéticamente por nombre. */
export const getDinamizadores = async (): Promise<Dinamizador[]> => {
  const { data, error } = await supabase
    .from('dinamizadores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;

  return (data ?? []) as DinamizadorRow[];
};

/** Obtiene el catálogo mínimo necesario para seleccionar una infoplaza. */
export const getCatalogoInfoplazas = async (): Promise<InfoplazaCatalogo[]> => {
  const { data, error } = await supabase
    .from('catalogo_infoplazas')
    .select('codigo, nombre, cerrada')
    .order('nombre', { ascending: true });

  if (error) throw error;

  return (data ?? []) as InfoplazaCatalogo[];
};

/** Combina el catálogo completo con el dinamizador asignado a cada infoplaza. */
export const buildEncuentroViewRows = (
  infoplazas: InfoplazaCatalogo[],
  dinamizadores: Dinamizador[],
): EncuentroViewRow[] => {
  const dinamizadorPorInfoplaza = new Map(
    dinamizadores.map((dinamizador) => [dinamizador.infoplaza_codigo, dinamizador]),
  );

  return infoplazas.map((infoplaza) => ({
    infoplaza,
    dinamizador: dinamizadorPorInfoplaza.get(infoplaza.codigo) ?? null,
  }));
};

/** Crea un dinamizador nuevo y su confirmación pendiente para el encuentro vigente. */
export const createDinamizador = async (input: DinamizadorInput): Promise<void> => {
  const { data, error } = await supabase
    .from('dinamizadores')
    .insert(mapInputToRow(input))
    .select('id')
    .single();

  if (error) throw error;

  // Solo los activos participan del encuentro.
  if (input.estatus === 'Activo') await crearConfirmacionPendiente(data.id);
};

/** Actualiza los datos de un dinamizador existente. */
export const updateDinamizador = async (
  id: string,
  input: DinamizadorInput,
): Promise<void> => {
  const { error } = await supabase
    .from('dinamizadores')
    .update(mapInputToRow(input))
    .eq('id', id);

  if (error) throw error;
};
