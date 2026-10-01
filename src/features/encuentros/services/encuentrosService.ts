import { supabase } from '@/lib/supabase';

export interface Encuentro {
  id: string;
  clave: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  sede: string;
  mensaje_template: string | null;
}

type EncuentroRow = Encuentro;

/** Obtiene el encuentro identificado por su clave estable. */
export const getEncuentroByClave = async (clave: string): Promise<Encuentro | null> => {
  const { data, error } = await supabase
    .from('encuentros')
    .select('id, clave, nombre, fecha_inicio, fecha_fin, sede, mensaje_template')
    .eq('clave', clave)
    .maybeSingle();

  if (error) throw error;

  return data as EncuentroRow | null;
};

/** Guarda el mensaje que se usará al contactar a los dinamizadores del encuentro. */
export const updateMensajeTemplate = async (
  encuentroId: string,
  mensajeTemplate: string,
): Promise<void> => {
  const { error } = await supabase
    .from('encuentros')
    .update({ mensaje_template: mensajeTemplate })
    .eq('id', encuentroId);

  if (error) throw error;
};
