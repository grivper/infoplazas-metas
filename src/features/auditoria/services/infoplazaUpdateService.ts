import { supabase } from '@/lib/supabase';

/** Campos del catálogo que el usuario puede corregir desde la tabla. */
export interface InfoplazaEditable {
  codigo: string;
  nombre: string;
  region: string;
  distrito?: string | null;
  corregimiento?: string | null;
}

export interface UpdateInfoplazaResult {
  success: boolean;
  /** true cuando el nuevo código ya lo usa otra infoplaza (único en la base). */
  duplicado?: boolean;
  error?: Error;
}

/** Código de Postgres para "violación de restricción única". */
const UNIQUE_VIOLATION = '23505';

/** Texto vacío se guarda como null para no mezclar '' con "sin dato". */
const textoOrNull = (value?: string | null): string | null => value?.trim() || null;

/**
 * Actualiza los datos de una infoplaza por su id.
 * Si cambia el código, los dinamizadores lo siguen gracias al ON UPDATE CASCADE.
 */
export const updateInfoplaza = async (
  id: string,
  datos: InfoplazaEditable
): Promise<UpdateInfoplazaResult> => {
  const { error } = await supabase
    .from('catalogo_infoplazas')
    .update({
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      region: datos.region,
      distrito: textoOrNull(datos.distrito),
      corregimiento: textoOrNull(datos.corregimiento),
    })
    .eq('id', id);

  if (error) {
    console.error('Error al actualizar infoplaza:', error);
    return {
      success: false,
      duplicado: error.code === UNIQUE_VIOLATION,
      error: new Error(error.message),
    };
  }

  return { success: true };
};
