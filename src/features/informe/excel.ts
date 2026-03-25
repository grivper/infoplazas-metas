/**
 * Generación del Excel de informe de metas
 * Usa ExcelJS para mejor soporte de estilos
 */
import ExcelJS from 'exceljs';
import { getAllMetasData } from './lib/datos';
import { crearHojaResumen, crearHojaMeta1, crearHojaMeta2, crearHojaMeta3, crearHojaMeta4, crearHojaMeta5 } from './lib/hojas';

/**
 * Genera el archivo Excel
 */
export const generarExcelMetas = async (): Promise<Blob> => {
  const [meta1, meta2, meta3, meta4, meta5] = await getAllMetasData();
  const wb = new ExcelJS.Workbook();

  // Crear cada hoja
  await crearHojaResumen(wb, meta1, meta2, meta3, meta4, meta5);
  await crearHojaMeta1(wb, meta1);
  await crearHojaMeta2(wb, meta2);
  await crearHojaMeta3(wb, meta3);
  await crearHojaMeta4(wb, meta4);
  await crearHojaMeta5(wb, meta5);

  // Convertir a blob para browser
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Descarga el Excel
 */
export const descargarExcelMetas = async (filename?: string): Promise<void> => {
  const blob = await generarExcelMetas();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `informe-metas-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
