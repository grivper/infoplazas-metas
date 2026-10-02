/**
 * Cálculo puro de hospedados por sexo para el panel de Respuestas.
 * `dinamizadores.sexo` solo puede ser "Femenino", "Masculino" o null
 * (ver OPCIONES_SEXO en features/auditoria/constants/opcionesDinamizador.ts).
 * Las personas sin sexo registrado se cuentan aparte para que el total
 * siga cuadrando con "Se hospedan".
 */

export interface PersonaHospedaje {
  se_hospeda: boolean | null;
  dinamizador: {
    sexo: string | null;
  };
}

export interface ConteoHospedadosPorSexo {
  mujeres: number;
  hombres: number;
  sinDato: number;
}

/** Cuenta, entre quienes se hospedan, cuántos son mujeres, hombres y sin dato de sexo. */
export function contarHospedadosPorSexo(
  personas: PersonaHospedaje[],
): ConteoHospedadosPorSexo {
  const hospedados = personas.filter((persona) => persona.se_hospeda === true);

  return {
    mujeres: hospedados.filter((persona) => persona.dinamizador.sexo === 'Femenino').length,
    hombres: hospedados.filter((persona) => persona.dinamizador.sexo === 'Masculino').length,
    sinDato: hospedados.filter(
      (persona) => persona.dinamizador.sexo !== 'Femenino' && persona.dinamizador.sexo !== 'Masculino',
    ).length,
  };
}
