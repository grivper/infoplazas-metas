import { describe, expect, it } from 'vitest';
import { contarHospedadosPorSexo, type PersonaHospedaje } from './hospedadosPorSexo';

const persona = (seHospeda: boolean | null, sexo: string | null): PersonaHospedaje => ({
  se_hospeda: seHospeda,
  dinamizador: { sexo },
});

describe('contarHospedadosPorSexo', () => {
  it('cuenta mujeres y hombres hospedados por separado', () => {
    const resultado = contarHospedadosPorSexo([
      persona(true, 'Femenino'),
      persona(true, 'Femenino'),
      persona(true, 'Masculino'),
    ]);

    expect(resultado).toEqual({ mujeres: 2, hombres: 1, sinDato: 0 });
  });

  it('ignora a quienes no se hospedan', () => {
    const resultado = contarHospedadosPorSexo([
      persona(true, 'Femenino'),
      persona(false, 'Femenino'),
      persona(null, 'Masculino'),
    ]);

    expect(resultado).toEqual({ mujeres: 1, hombres: 0, sinDato: 0 });
  });

  it('cuenta aparte a los hospedados sin sexo registrado para que el total cuadre', () => {
    const resultado = contarHospedadosPorSexo([
      persona(true, 'Femenino'),
      persona(true, null),
      persona(true, 'Masculino'),
    ]);

    expect(resultado).toEqual({ mujeres: 1, hombres: 1, sinDato: 1 });
    expect(resultado.mujeres + resultado.hombres + resultado.sinDato).toBe(3);
  });

  it('con lista vacía devuelve todos los conteos en cero', () => {
    expect(contarHospedadosPorSexo([])).toEqual({ mujeres: 0, hombres: 0, sinDato: 0 });
  });
});
