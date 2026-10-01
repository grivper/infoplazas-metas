import { supabase } from '@/lib/supabase';

export type EstadoEnvio = 'pendiente' | 'enviado' | 'confirmado';

export interface Confirmacion {
  id: string;
  estado_envio: EstadoEnvio;
  asiste: boolean | null;
  se_hospeda: boolean | null;
  cena: boolean | null;
  confirmado_at: string | null;
  dinamizador: {
    nombre: string;
    celular: string | null;
    infoplaza: {
      nombre: string;
    } | null;
  };
}

export interface RespuestaConfirmacionInput {
  asiste: boolean;
  seHospeda: boolean;
  cena: boolean;
}

type ConfirmacionQueryRow = {
  id: string;
  estado_envio: EstadoEnvio;
  asiste: boolean | null;
  se_hospeda: boolean | null;
  cena: boolean | null;
  confirmado_at: string | null;
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
      asiste,
      se_hospeda,
      cena,
      confirmado_at,
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
      asiste: confirmacion.asiste,
      se_hospeda: confirmacion.se_hospeda,
      cena: confirmacion.cena,
      confirmado_at: confirmacion.confirmado_at,
      dinamizador: {
        nombre: confirmacion.dinamizadores.nombre,
        celular: confirmacion.dinamizadores.celular,
        infoplaza: confirmacion.dinamizadores.catalogo_infoplazas,
      },
    }];
  });
};

/**
 * Actualiza la respuesta de una confirmación desde el panel administrativo.
 * Si la fila no tenía confirmado_at, lo establece a la hora actual.
 */
export const updateRespuestaConfirmacion = async (
  id: string,
  respuesta: RespuestaConfirmacionInput,
  confirmadoAtPrevio: string | null,
): Promise<void> => {
  const { error } = await supabase
    .from('confirmaciones')
    .update({
      asiste: respuesta.asiste,
      se_hospeda: respuesta.asiste ? respuesta.seHospeda : false,
      cena: respuesta.asiste ? respuesta.cena : false,
      estado_envio: 'confirmado',
      confirmado_at: confirmadoAtPrevio ?? new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
};
