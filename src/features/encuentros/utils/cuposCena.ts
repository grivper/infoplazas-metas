/**
 * Cálculo puro de cupos de hospedaje y cena para un encuentro.
 * Regla acordada (odd/tasks/cupos-cena-libres.md, migración
 * 20260626120000_cupos_cena_no_hospedados.sql):
 * - Hospedaje: máximo 52, independiente de las cenas.
 * - Todo hospedado cena automáticamente; esa cena no consume cupo propio.
 * - Cenas extra (asistentes que NO se hospedan): exactamente 10, fijas e
 *   independientes del cupo de hospedaje.
 * - Agotar las cenas extra nunca bloquea el hospedaje, y un hospedado nunca
 *   es rechazado por falta de cupo de cena.
 */

export const LIMITE_HOSPEDAJE = 52;
export const LIMITE_CENA_EXTRA = 10;

/** Cupos de hospedaje que quedan disponibles dado el número ya ocupado. */
export function cuposHospedajeDisponibles(hospedadosOcupados: number): number {
  return Math.max(0, LIMITE_HOSPEDAJE - hospedadosOcupados);
}

/** Cupos de cena extra (no hospedados) que quedan disponibles. */
export function cuposCenaExtraDisponibles(extrasOcupados: number): number {
  return Math.max(0, LIMITE_CENA_EXTRA - extrasOcupados);
}

/** True si todavía hay cupo de hospedaje, sin importar el estado de las cenas extra. */
export function hayCupoHospedaje(hospedadosOcupados: number): boolean {
  return hospedadosOcupados < LIMITE_HOSPEDAJE;
}

/** True si todavía hay cupo de cena extra, sin importar el estado del hospedaje. */
export function hayCupoCenaExtra(extrasOcupados: number): boolean {
  return extrasOcupados < LIMITE_CENA_EXTRA;
}

/**
 * Total de cenas a cobrar: hospedados (cena automática) + cenas extra confirmadas.
 * No es un número fijo (puede ir de 0 hasta 52 + 10 = 62 como máximo).
 */
export function totalCenasACobrar(hospedadosConfirmados: number, extrasConfirmadas: number): number {
  return hospedadosConfirmados + extrasConfirmadas;
}
