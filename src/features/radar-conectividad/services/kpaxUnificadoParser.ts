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
 * Calcula el estado basado en la inactividad
 * - Si contiene "mes", "semana", o "días" (j) → crítico
 * - Si solo horas → crítico si >= 24h
 */
export const calculateEstado = (
  inactividadImpresora: string | null,
  inactividadAgente: string | null
): 'online' | 'critico' => {
  const checkInactividadLocal = (inact: string | null): boolean => {
    if (!inact) return false;
    const lower = inact.toLowerCase();
    
    // Contiene unidades grandes = crítico inmediatamente
    if (lower.includes('mes') || lower.includes('semana') || 
        lower.includes('j,') || lower.includes('j ') || lower.endsWith('j') ||
        lower.includes('días') || lower.includes('dias') || lower.includes('days') ||
        lower.includes('day')) {
      return true;
    }
    
    // Verificar si tiene solo horas
    if (lower.includes('h')) {
      // Extraer horas y verificar si >= 24
      const match = lower.match(/(\d+)h/);
      if (match) {
        const horas = parseInt(match[1]);
        return horas >= 24;
      }
    }
    
    return false;
  };

  // Crítico si cualquiera de las dos inactividades indica mucho tiempo
  if (checkInactividadLocal(inactividadImpresora) || checkInactividadLocal(inactividadAgente)) {
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
