interface InfoplazaData {
  meses: Record<string, number | null>;
  nombre: string;
  enlace: string;
  dia: string;
  cerrada: boolean;
}

export interface TableRow {
  name: string;
  cells: { mes: string; visitas: number | null; incremento: number | null }[];
  ultimoValor: number | null;
  enlace: string;
  dia: string;
  estado: 'abierta' | 'cerrada' | 'sin_asignar';
}

/** Meses ordenados del año para navegación cross-cuatrimestre. */
const MESES_DEL_AÑO = [
  'Enero', 'Febrero', 'Marzo', 'Abril',
  'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Construye las filas de la tabla de infoplazas ordenadas por enlace.
 * Calcula el incremento de visitas respecto al mes anterior (cross-cuatrimestre).
 * Ordena por: 1) enlace alfabético, 2) último valor descendente (NULLs al final).
 */
export function buildTableRows(meses: string[], visitasMock: Record<string, InfoplazaData>): TableRow[] {
  const ultimoMes = meses[meses.length - 1];
  
  return Object.values(visitasMock)
    .map((ipData) => {
      const cells = meses.map((mes, i) => {
        const val = ipData.meses[mes] ?? null;
        
        // Determinar el mes anterior (puede estar fuera del cuatrimestre actual)
        let prevMonthKey: string | null = null;
        if (i > 0) {
          prevMonthKey = meses[i - 1];
        } else {
          const idx = MESES_DEL_AÑO.indexOf(mes);
          if (idx > 0) prevMonthKey = MESES_DEL_AÑO[idx - 1];
        }
        
        const prev = prevMonthKey ? (ipData.meses[prevMonthKey] ?? null) : null;
        
        // Calcular incremento: diferencia contra el mes anterior (si existe y no es null)
        let incremento: number | null = null;
        if (val !== null && prev !== null) {
          incremento = Number((val - prev).toFixed(2));
        } else if (val !== null) {
          // Hay valor actual pero no hay mes anterior (ej: Enero, o sin datos previos)
          incremento = 0;
        }
        // Si val es null, incremento queda como null
        
        return { mes, visitas: val, incremento };
      });
      
      const estado: 'abierta' | 'cerrada' | 'sin_asignar' = ipData.cerrada 
        ? 'cerrada' 
        : (ipData.enlace === 'Sin asignar' ? 'sin_asignar' : 'abierta');
      
      return { 
        name: ipData.nombre, 
        cells, 
        ultimoValor: ipData.meses[ultimoMes] ?? null,
        enlace: ipData.enlace,
        dia: ipData.dia,
        estado
      };
    })
    .sort((a, b) => {
      if (a.enlace !== b.enlace) {
        return a.enlace.localeCompare(b.enlace);
      }
      if (a.ultimoValor === null && b.ultimoValor === null) return 0;
      if (a.ultimoValor === null) return 1;
      if (b.ultimoValor === null) return -1;
      return b.ultimoValor - a.ultimoValor;
    });
}
