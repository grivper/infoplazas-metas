import { describe, expect, it } from 'vitest';
import {
  LIMITE_CENA_EXTRA,
  LIMITE_HOSPEDAJE,
  cuposCenaExtraDisponibles,
  cuposHospedajeDisponibles,
  hayCupoCenaExtra,
  hayCupoHospedaje,
  totalCenasACobrar,
} from './cuposCena';

describe('cuposCena', () => {
  it('con 40 hospedados, el cupo de cena extra sigue topado en 10 (independiente del hospedaje libre)', () => {
    expect(cuposCenaExtraDisponibles(0)).toBe(10);
    expect(hayCupoHospedaje(40)).toBe(true); // sobran 12 cupos de hospedaje
    expect(cuposCenaExtraDisponibles(0)).toBe(LIMITE_CENA_EXTRA); // no crece por los 12 libres
  });

  it('52 hospedados + 10 cenas extra => 62 cenas a cobrar', () => {
    expect(totalCenasACobrar(52, 10)).toBe(62);
    expect(cuposHospedajeDisponibles(52)).toBe(0);
    expect(cuposCenaExtraDisponibles(10)).toBe(0);
  });

  it('40 hospedados + 10 cenas extra => 50 cenas a cobrar (no se fuerza a 62)', () => {
    expect(totalCenasACobrar(40, 10)).toBe(50);
  });

  it('agotar las cenas extra nunca bloquea el hospedaje', () => {
    expect(hayCupoCenaExtra(10)).toBe(false); // las 10 cenas extra están agotadas
    expect(hayCupoHospedaje(10)).toBe(true); // el hospedaje sigue disponible
    expect(cuposHospedajeDisponibles(10)).toBe(42);
  });

  it('un hospedado nunca es rechazado por falta de cupo de cena', () => {
    // Con hospedaje lleno (52) y cenas extra llenas (10), el hospedaje ya estaba
    // ocupado antes de agotar la cena extra: su cena fue automática, no dependió
    // del cupo de cena extra en ningún momento.
    expect(hayCupoHospedaje(51)).toBe(true);
    expect(cuposHospedajeDisponibles(51)).toBe(1);
    expect(hayCupoCenaExtra(10)).toBe(false);
    // La validación de hospedaje no consulta cuposCenaExtraDisponibles en absoluto.
  });

  it('quien no asiste no cuenta ni como hospedado ni como cena extra', () => {
    // No asiste => se_hospeda=false, cena=false: no incrementa ninguno de los contadores
    // de ocupación (representado aquí simplemente no sumando a los acumulados).
    expect(totalCenasACobrar(0, 0)).toBe(0);
    expect(cuposHospedajeDisponibles(0)).toBe(LIMITE_HOSPEDAJE);
    expect(cuposCenaExtraDisponibles(0)).toBe(LIMITE_CENA_EXTRA);
  });
});
