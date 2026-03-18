import { supabase } from '@/lib/supabase';

/**
 * Interfaz para el Catálogo Maestro de Infoplazas en Supabase.
 */
export interface Infoplaza {
  id?: string;       // UUID generado por Supabase
  codigo: string;   // Identificador único de negocio (IP-XXX o slug)
  nombre: string;   // Nombre descriptivo
  region: string;   // Región/Provincia (Obligatorio)
  created_at?: string;
  updated_at?: string;
}

/**
 * Mapeo de código de infoplaza -> { enlace, dia }.
 */
export interface InfoplazaEnlace {
  codigo: string;
  enlace: string;
  dia: string;
}

/**
 * Obtiene el mapeo de código de infoplaza (número) -> { enlace, dia }.
 * Extrae el número del código (ej: "132-pese" -> "132").
 */
export const fetchInfoplazasEnlaceMap = async (): Promise<Record<string, InfoplazaEnlace>> => {
  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .select(`
      enlace_nombre,
      dia_semana,
      catalogo_infoplazas!inner(
        codigo
      )
    `);

  if (error) {
    console.error('Error al obtener mapeo infoplaza-enlace:', error);
    throw error;
  }

  const map: Record<string, InfoplazaEnlace> = {};
  
  data?.forEach((item: any) => {
    const codigoCompleto = item.catalogo_infoplazas?.codigo;
    if (codigoCompleto) {
      // Extraer número del código (ej: "132-pese" -> "132")
      const numero = codigoCompleto.split('-')[0];
      map[numero] = {
        codigo: codigoCompleto,
        enlace: item.enlace_nombre || 'Sin asignar',
        dia: item.dia_semana || ''
      };
    }
  });

  return map;
};
