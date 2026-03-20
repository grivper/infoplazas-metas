import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';

/**
 * Meta 3: Mesas de Transformación
 * Mide el avance de mesas completadas por región
 */
export const getMeta3Mesas = async (): Promise<MetaItem> => {
  // Obtener solo las completadas por región
  const { data: completadas } = await supabase
    .from('mesas_transformacion')
    .select('region, estado')
    .eq('estado', 'completada');

  // Contar completadas por región
  const completadasPorRegion: Record<string, number> = {};
  completadas?.forEach(m => {
    completadasPorRegion[m.region] = (completadasPorRegion[m.region] || 0) + 1;
  });

  // Configuración de regiones con pesos fijos (meta de 21 mesas)
  const configRegiones = [
    { region: 'Herrera', total: 6 },
    { region: 'Los Santos', total: 9 },
    { region: 'Coclé', total: 6 },
  ];
  const totalMeta = 21;

  // Calcular Avance Global ponderado y datos por región
  let progresoGlobal = 0;
  const metricasPorRegion: { region: string; completadas: number; total: number; avance: number; peso: number }[] = [];

  configRegiones.forEach(({ region, total }) => {
    const comp = completadasPorRegion[region] || 0;
    const avance = total > 0 ? Math.round((comp / total) * 100) : 0;
    const peso = total / totalMeta;

    // Avance ponderado
    progresoGlobal += (avance / 100) * peso;

    metricasPorRegion.push({ region, completadas: comp, total, avance, peso });
  });

  // Total completadas
  const totalCompletadas = completadas?.length || 0;

  const metricas: MetaMetrica[] = [
    { label: 'Mesas completadas', valor: totalCompletadas, meta: totalMeta },
  ];

  return {
    id: 'meta-3',
    titulo: 'Mesas de Transformación',
    numero: 3,
    progreso: Math.round(progresoGlobal * 100),
    metricas,
    color: 'bg-amber-500',
    link: '/mesas',
    regiones: metricasPorRegion,
  };
};
