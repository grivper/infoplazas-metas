interface InfoplazaData {
  meses: Record<string, number | null>;
  nombre: string;
  enlace: string;
  dia: string;
}

export interface TableRow {
  name: string;
  cells: { mes: string; visitas: number | null; incremento: number | null }[];
  ultimoValor: number | null;
  enlace: string;
  dia: string;
}

/**
 * Construye las filas de la tabla de infoplazas ordenadas por enlace.
 * Calcula el incremento de visitas respecto al mes anterior.
 * Ordena por: 1) enlace alfabético, 2) último valor descendente (NULLs al final).
 */
export function buildTableRows(meses: string[], visitasMock: Record<string, InfoplazaData>): TableRow[] {
  const ultimoMes = meses[meses.length - 1];
  
  return Object.values(visitasMock)
    .map((ipData) => {
      const cells = meses.map((mes, i) => {
        const val = ipData.meses[mes] ?? null;
        const prev = i > 0 ? (ipData.meses[meses[i - 1]] ?? null) : null;
        
        let incremento: number | null = null;
        if (i === 0) {
          incremento = val !== null ? 0 : null;
        } else if (val !== null && prev !== null) {
          incremento = Number((val - prev).toFixed(2));
        } else {
          incremento = null;
        }
        
        return { mes, visitas: val, incremento };
      });
      return { 
        name: ipData.nombre, 
        cells, 
        ultimoValor: ipData.meses[ultimoMes] ?? null,
        enlace: ipData.enlace,
        dia: ipData.dia
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
