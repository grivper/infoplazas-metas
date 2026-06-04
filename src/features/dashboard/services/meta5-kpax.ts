import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';
import { calcularPromedioAnual } from '@/features/radar-conectividad/services/radarSnapshotsDb';

/**
 * Meta 5: KPAX (Radar Conectividad)
 * Mide conectividad de equipos e impresoras
 */
export const getMeta5Kpax = async (): Promise<MetaItem> => {
  const [totalResult, criticosResult, promedioAnual] = await Promise.all([
    supabase.from('radar_kpax_unificado').select('*', { count: 'exact', head: true }),
    supabase.from('radar_kpax_unificado').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
    calcularPromedioAnual()
  ]);

  const total = totalResult.count || 0;
  const criticos = criticosResult.count || 0;
  const conectividad = total > 0 ? Math.round(((total - criticos) / total) * 100) : 0;
  const equiposOnline = total - criticos;

  const metricas: MetaMetrica[] = [
    { label: 'Equipos online', valor: equiposOnline, meta: 0 },
    { label: 'Índice de conectividad', valor: conectividad, meta: 100, unidad: '%' },
    { label: 'Equipos críticos', valor: criticos, meta: 0 },
    { label: 'Promedio anual', valor: promedioAnual, meta: 100, unidad: '%' },
  ];

  return {
    id: 'meta-5',
    titulo: 'KPAX',
    numero: 5,
    progreso: conectividad,
    metricas,
    color: 'bg-purple-500',
    link: '/radar',
  };
};
