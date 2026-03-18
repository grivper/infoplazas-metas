import { supabase } from '@/lib/supabase';
import { fetchInfoplazasEnlaceMap, type InfoplazaEnlace } from '@/lib/infoplazas';

/**
 * Interfaz para el registro de sincronización de Meta 30%.
 * Se guarda en la tabla `meta_30_sincronizacion`.
 */
export interface Meta30Sincronizacion {
  id?: string;
  sheet_name: string;
  data: Record<string, unknown>[];
  fecha_sincronizacion?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Guarda los datos de Meta 30 sincronizados desde Google Sheets.
 * Si ya existe un registro para esa hoja, lo actualiza; si no, crea uno nuevo.
 * 
 * @param sheetName Nombre de la hoja en Google Sheets
 * @param data Array de registros provenientes de la hoja
 */
export const saveMeta30Sync = async (
  sheetName: string, 
  data: Record<string, unknown>[]
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Primero verificamos si ya existe un registro para esta hoja
    const { data: existing, error: fetchError } = await supabase
      .from('meta_30_sincronizacion')
      .select('id')
      .eq('sheet_name', sheetName)
      .maybeSingle();

    if (fetchError) {
      console.error('Error al buscar registro existente:', fetchError);
      throw fetchError;
    }

    const payload = {
      sheet_name: sheetName,
      data: data,
      fecha_sincronizacion: new Date().toISOString(),
    };

    if (existing) {
      // Actualizar registro existente
      const { error: updateError } = await supabase
        .from('meta_30_sincronizacion')
        .update(payload)
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Crear nuevo registro
      const { error: insertError } = await supabase
        .from('meta_30_sincronizacion')
        .insert(payload);

      if (insertError) throw insertError;
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error en saveMeta30Sync:', err);
    return { success: false, error: err as Error };
  }
};

/**
 * Obtiene el último registro de sincronización para una hoja específica.
 */
export const getLastMeta30Sync = async (sheetName: string): Promise<Meta30Sincronizacion | null> => {
  const { data, error } = await supabase
    .from('meta_30_sincronizacion')
    .select('*')
    .eq('sheet_name', sheetName)
    .order('fecha_sincronizacion', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener última sincronización:', error);
    return null;
  }

  return data;
};

// --- Tipos para la vista de Visitas ---
export interface RegistroMeta30 {
  ID_Visita: string;
  ID_SUCURSAL: string | number; // Puede ser número o hash
  Infoplaza: string;
  Año: number | string; // Puede venir como string en JSON
  Mes: string;
  Masculino: number;
  Femenino: number;
  Primaria: number;
  Secundaria: number;
  Universitario: number;
  Docente: number;
  'Tercera Edad': number;
  'Publico General': number;
  Total: number;
  NumPC: number;
  Meta: number;
  Porcentaje: number | string;
  Fuente: string;
}

export interface DatosVistaVisitas {
  // Para KPIs: cumplimiento por mes (cuántas IP cumplieron >=30% vs meta)
  cumplimientoNacional: Record<string, number>;
  // Para tabla: porcentaje por IP por mes
  visitasPorInfoplaza: Record<string, { nombre: string; meses: Record<string, number | null>; enlace: string; dia: string }>;
  // KPIs globales
  promedioNacional: number;
  ipMetaCumplida: number; // >= 100%
  ipEnRiesgo: number; // < 10%
  ipSobre30: number; // >= 30%
  totalIP: number;
  mesActual: string; // Mes usado para los KPIs
}

/**
 * Transforma los datos crudos de Google Sheets al formato necesario para la vista.
 * - cumplimientoNacional: cuenta cuántas IP cumplieron >=30% por mes
 * - visitasPorInfoplaza: agrupa por número de Infoplaza con Porcentaje por Mes
 * - KPIs globales calculados del último mes con datos
 */
export const transformarDatosMeta30 = (
  data: RegistroMeta30[], 
  enlaceMap: Record<string, InfoplazaEnlace> = {}
): DatosVistaVisitas => {
  // Agrupar por número de Infoplaza y Mes
  const visitasPorInfoplaza: Record<string, { nombre: string; meses: Record<string, number | null>; enlace: string; dia: string }> = {};
  const cumplimientoPorMes: Record<string, number> = {};

  const mesesOrdenados = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Inicializar meses con 0
  mesesOrdenados.forEach(mes => {
    cumplimientoPorMes[mes] = 0;
  });

  // Variables para KPIs globales
  const ultimosPorcentajes: { nombre: string; porcentaje: number }[] = [];

  data.forEach(registro => {
    const { Infoplaza, Mes, Total, Porcentaje } = registro;
    
    // Extraer número del Infoplaza para comparaciones (ej: "132 - Pesé" -> "132")
    const numeroInfoplaza = Infoplaza?.split(' ')[0] || '';
    
    // Porcentaje puede venir como string o número
    const porcentajeNum = typeof Porcentaje === 'string' ? parseFloat(Porcentaje) : Porcentaje;

    // Obtener info de enlace
    const enlaceInfo = enlaceMap[numeroInfoplaza] || { enlace: 'Sin asignar', dia: '' };

    // Guardar porcentaje por Infoplaza (usar número extraído para comparaciones)
    if (!visitasPorInfoplaza[numeroInfoplaza]) {
      visitasPorInfoplaza[numeroInfoplaza] = { 
        nombre: Infoplaza, 
        meses: {},
        enlace: enlaceInfo.enlace,
        dia: enlaceInfo.dia
      };
    }
    // Porcentaje del mes (si hay visitas)
    if (Total > 0) {
      visitasPorInfoplaza[numeroInfoplaza].meses[Mes] = porcentajeNum;
    } else {
      // Sin visitas = sin porcentaje (null)
      visitasPorInfoplaza[numeroInfoplaza].meses[Mes] = null;
    }

    // Cumplimiento: cuenta IP que alcanzaron >=30% de la meta
    if (porcentajeNum >= 30) {
      cumplimientoPorMes[Mes] = (cumplimientoPorMes[Mes] || 0) + 1;
    }
  });

  // Determinar el mes actual para los KPIs (del año que se está mostrando)
  const mesActual = new Date().toLocaleString('es-ES', { month: 'long' });
  // Primera letra en mayúscula
  const mesActualCapitalized = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
  
  // Verificar si hay datos del mes actual, si no usar el último mes con datos
  let mesParaKpis = mesActualCapitalized;
  const tieneDatosMesActual = Object.values(visitasPorInfoplaza).some(ip => {
    const pct = ip.meses[mesActualCapitalized];
    return pct !== null && pct !== undefined;
  });
  
  if (!tieneDatosMesActual) {
    // Buscar el último mes con datos
    for (let i = mesesOrdenados.length - 1; i >= 0; i--) {
      const tieneDatos = Object.values(visitasPorInfoplaza).some(ip => {
        const pct = ip.meses[mesesOrdenados[i]];
        return pct !== null && pct !== undefined;
      });
      if (tieneDatos) {
        mesParaKpis = mesesOrdenados[i];
        break;
      }
    }
  }

  // Recopilar porcentajes por IP del mes seleccionado
  Object.values(visitasPorInfoplaza).forEach(ip => {
    const pct = ip.meses[mesParaKpis];
    if (pct !== null && pct !== undefined) {
      ultimosPorcentajes.push({ nombre: ip.nombre, porcentaje: pct });
    }
  });

  // Calcular KPIs
  const totalIP = ultimosPorcentajes.length;
  const ipMetaCumplida = ultimosPorcentajes.filter(p => p.porcentaje >= 100).length;
  const ipEnRiesgo = ultimosPorcentajes.filter(p => p.porcentaje < 10).length;
  const ipSobre30 = ultimosPorcentajes.filter(p => p.porcentaje >= 30).length;
  const promedioNacional = totalIP > 0 
    ? ultimosPorcentajes.reduce((sum, p) => sum + p.porcentaje, 0) / totalIP 
    : 0;

  return {
    cumplimientoNacional: cumplimientoPorMes,
    visitasPorInfoplaza,
    promedioNacional: Number(promedioNacional.toFixed(2)),
    ipMetaCumplida,
    ipEnRiesgo,
    ipSobre30,
    totalIP,
    mesActual: mesParaKpis, // Mes usado para los KPIs
  };
};

/**
 * Obtiene los datos transformados para la vista de visitas.
 * Filtra por el año actual.
 */
export const getDatosVisitas = async (sheetName: string, año?: number): Promise<DatosVistaVisitas | null> => {
  const añoActual = año || new Date().getFullYear();
  
  // Obtener mapeo de infoplaza -> enlace en paralelo
  const [sync, enlaceMap] = await Promise.all([
    getLastMeta30Sync(sheetName),
    fetchInfoplazasEnlaceMap()
  ]);
  
  if (!sync || !sync.data || sync.data.length === 0) {
    return null;
  }

  const registros = sync.data as unknown as RegistroMeta30[];
  
  // Filtrar por año (viene como string o número en JSON, convertir a número)
  const registrosFiltrados = registros.filter(r => {
    const añoRegistro = typeof r.Año === 'string' ? parseInt(r.Año, 10) : r.Año;
    // Ignorar años inválidos (como "0")
    return añoRegistro > 0 && añoRegistro === añoActual;
  });
  
  if (registrosFiltrados.length === 0) {
    return null;
  }

  return transformarDatosMeta30(registrosFiltrados, enlaceMap);
};
