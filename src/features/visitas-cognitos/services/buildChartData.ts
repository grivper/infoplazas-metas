import { UNIVERSO } from '@/lib/constants';

/**
 * Meses ordenados del año para navegación cross-cuatrimestre.
 * Permite calcular el incremento del primer mes de C2/C3 contra el mes anterior.
 */
const MESES_DEL_AÑO = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Construye los datos para el gráfico de cumplimiento mensual.
 * Incluye el conteo de infoplazas que cumplieron la meta por mes
 * y calcula el incremento respecto al mes anterior (cross-cuatrimestre).
 */
export function buildChartData(
  meses: string[], 
  cumplimientoNacional: Record<string, number>
) {
  return meses.map((mes, i) => {
    const val = cumplimientoNacional[mes] || 0;
    let prev = 0;
    
    if (i > 0) {
      // Dentro del mismo cuatrimestre
      prev = cumplimientoNacional[meses[i - 1]] || 0;
    } else {
      // Primer mes del cuatrimestre: buscar el mes anterior en el año completo
      const idx = MESES_DEL_AÑO.indexOf(mes);
      if (idx > 0) {
        prev = cumplimientoNacional[MESES_DEL_AÑO[idx - 1]] || 0;
      }
    }
    
    return { 
      name: mes.substring(0, 3), 
      infoplazasCumplieron: val, 
      meta: UNIVERSO, 
      incremento: val - prev 
    };
  });
}
