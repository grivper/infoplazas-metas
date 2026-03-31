import { supabase } from '@/lib/supabase';
import type { KpaxUnificado, KpaxUnificadoSync } from '../types/kpaxUnificado';

/**
 * Obtiene todos los dispositivos KPAX unificados
 */
export const fetchKpaxUnificadoFromSupabase = async (): Promise<KpaxUnificado[]> => {
  const { data, error } = await supabase
    .from('radar_kpax_unificado')
    .select(`
      *,
      catalogo_infoplazas:infoplaza_id (
        nombre
      )
    `)
    .order('estado', { ascending: false })
    .order('nombre_agente', { ascending: true });

  if (error) {
    console.error('Error obteniendo KPAX unificado:', error);
    return [];
  }

  return (data || []) as KpaxUnificado[];
};

/**
 * Obtiene solo dispositivos para Reporte (críticos sin motivo)
 */
export const fetchReporteDispositivos = async (): Promise<KpaxUnificado[]> => {
  const { data, error } = await supabase
    .from('radar_kpax_unificado')
    .select(`
      *,
      catalogo_infoplazas:infoplaza_id (
        nombre
      )
    `)
    .eq('estado', 'critico')
    .is('motivo_falla', null)
    .order('nombre_agente', { ascending: true });

  if (error) {
    console.error('Error obteniendo reporte:', error);
    return [];
  }

  return (data || []) as KpaxUnificado[];
};

/**
 * Dispositivo con motivo para tracking
 */
interface DispositivoConMotivo {
  numero_serie: string;
  estado: string;
  motivo_falla: string | null;
  fecha_registro_falla: string | null;
  nombre_agente: string | null;
  catalogo_infoplazas: { nombre: string }[] | null;
}

/**
 * Obtiene dispositivos que tienen motivo_falla (para comparar en sync)
 */
export const fetchDispositivosConMotivo = async (): Promise<DispositivoConMotivo[]> => {
  const { data, error } = await supabase
    .from('radar_kpax_unificado')
    .select('numero_serie, estado, motivo_falla, fecha_registro_falla, nombre_agente, catalogo_infoplazas(nombre)')
    .not('motivo_falla', 'is', null);

  if (error) {
    console.error('Error obteniendo dispositivos con motivo:', error);
    return [];
  }

  return (data || []) as DispositivoConMotivo[];
};

/**
 * Actualiza el motivo de falla de un dispositivo
 */
export const updateMotivoFalla = async (
  numeroSerie: string,
  motivo: string
): Promise<void> => {
  const { error } = await supabase
    .from('radar_kpax_unificado')
    .update({
      motivo_falla: motivo,
      fecha_registro_falla: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('numero_serie', numeroSerie);

  if (error) {
    console.error('Error actualizando motivo:', error);
    throw error;
  }
};

/**
 * Datos necesarios para mover a historial
 */
interface DatosBasicosHistorial {
  numero_serie: string;
  nombre_agente: string | null;
  motivo_falla: string | null;
  fecha_registro_falla: string | null;
  catalogo_infoplazas: { nombre: string }[] | null;
}

/**
 * Mueve un dispositivo al historial de fallas
 */
export const moverAHistorial = async (dispositivo: DatosBasicosHistorial): Promise<void> => {
  const { error } = await supabase
    .from('radar_historial_fallas')
    .insert({
      agente_id: dispositivo.numero_serie,
      infoplaza: dispositivo.catalogo_infoplazas?.[0]?.nombre || dispositivo.nombre_agente || '',
      motivo_falla: dispositivo.motivo_falla || 'Resuelto',
      fecha_registro: dispositivo.fecha_registro_falla || new Date().toISOString(),
      fecha_arqueo: new Date().toISOString(),
      activo: false // Resuelto
    });

  if (error) {
    console.error('Error moviendo a historial:', error);
    throw error;
  }
};

/**
 * Limpia el motivo de falla de un dispositivo (después de moverlo a historial)
 */
export const limpiarMotivoFalla = async (numeroSerie: string): Promise<void> => {
  const { error } = await supabase
    .from('radar_kpax_unificado')
    .update({
      motivo_falla: null,
      fecha_registro_falla: null,
      updated_at: new Date().toISOString()
    })
    .eq('numero_serie', numeroSerie);

  if (error) {
    console.error('Error limpiando motivo:', error);
    throw error;
  }
};

/**
 * Obtiene todos los dispositivos KPAX unificados (para detectar eliminaciones)
 */
export const fetchAllKpaxUnificado = async (): Promise<{ numero_serie: string; nombre_agente: string | null; motivo_falla: string | null }[]> => {
  const { data, error } = await supabase
    .from('radar_kpax_unificado')
    .select('numero_serie, nombre_agente, motivo_falla');

  if (error) {
    console.error('Error obteniendo todos los KPAX:', error);
    return [];
  }

  return (data || []) as { numero_serie: string; nombre_agente: string | null; motivo_falla: string | null }[];
};

/**
 * Sincroniza los dispositivos KPAX unificados a Supabase
 * Detecta cambios y mueve a historial los que se resolvieron o desaparecieron
 */
export const syncKpaxUnificadoToSupabase = async (
  dispositivos: KpaxUnificadoSync[]
): Promise<{ syncCount: number; resolvedCount: number; deletedCount: number }> => {
  if (dispositivos.length === 0) return { syncCount: 0, resolvedCount: 0, deletedCount: 0 };

  // 1. Obtener dispositivos que tienen motivo_falla (estado anterior)
  const conMotivoAnterior = await fetchDispositivosConMotivo();
  const numerosSerieActuales = new Set(dispositivos.map(d => d.numero_serie));

  // 2. Obtener TODOS los dispositivos de la DB para detectar los que desaparecieron
  const todosDeDB = await fetchAllKpaxUnificado();
  
  // 3. Identificar dispositivos que ya NO están en el CSV nuevo
  const paraEliminar = todosDeDB.filter(d => !numerosSerieActuales.has(d.numero_serie));

  // 4. Mover al historial los que tienen motivo y desaparecieron (o se resolvieron)
  const paraMoverAHistorial = conMotivoAnterior.filter(d => {
    if (!numerosSerieActuales.has(d.numero_serie)) return true; // Desapareció del CSV
    if (d.estado === 'online') return true; // Se resolvió manualmente
    return false;
  });

  // 5. Mover a historial y limpiar motivo
  for (const disp of paraMoverAHistorial) {
    try {
      await moverAHistorial(disp);
      await limpiarMotivoFalla(disp.numero_serie);
    } catch (e) {
      console.error(`[KPAX] Error moviendo ${disp.numero_serie}:`, e);
    }
  }

  // 6. Los que desaparecen pero NO tenían motivo -> asignar "Agente movido/desaparecido" y mover a historial
  const paraMoverSinMotivo = paraEliminar.filter(d => !d.motivo_falla);
  for (const disp of paraMoverSinMotivo) {
    try {
      // Crear un objeto compatible con moverAHistorial
      const dispCompleto = {
        numero_serie: disp.numero_serie,
        nombre_agente: disp.nombre_agente,
        motivo_falla: 'Agente movido/desaparecido',
        fecha_registro_falla: new Date().toISOString(),
        catalogo_infoplazas: null
      };
      await moverAHistorial(dispCompleto);
    } catch (e) {
      console.error(`[KPAX] Error moviendo sin motivo ${disp.numero_serie}:`, e);
    }
  }

  // 7. ELIMINAR de la tabla principal los que ya no están en el CSV
  if (paraEliminar.length > 0) {
    const { error: deleteError } = await supabase
      .from('radar_kpax_unificado')
      .delete()
      .in('numero_serie', paraEliminar.map(d => d.numero_serie));

    if (deleteError) {
      console.error('Error eliminando dispositivos:', deleteError);
    }
  }

  // 8. Upsert normal de los dispositivos del CSV
  // NOTA: estado es GENERATED STORED en la tabla, PostgreSQL lo calcula automáticamente con umbral 96h
  const records = dispositivos.map(d => ({
    numero_serie: d.numero_serie,
    fabricante: d.fabricante || null,
    modelo: d.modelo || null,
    ip: d.ip || null,
    mac: d.mac || null,
    fecha_instalacion: d.fecha_instalacion || null,
    nombre_agente: d.nombre_agente || null,
    hostname_agente: d.hostname_agente || null,
    ubicacion: d.ubicacion || null,
    ultima_actualizacion: d.ultima_actualizacion || null,
    inactividad_impresora: d.inactividad_impresora || null,
    inactividad_agente: d.inactividad_agente || null,
    infoplaza_id: d.infoplaza_id || null,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('radar_kpax_unificado')
    .upsert(records, {
      onConflict: 'numero_serie',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error sincronizando KPAX:', error);
    throw error;
  }

  return {
    syncCount: records.length,
    resolvedCount: paraMoverAHistorial.length,
    deletedCount: paraEliminar.length
  };
};
