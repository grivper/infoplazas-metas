/**
 * Tipos para el Radar KPAX Unificado
 * Fuente: Archivo 68-informe-kpax-*.csv
 */

/**
 * Dispositivo unificado KPAX (impresora + agente vinculado)
 */
export interface KpaxUnificado {
  id?: string;
  numero_serie: string;
  fabricante: string | null;
  modelo: string | null;
  ip: string | null;
  mac: string | null;
  fecha_instalacion: string | null;
  nombre_agente: string | null;
  hostname_agente: string | null;
  ubicacion: string | null;
  ultima_actualizacion: string | null;
  inactividad_impresora: string | null;
  inactividad_agente: string | null;
  estado: 'online' | 'critico';
  infoplaza_id: string | null;
  motivo_falla?: string | null;
  fecha_registro_falla?: string | null;
  created_at?: string;
  updated_at?: string;
  // Relación con infoplaza (viene del JOIN de Supabase)
  catalogo_infoplazas?: { nombre: string } | null;
}

/**
 * Datos para sincronizar a Supabase (sin campos generados automáticamente)
 */
export interface KpaxUnificadoSync {
  numero_serie: string;
  fabricante: string | null;
  modelo: string | null;
  ip: string | null;
  mac: string | null;
  fecha_instalacion: string | null;
  nombre_agente: string | null;
  hostname_agente: string | null;
  ubicacion: string | null;
  ultima_actualizacion: string | null;
  inactividad_impresora: string | null;
  inactividad_agente: string | null;
  infoplaza_id: string | null;
}

/**
 * KPI para el dashboard del Radar
 */
export interface RadarKpaxKpis {
  total: number;
  online: number;
  critico: number;
  agentesCaidos: number;
}
