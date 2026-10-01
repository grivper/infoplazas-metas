import { supabase } from '@/lib/supabase';

export interface ConfirmacionPublica {
  dinamizadorNombre: string;
  encuentroNombre: string;
  fechaInicio: string;
  fechaFin: string;
  sede: string;
  asiste: boolean | null;
  seHospeda: boolean;
  cena: boolean;
  respondido: boolean;
}

export interface RespuestaConfirmacion {
  asiste: boolean;
  seHospeda: boolean;
  cena: boolean;
}

type ConfirmacionPublicaRow = {
  dinamizador_nombre: string;
  encuentro_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  sede: string;
  asiste: boolean | null;
  se_hospeda: boolean;
  cena: boolean;
  respondido: boolean;
};

/**
 * Obtiene los datos públicos de confirmación asociados a un token.
 * Devuelve null cuando el token es inválido o no existe (array vacío del RPC).
 */
export const getConfirmacionPublica = async (
  token: string,
): Promise<ConfirmacionPublica | null> => {
  const { data, error } = await supabase.rpc('get_confirmacion_publica', {
    p_token: token,
  });

  if (error) throw error;

  // SAFETY: the RPC returns an array of rows; this client lacks generated DB types.
  const filas = (data ?? []) as unknown as ConfirmacionPublicaRow[];
  const fila = filas[0];
  if (!fila) return null;

  return {
    dinamizadorNombre: fila.dinamizador_nombre,
    encuentroNombre: fila.encuentro_nombre,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    sede: fila.sede,
    asiste: fila.asiste,
    seHospeda: fila.se_hospeda,
    cena: fila.cena,
    respondido: fila.respondido,
  };
};

/**
 * Guarda la respuesta de confirmación de un dinamizador.
 * Devuelve false cuando el token no existe (no se guardó nada).
 */
export const responderConfirmacion = async (
  token: string,
  respuesta: RespuestaConfirmacion,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('responder_confirmacion', {
    p_token: token,
    p_asiste: respuesta.asiste,
    p_se_hospeda: respuesta.seHospeda,
    p_cena: respuesta.cena,
  });

  if (error) throw error;

  return Boolean(data);
};
