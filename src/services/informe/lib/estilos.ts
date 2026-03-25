import * as XLSX from 'xlsx';

/**
 * Estilos y helpers para el Excel de metas
 */

// Colores por meta (formato hex RGB sin #)
export const COLORES_META = {
  header: '1F2937',
  meta1: '2A4BD9',
  meta2: '059669',
  meta3: 'F59E0B',
  meta4: '6366F1',
  meta5: '9F0051',
};

/**
 * Ajusta el ancho de las columnas
 */
export const setColumnWidth = (ws: XLSX.WorkSheet, widths: number[]): void => {
  ws['!cols'] = widths.map(w => ({ wch: w }));
};

/**
 * Aplica color de fondo a un rango de celdas
 */
export const applyHeaderStyle = (ws: XLSX.WorkSheet, range: string, color: string): void => {
  const decoded = XLSX.utils.decode_range(range);
  for (let R = decoded.s.r; R <= decoded.e.r; ++R) {
    for (let C = decoded.s.c; C <= decoded.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
      ws[cellRef].s = {
        fill: { fgColor: { rgb: color } },
        font: { color: { rgb: 'FFFFFF' }, bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
          left: { style: 'thin', color: { rgb: 'E5E7EB' } },
          right: { style: 'thin', color: { rgb: 'E5E7EB' } }
        }
      };
    }
  }
};
