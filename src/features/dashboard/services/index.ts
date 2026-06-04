// Re-exportaciones para compatibilidad
export { getMeta1ServicioSocial } from './meta1-servicio-social';
export { getMeta2Cumplimiento } from './meta2-cumplimiento-30';
export { getMeta3Mesas } from './meta3-mesas';
export { getMeta4Rutas, type EnlaceRutaData } from './meta4-rutas';
export { getMeta5Kpax } from './meta5-kpax';

import type { MetaItem } from '@/components/MetaCard';
import { getMeta1ServicioSocial } from './meta1-servicio-social';
import { getMeta2Cumplimiento } from './meta2-cumplimiento-30';
import { getMeta3Mesas } from './meta3-mesas';
import { getMeta4Rutas } from './meta4-rutas';
import { getMeta5Kpax } from './meta5-kpax';

/**
 * Función principal: Obtener todas las metas del dashboard
 */
export const getDatosDashboard = async (): Promise<MetaItem[]> => {
  const [meta1, meta2, meta3, meta4, meta5] = await Promise.all([
    getMeta1ServicioSocial(),
    getMeta2Cumplimiento(),
    getMeta3Mesas(),
    getMeta4Rutas(),
    getMeta5Kpax(),
  ]);

  // Ordenar por número de meta
  return [meta1, meta2, meta3, meta4, meta5];
};
