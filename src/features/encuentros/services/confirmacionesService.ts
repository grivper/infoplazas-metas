import { supabase } from '@/lib/supabase';

export type EstadoEnvio = 'pendiente' | 'enviado' | 'confirmado';

export interface Confirmacion {
  id: string;
  estado_envio: EstadoEnvio;
  dinamizador: {
    nombre: string;
    celular: string | null;
    infoplaza: {
      nombre: string;
    } | null;
  };
}

type ConfirmacionQueryRow = {
  id: string;
  estado_envio: EstadoEnvio;
  dinamizadores: {
    nombre: string;
    celular: string | null;
    catalogo_infoplazas: {
      nombre: string;
    } | null;
  } | null;
};

/** Obtiene las confirmaciones con los datos de contacto y la infoplaza legible. */
export const getConfirmacionesByEncuentro = async (
  encuentroId: string,
): Promise<Confirmacion[]> => {
  const { data, error } = await supabase
    .from('confirmaciones')
    .select(`
      id,
      estado_envio,
      dinamizadores (
        nombre,
        celular,
        catalogo_infoplazas (nombre)
      )
    `)
    .eq('encuentro_id', encuentroId)
    .order('estado_envio')
    .order('created_at');

  if (error) throw error;

  // SAFETY: this nested shape matches the explicit Supabase select above; the client lacks generated DB types.
  return ((data ?? []) as unknown as ConfirmacionQueryRow[]).flatMap((confirmacion) => {
    if (!confirmacion.dinamizadores) return [];

    return [{
      id: confirmacion.id,
      estado_envio: confirmacion.estado_envio,
      dinamizador: {
        nombre: confirmacion.dinamizadores.nombre,
        celular: confirmacion.dinamizadores.celular,
        infoplaza: confirmacion.dinamizadores.catalogo_infoplazas,
      },
    }];
  });
};
