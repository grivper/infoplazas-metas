import { supabase } from '@/lib/supabase';
import { ENCUENTRO_CLAVE, getEncuentroByClave } from './encuentrosService';

export type EstadoEnvio = 'pendiente' | 'enviado' | 'confirmado';

export interface Confirmacion {
  id: string;
  token: string;
  estado_envio: EstadoEnvio;
  asiste: boolean | null;
  se_hospeda: boolean | null;
  cena: boolean | null;
  confirmado_at: string | null;
  dinamizador: {
    nombre: string;
    celular: string | null;
    sexo: string | null;
    infoplaza: {
      nombre: string;
      region: string | null;
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
  token: string;
  estado_envio: EstadoEnvio;
  asiste: boolean | null;
  se_hospeda: boolean | null;
  cena: boolean | null;
  confirmado_at: string | null;
  dinamizadores: {
    nombre: string;
    celular: string | null;
    sexo: string | null;
    catalogo_infoplazas: {
      nombre: string;
      region: string | null;
      cerrada: boolean;
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
      token,
      estado_envio,
      asiste,
      se_hospeda,
      cena,
      confirmado_at,
      dinamizadores (
        nombre,
        celular,
        sexo,
        catalogo_infoplazas (nombre, region, cerrada)
      )
    `)
    .eq('encuentro_id', encuentroId)
    .order('estado_envio')
    .order('created_at');

  if (error) throw error;

  // SAFETY: this nested shape matches the explicit Supabase select above; the client lacks generated DB types.
  return ((data ?? []) as unknown as ConfirmacionQueryRow[]).flatMap((confirmacion) => {
    if (!confirmacion.dinamizadores) return [];

    // Una infoplaza cerrada ya no participa del encuentro: no se lista ni cuenta en los totales.
    const infoplaza = confirmacion.dinamizadores.catalogo_infoplazas;
    if (infoplaza?.cerrada) return [];

    return [{
      id: confirmacion.id,
      token: confirmacion.token,
      estado_envio: confirmacion.estado_envio,
      asiste: confirmacion.asiste,
      se_hospeda: confirmacion.se_hospeda,
      cena: confirmacion.cena,
      confirmado_at: confirmacion.confirmado_at,
      dinamizador: {
        nombre: confirmacion.dinamizadores.nombre,
        celular: confirmacion.dinamizadores.celular,
        sexo: confirmacion.dinamizadores.sexo,
        infoplaza: infoplaza ? { nombre: infoplaza.nombre, region: infoplaza.region } : null,
      },
    }];
  });
};

/**
 * Crea la confirmación pendiente de un dinamizador para el encuentro vigente.
 * Las confirmaciones iniciales se generaron una sola vez por migración, así que
 * cada dinamizador agregado después necesita la suya. Es idempotente: si ya
 * existe, no hace nada.
 */
export const crearConfirmacionPendiente = async (dinamizadorId: string): Promise<void> => {
  const encuentro = await getEncuentroByClave(ENCUENTRO_CLAVE);
  if (!encuentro) return;

  const { error } = await supabase
    .from('confirmaciones')
    .upsert(
      { encuentro_id: encuentro.id, dinamizador_id: dinamizadorId, estado_envio: 'pendiente' },
      { onConflict: 'encuentro_id,dinamizador_id', ignoreDuplicates: true },
    );

  if (error) throw error;
};

/** Marca la confirmación como enviada al abrir su acción de WhatsApp. */
export const marcarConfirmacionEnviada = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('confirmaciones')
    .update({
      estado_envio: 'enviado',
      enviado_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
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
