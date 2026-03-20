import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';

/**
 * Meta 1: Servicio Social
 * Métricas: Alianzas universitarias, Estudiantes reclutados, Talleres impartidos, Usuarios capacitados
 */
export const getMeta1ServicioSocial = async (): Promise<MetaItem> => {
  const [alianzasCount, estudiantesCount, talleresCount, usuariosCapacitados] = await Promise.all([
    supabase.from('alianzas_universidades').select('*', { count: 'exact', head: true }),
    supabase.from('reclutamiento_estudiantes').select('*', { count: 'exact', head: true }),
    supabase.from('talleres_impartidos').select('*', { count: 'exact', head: true }),
    supabase.from('talleres_impartidos').select('usuarios_capacitados'),
  ]);

  const alianzas = alianzasCount.count || 0;
  const estudiantes = estudiantesCount.count || 0;
  const talleres = talleresCount.count || 0;
  const usuarios = (usuariosCapacitados.data || []).reduce((sum, t) => sum + (t.usuarios_capacitados || 0), 0);

  // Promedio ponderado: Alianzas 40%, Estudiantes 30%, Talleres 15%, Usuarios 15%
  const progreso = Math.round(
    (alianzas / 5) * 100 * 0.4 +
    (estudiantes / 60) * 100 * 0.3 +
    (talleres / 140) * 100 * 0.15 +
    (usuarios / 600) * 100 * 0.15
  );

  const metricas: MetaMetrica[] = [
    { label: 'Alianzas universitarias', valor: alianzas, meta: 5, peso: 40 },
    { label: 'Estudiantes reclutados', valor: estudiantes, meta: 60, peso: 30 },
    { label: 'Talleres impartidos', valor: talleres, meta: 140, peso: 15 },
    { label: 'Usuarios capacitados', valor: usuarios, meta: 600, peso: 15 },
  ];

  return {
    id: 'meta-1',
    titulo: 'Servicio Social',
    numero: 1,
    progreso: Math.min(progreso, 100),
    metricas,
    color: 'bg-blue-500',
    link: '/servicio-social',
  };
};
