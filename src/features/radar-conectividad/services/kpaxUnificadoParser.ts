import Papa from 'papaparse';
import type { Infoplaza } from '../../auditoria/services/infoplazasService';
import type { KpaxUnificadoSync } from '../types/kpaxUnificado';

/**
 * Normaliza el nombre del agente para matching con infoplazas
 * - Quita "A-" del inicio
 * - Quita acentos
 * - Quita espacios extra
 * - Convierte a lowercase
 */
export const normalizeAgentName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/^A-/, '') // Quitar "A-" del inicio
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .toLowerCase()
    .trim();
};

/**
 * Busca la infoplaza que coincide con el nombre del agente
 * Retorna el ID de la infoplaza o null si no hay match
 */
export const matchInfoplaza = (
  nombreAgente: string,
  catalogo: Infoplaza[]
): string | null => {
  if (!nombreAgente || catalogo.length === 0) return null;

  const norm = normalizeAgentName(nombreAgente);
  if (norm.length < 3) return null;

  for (const ip of catalogo) {
    const normIp = normalizeAgentName(ip.nombre);
    
    // Match exacto o contiene
    if (norm.includes(normIp) || normIp.includes(norm)) {
      return ip.id ?? null;
    }
  }

  return null;
};

/**
 * Umbral de inactividad crítica: 4 días = 96 horas
 */
export const UMBRAL_CRITICO_HORAS = 96;

/**
 * Convierte un string de inactividad a horas totales
 * Formatos soportados:
 *   - "3mes, 9j, 19h"  →  meses + días + horas
 *   - "1j, 18h"         →  días + horas
 *   - "18h"              →  solo horas
 *   - "3mes"             →  solo meses
 *   - "5j"               →  solo días
 *   - "0m 3j 99h"        →  minutos + días + horas
 * 
 * Conversiones:
 *   - 1 mes ≈ 30 días (720 horas)
 *   - 1 día = 24 horas
 *   - 1 hora = 1 hora
 *   - 1 minuto = 1/60 hora (se ignora para el cálculo)
 */
export const parseInactividadToHours = (inactividad: string | null): number => {
  if (!inactividad) return 0;

  const lower = inactividad.toLowerCase().trim();
  let totalHoras = 0;

  // Extraer meses (formato: "3mes" o "3 mes")
  const mesesMatch = lower.match(/(\d+)\s*mes/i);
  if (mesesMatch) {
    totalHoras += parseInt(mesesMatch[1]) * 24 * 30; // 1 mes = 30 días
  }

  // Extraer días (formato: "9j", "9j," "9 j", "9 días", "9d")
  // Incluye "j" (francés), "d" (días), "días", "dias", "days", "day"
  const diasMatch = lower.match(/(\d+)\s*(?:j|d(?:í|i)?s|days?|day)/i);
  if (diasMatch) {
    totalHoras += parseInt(diasMatch[1]) * 24; // 1 día = 24 horas
  }

  // Extraer horas (formato: "19h" o "19 h")
  const horasMatch = lower.match(/(\d+)\s*h(?!;)/);
  if (horasMatch) {
    totalHoras += parseInt(horasMatch[1]);
  }

  return totalHoras;
};

/**
 * Calcula el estado basado en la inactividad total en horas
 * Crítico si >= 96 horas (4 días)
 */
export const calculateEstado = (
  inactividadImpresora: string | null,
  inactividadAgente: string | null
): 'online' | 'critico' => {
  const horasImpresora = parseInactividadToHours(inactividadImpresora);
  const horasAgente = parseInactividadToHours(inactividadAgente);

  // Crítico si ALGUNA de las dos inactividades supera el umbral
  if (horasImpresora >= UMBRAL_CRITICO_HORAS || horasAgente >= UMBRAL_CRITICO_HORAS) {
    return 'critico';
  }

  return 'online';
};

/**
 * Parsea el texto CSV con manejo de encoding
 * Soporta UTF-8 con BOM y Windows-1252
 */
export const parseCsvText = (buffer: ArrayBuffer): string => {
  let text = new TextDecoder('utf-8').decode(buffer);
  
  // Quitar BOM si existe
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.substring(1);
  }
  
  // Detectar encoding Windows-1252 por caracteres raros
  if (text.includes('Ã') || text.includes('ï»¿')) {
    text = new TextDecoder('windows-1252').decode(buffer);
    // Quitar BOM si existe después de re-decode
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.substring(1);
    }
  }
  
  return text;
};

/**
 * Parsea el archivo 68 KPAX y retorna los datos normalizados
 */
export const parseArchivo68 = (
  csvText: string,
  catalogo: Infoplaza[]
): KpaxUnificadoSync[] => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';'
  });

  if (result.errors.length > 0) {
    console.error('[Parser 68] Errores al parsear:', result.errors);
  }

  const parsed: KpaxUnificadoSync[] = [];

  for (const row of result.data as Record<string, string>[]) {
    // Extraer campos del CSV
    const numeroSerie = row['Número de serie'] || row['numero de serie'] || '';
    if (!numeroSerie) continue; // Ignorar sin número de serie

    const dispositivo: KpaxUnificadoSync = {
      numero_serie: numeroSerie,
      fabricante: row['Constructor'] || null,
      modelo: row['Modelo'] || null,
      ip: row['Dirección IP'] || row['Direccion IP'] || null,
      mac: row['Dirección MAC'] || row['Direccion MAC'] || null,
      fecha_instalacion: row['Fecha de instalación'] || row['Fecha de instalacion'] || null,
      nombre_agente: row['Nombre del agente'] || null,
      ultima_actualizacion: row['Última actualización'] || row['Ultima actualizacion'] || null,
      inactividad_impresora: row['Inactividad'] || null,
      inactividad_agente: row['Inactividad del agente'] || null,
      hostname_agente: row['Nombre de host del agente'] || null,
      ubicacion: null, // Se puede derivar de nombre_agente o agregar columna si existe
      infoplaza_id: null // Se calcula abajo
    };

    // Match con infoplaza usando el nombre del agente
    if (dispositivo.nombre_agente) {
      dispositivo.infoplaza_id = matchInfoplaza(dispositivo.nombre_agente, catalogo);
    }

    parsed.push(dispositivo);
  }

  return parsed;
};

/**
 * Alias para mantener compatibilidad
 */
export const parseKpax68 = parseArchivo68;
