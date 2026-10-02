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
 * Actualiza la respuesta de una confirmación desde el panel administrativo
 * validando los cupos atómicamente a través de la función de base de datos.
 */
export const updateRespuestaConfirmacion = async (
  id: string,
  respuesta: RespuestaConfirmacionInput,
): Promise<void> => {
  // Regla de negocio (única en el cliente; la base de datos la vuelve a validar):
  // quien no asiste no se hospeda ni cena, y quien se hospeda cena automáticamente.
  const seHospeda = respuesta.asiste && respuesta.seHospeda;
  const cena = respuesta.asiste && (seHospeda || respuesta.cena);

  const { error } = await supabase.rpc('admin_actualizar_respuesta', {
    p_confirmacion_id: id,
    p_asiste: respuesta.asiste,
    p_se_hospeda: seHospeda,
    p_cena: cena,
  });

  if (error) throw error;
};
