import type { Confirmacion } from '../services/confirmacionesService';

const CODIGO_PAIS = '507';

/** Deja solo dígitos y antepone el código de país si el número es local (8 dígitos). */
const normalizarCelular = (celular: string): string => {
  const digitos = celular.replace(/\D/g, '');
  return digitos.length === 8 ? `${CODIGO_PAIS}${digitos}` : digitos;
};

/**
 * Construye el enlace wa.me con el mensaje personalizado: reemplaza {nombre} y
 * {link} de la plantilla. Devuelve null si la confirmación no tiene celular.
 */
export const buildWhatsappUrl = (
  confirmacion: Confirmacion,
  plantilla: string,
): string | null => {
  const { celular, nombre } = confirmacion.dinamizador;
  if (!celular) return null;

  const numero = normalizarCelular(celular);
  if (!numero) return null;

  const link = `${window.location.origin}/confirmar/${confirmacion.token}`;
  const mensaje = plantilla.replaceAll('{nombre}', nombre).replaceAll('{link}', link);

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
};
