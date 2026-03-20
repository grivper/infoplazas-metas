/**
 * Utilidades para cálculos del Dashboard
 */

/**
 * Configuración de cuatrimestres
 */
export const CUATRIMESTRES = {
  C1: { nombre: 'C1', meses: 'Ene-Abr', mesesList: ['Enero', 'Febrero', 'Marzo', 'Abril'] },
  C2: { nombre: 'C2', meses: 'May-Ago', mesesList: ['Mayo', 'Junio', 'Julio', 'Agosto'] },
  C3: { nombre: 'C3', meses: 'Sep-Dic', mesesList: ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] },
};

/**
 * Obtiene el cuatrimestre actual basándose en el mes
 */
export const getCuatrimestreActual = (): 1 | 2 | 3 => {
  const hoy = new Date().getMonth(); // 0-11
  if (hoy >= 0 && hoy <= 3) return 1;
  if (hoy >= 4 && hoy <= 7) return 2;
  return 3;
};

/**
 * Construye un mapa de mes -> valor desde historial
 */
export const buildMesValorMap = <T extends { mes_nombre: string }>(
  historial: T[],
  valueKey: keyof T
): Map<string, number> => {
  const map = new Map<string, number>();
  historial.forEach(h => {
    map.set(h.mes_nombre, h[valueKey] as number);
  });
  return map;
};

/**
 * Calcula incrementos acumulados entre meses de un cuatrimestre
 */
export const calcularIncrementos = (
  ipPorMes: Map<string, number>,
  meses: string[]
): number => {
  let total = 0;
  for (let i = 1; i < meses.length; i++) {
    const ipActual = ipPorMes.get(meses[i]) || 0;
    const ipAnterior = ipPorMes.get(meses[i - 1]) || 0;
    total += Math.max(0, ipActual - ipAnterior);
  }
  return total;
};

/**
 * Datos para un cuatrimestre
 */
export interface CuatrimestreData {
  nombre: string;
  meses: string;
  incremento: number;
  current: boolean;
  pct: number;
  isCompletado: boolean;
  isActivo: boolean;
  estaAtrasado: boolean;
}

/**
 * Construye datos de cuatrimestres para UI
 */
export const buildCuatrimestreData = (
  ipPorMes: Map<string, number>,
  metaCuatrimestre: number = 31.66
): CuatrimestreData[] => {
  const cuatrimestreActual = getCuatrimestreActual();
  
  const cuats = [
    { ...CUATRIMESTRES.C1, num: 1 as const },
    { ...CUATRIMESTRES.C2, num: 2 as const },
    { ...CUATRIMESTRES.C3, num: 3 as const },
  ];

  return cuats.map(({ nombre, meses, mesesList, num }) => {
    const incremento = calcularIncrementos(ipPorMes, mesesList);
    const pct = metaCuatrimestre > 0 ? Math.round((incremento / metaCuatrimestre) * 100) : 0;
    const isCompletado = incremento >= metaCuatrimestre;
    const isActivo = num === cuatrimestreActual;
    const estaAtrasado = isActivo && incremento < metaCuatrimestre && incremento > 0;

    return { nombre, meses, incremento, current: isActivo, pct, isCompletado, isActivo, estaAtrasado };
  });
};
