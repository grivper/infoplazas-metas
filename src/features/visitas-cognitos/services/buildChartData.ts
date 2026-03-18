import { UNIVERSO } from '@/lib/constants';

/**
 * Construye los datos para el gráfico de cumplimiento mensual.
 * Incluye el conteo de infoplazas que cumplieron la meta por mes
 * y calcula el incremento respecto al mes anterior.
 */
export function buildChartData(
  meses: string[], 
  cumplimientoNacional: Record<string, number>
) {
  return meses.map((mes, i) => {
    const val = cumplimientoNacional[mes] || 0;
    const prev = i > 0 ? (cumplimientoNacional[meses[i - 1]] || 0) : 0;
    return { 
      name: mes.substring(0, 3), 
      infoplazasCumplieron: val, 
      meta: UNIVERSO, 
      incremento: i === 0 ? 0 : val - prev 
    };
  });
}
