import { supabase } from '@/lib/supabase';
import type { MetaItem, MetaMetrica } from '@/components/MetaCard';
import { getMeta30SnapshotHistory } from '@/features/visitas-cognitos/services/meta30SnapshotsDb';

/**
 * Meta 2: Cumplimiento del 30% (Visitas Cognitos)
 * Mide el porcentaje de IPs que mantienen >30% de avance
 */
export const getMeta2Cumplimiento = async (): Promise<MetaItem> => {
  const añoActual = new Date().getFullYear();
  
  // 1. Obtener total de infoplazas del catálogo
  const { count: totalCatalogo } = await supabase
    .from('catalogo_infoplazas')
    .select('*', { count: 'exact', head: true });

  const totalIP = totalCatalogo || 0;

  // 2. Obtener datos de Meta 30 (última sincronización)
  const { data: sync } = await supabase
    .from('meta_30_sincronizacion')
    .select('data')
    .order('fecha_sincronizacion', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Meses ordenados
  const mesesOrdenados = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // 3. Procesar datos
  let ipSobre30 = 0;
  let ipDebajo30 = 0;
  let mesAnteriorSobre30 = 0;
  let mesActualNombre = '';

  if (sync?.data && Array.isArray(sync.data)) {
    const data = sync.data as Array<{
      Infoplaza?: string;
      Año?: string | number;
      Mes?: string;
      Porcentaje?: number | string;
    }>;

    // Filtrar por año actual
    const registrosAño = data.filter(r => {
      const añoReg = typeof r.Año === 'string' ? parseInt(r.Año) : r.Año;
      return añoReg === añoActual;
    });

    // Encontrar último mes con datos
    for (let i = mesesOrdenados.length - 1; i >= 0; i--) {
      const mes = mesesOrdenados[i];
      const registrosMes = registrosAño.filter(r => r.Mes === mes);
      
      if (registrosMes.length > 0) {
        mesActualNombre = mes;
        
        // Contar IPs sobre/debajo 30%
        registrosMes.forEach(r => {
          const pct = typeof r.Porcentaje === 'string' ? parseFloat(r.Porcentaje) : (r.Porcentaje || 0);
          if (pct >= 30) ipSobre30++;
          else ipDebajo30++;
        });
        
        // Buscar mes anterior para incremento
        if (i > 0) {
          const mesAnt = mesesOrdenados[i - 1];
          const registrosAnt = registrosAño.filter(r => r.Mes === mesAnt);
          registrosAnt.forEach(r => {
            const pct = typeof r.Porcentaje === 'string' ? parseFloat(r.Porcentaje) : (r.Porcentaje || 0);
            if (pct >= 30) mesAnteriorSobre30++;
          });
        }
        break;
      }
    }
  }

  // 4. Calcular incremento del último mes (para métricas)
  const incrementoMes = ipSobre30 - mesAnteriorSobre30;

  // 5. Obtener historial de snapshots para cálculo de progreso acumulado
  const historialRaw = await getMeta30SnapshotHistory(añoActual);
  const historial = historialRaw.map(s => ({
    fecha: s.fecha,
    mes_nombre: s.mes_nombre,
    ip_sobre_30: s.ip_sobre_30,
    meta_acumulada: s.meta_acumulada,
    meta_base: (s as any).meta_base || 0,
    progreso_pct: s.progreso_pct,
  }));

  // 6. Progreso global: suma acumulada de todos los incrementos positivos del año vs meta 95
  const metaAnual = 95;
  let totalIncrementos = 0;
  let prevVal: number | null = null;
  for (const h of historial) {
    if (prevVal !== null) {
      totalIncrementos += Math.max(0, h.ip_sobre_30 - prevVal);
    }
    prevVal = h.ip_sobre_30;
  }
  const progreso = Math.min(Math.round((totalIncrementos / metaAnual) * 100), 100);

  const metricas: MetaMetrica[] = [
    { label: 'Sobre 30%', valor: ipSobre30, meta: totalIP },
    { label: 'Bajo 30%', valor: ipDebajo30, meta: totalIP },
    { label: 'Incremento mes', valor: incrementoMes, meta: 7 },
    { label: 'Incremento acumulado', valor: totalIncrementos, meta: metaAnual },
  ];

  return {
    id: 'meta-2',
    titulo: 'Cumplimiento del 30%',
    numero: 2,
    progreso,
    metricas,
    color: 'bg-emerald-500',
    link: '/visitas-incidencias',
    historial,
  };
};
