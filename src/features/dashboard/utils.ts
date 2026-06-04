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
 * Meses ordenados del año para navegación cross-cuatrimestre.
 * Sirve para buscar el mes anterior aunque esté fuera del array actual.
 */
export const MESES_DEL_AÑO = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calcula incrementos acumulados entre meses de un cuatrimestre.
 * Incluye el salto desde el mes anterior (cross-cuatrimestre) si se provee.
 */
export const calcularIncrementos = (
  ipPorMes: Map<string, number>,
  meses: string[],
  prevMonthValue?: number
): number => {
  let total = 0;
  
  // Incluir el salto desde el mes anterior al primer mes del cuatrimestre
  if (prevMonthValue !== undefined && meses.length > 0) {
    const firstMonthVal = ipPorMes.get(meses[0]) || 0;
    total += Math.max(0, firstMonthVal - prevMonthValue);
  }
  
  for (let i = 1; i < meses.length; i++) {
    const ipActual = ipPorMes.get(meses[i]) || 0;
    const ipAnterior = ipPorMes.get(meses[i - 1]) || 0;
    total += Math.max(0, ipActual - ipAnterior);
  }
  return total;
};

/**
 * Datos para un cuatrimestre en la UI.
 * incremento = suma de crecimientos netos mes a mes (solo positivos).
 * La meta es 95 IPs al año → +31.66 incrementos por cuatrimestre.
 */
export interface CuatrimestreData {
  nombre: string;
  meses: string;
  incremento: number;  // Suma de incrementos positivos mes a mes
  current: boolean;
  pct: number;
  isCompletado: boolean;
  isActivo: boolean;
  estaAtrasado: boolean;
}

/**
 * Construye datos de cuatrimestres para UI.
 * Suma todos los incrementos positivos mes a mes dentro del cuatrimestre,
 * incluyendo el salto cross-cuatrimestre (ej: Abril → Mayo).
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
    // Buscar valor del mes anterior al cuatrimestre (cross-boundary)
    const prevMesIdx = MESES_DEL_AÑO.indexOf(mesesList[0]) - 1;
    const prevMonthValue = prevMesIdx >= 0 ? ipPorMes.get(MESES_DEL_AÑO[prevMesIdx]) : undefined;
    
    const incremento = calcularIncrementos(ipPorMes, mesesList, prevMonthValue);
    const pct = metaCuatrimestre > 0 ? Math.round((incremento / metaCuatrimestre) * 100) : 0;
    const isCompletado = incremento >= metaCuatrimestre;
    const isActivo = num === cuatrimestreActual;
    const estaAtrasado = isActivo && !isCompletado;

    return { nombre, meses, incremento, current: isActivo, pct, isCompletado, isActivo, estaAtrasado };
  });
};
