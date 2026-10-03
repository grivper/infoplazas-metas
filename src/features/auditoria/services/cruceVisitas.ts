import { supabase } from '@/lib/supabase';
import { fetchAllItinerarios } from './itinerarioService';
import { getAllVisitasCognito } from './rutasDb';

// --- Constantes ---
export const MESES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};
export const MES_ACTUAL = new Date().getMonth() + 1;

// Normalizador anti-encoding para cruces exactos
const normalize = (str: string) => {
  if (!str) return "";
  return str
    .replace(/�/g, 'e')
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
};

// Extractor de IDs numéricos para cruces inquebrantables
const extractId = (str: string) => {
  if (!str) return null;
  const m = str.trim().match(/^(\d+)/);
  return m ? m[1] : null;
};

export interface InfoplazaStatus {
  nombre: string;
  uuid: string | null;
  visitada: boolean;
}

export interface DiaItinerario {
  diaRuta: string;
  diaSemana: string;
  infoplazas: InfoplazaStatus[];
}

export interface ItinerarioEnlace {
  enlace: string;
  dias: DiaItinerario[];
  totalInfoplazas: number;
  visitadasUnicas: number;
  pct: number;
}

interface CognitoVisita {
  mes?: number;
  fecha?: string;
  Fecha?: string;
  'Enlace Regional'?: string;
  enlace_original?: string;
  enlace?: string;
  '# de Infoplaza'?: string;
  infoplaza?: string;
  infoplaza_id?: string; // UUID de Supabase
}

/**
 * Carga las rutas de cada enlace y las cruza con las visitas de Cognito del mes
 * indicado, marcando cada infoplaza como visitada o no (semáforo).
 */
export const calcularItinerarios = async (mes: number): Promise<ItinerarioEnlace[]> => {
  // 1. Obtiene Rutas base y agrupa por Enlace + Día
  const rutasListPlana = await fetchAllItinerarios();
  const mapItinerarios = rutasListPlana.reduce((acc, r) => {
    if (!acc[r.enlace]) acc[r.enlace] = {};
    const keyDia = r.dia_ruta || 'Día No Asignado';
    if (!acc[r.enlace][keyDia]) {
      acc[r.enlace][keyDia] = {
        diaRuta: keyDia,
        diaSemana: r.dia_semana || '',
        infoplazas: [] as InfoplazaStatus[]
      };
    }
    // Guardamos nombre y UUID para poder comparar correctamente
    acc[r.enlace][keyDia].infoplazas.push({
      nombre: r.infoplaza,
      uuid: r.infoplaza_id,
      visitada: false // Se calculará después
    });
    return acc;
  }, {} as Record<string, Record<string, { diaRuta: string; diaSemana: string; infoplazas: InfoplazaStatus[] }>>);

  // 2. Extrae visitas de Cognito respetando el filtro mensual
  const visitas = await getAllVisitasCognito() as CognitoVisita[];

  // Obtener la memoria (snapshots) del mes evaluado
  const añoActual = new Date().getFullYear();
  const { data: snapshotsData } = await supabase
    .from('meta_4_snapshots')
    .select('enlace_nombre, total_ip, infoplazas_json')
    .eq('mes_num', mes)
    .eq('año', añoActual);

  const snapshotsMap = new Map<string, number>();
  const snapshotsIdsMap = new Map<string, Set<string>>();
  if (snapshotsData) {
    snapshotsData.forEach(s => {
      snapshotsMap.set(s.enlace_nombre, s.total_ip);
      if (s.infoplazas_json && Array.isArray(s.infoplazas_json)) {
        snapshotsIdsMap.set(s.enlace_nombre, new Set(s.infoplazas_json));
      }
    });
  }

  const visitasMes = visitas.filter((v) => {
    let vMes = v.mes;
    const rawFecha = v.fecha || v['Fecha'] || '';
    if (!vMes && rawFecha && rawFecha.includes('/')) {
       const partes = rawFecha.split('/');
       if (partes.length >= 2) vMes = parseInt(partes[1], 10);
    }
    return vMes === mes;
  });

  // 3. Forma el arreglo renderizable y ejecuta Cruce Match Anti-Encoding e Inquebrantable Numérico
  const itinerariosArray: ItinerarioEnlace[] = Object.entries(mapItinerarios).map(([enlace, diasObj]) => {

    const ipsVisitadasSet = new Set<string>(); // Set para evitar sobrecontar infoplazas visitadas varias veces

    // Construir sub-arbol y setear el booleano 'visitada' para el UI Semáforo
    const diasArray = Object.values(diasObj).map(d => {
      const stadoIps: InfoplazaStatus[] = d.infoplazas
        // MAGIA: Filtrar visualmente las que no existían en la foto histórica
        .filter(ip => {
          if (mes >= MES_ACTUAL) return true;
          const validIds = snapshotsIdsMap.get(enlace);
          if (!validIds) return true;
          return ip.uuid ? validIds.has(ip.uuid) : true;
        })
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(ip => {
          // Buscar si esta infoplaza fue visitada en este mes por CUALQUIERA (lógica territorial)
          const matchVisita = visitasMes.some((v) => {
            // 1. Comparar por UUID directo (Supabase)
            if (ip.uuid && v.infoplaza_id && ip.uuid === v.infoplaza_id) return true;

            // 2. Extraer ID numérico del nombre (ej: "599 - Barrios" -> "599")
            const idRuta = extractId(ip.nombre);
            const ipRaw = v['# de Infoplaza'] || v.infoplaza || '';
            const idVisita = extractId(ipRaw);

            if (idRuta && idVisita && idRuta === idVisita) return true;

            // 3. Fallback por nombre normalizado
            const nombreRutaNorm = normalize(ip.nombre);
            const nombreVisitaNorm = normalize(ipRaw);
            if (nombreRutaNorm && nombreVisitaNorm) {
              return nombreRutaNorm.includes(nombreVisitaNorm) || nombreVisitaNorm.includes(nombreRutaNorm);
            }

            return false;
          });

          if (matchVisita) ipsVisitadasSet.add(ip.uuid || ip.nombre);
          return { ...ip, visitada: matchVisita };
        });

      return {
        diaRuta: d.diaRuta,
        diaSemana: d.diaSemana,
        infoplazas: stadoIps
      };
    });

    // Orden natural alfanumérico para los días
    diasArray.sort((a, b) => a.diaRuta.localeCompare(b.diaRuta, undefined, { numeric: true, sensitivity: 'base' }));

    // Eliminar días que se quedaron sin infoplazas tras el filtro histórico
    const diasActivos = diasArray.filter(d => d.infoplazas.length > 0);

    // Matemáticas Finales del Nodo
    let totalIps = diasActivos.reduce((acc, d) => acc + d.infoplazas.length, 0);

    // Si es un mes pasado y existe snapshot, respetamos la historia
    if (mes < MES_ACTUAL && snapshotsMap.has(enlace)) {
      totalIps = snapshotsMap.get(enlace)!;
    }

    const funcActUnique = ipsVisitadasSet.size;
    const p = totalIps > 0 ? Math.round((funcActUnique / totalIps) * 100) : 0;

    return { enlace, dias: diasActivos, totalInfoplazas: totalIps, visitadasUnicas: funcActUnique, pct: p };
  });

  return itinerariosArray.sort((a, b) => a.enlace.localeCompare(b.enlace));
};
