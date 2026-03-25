/**
 * Hoja: Meta 5 - KPAX
 */
import ExcelJS from 'exceljs';
import type { Meta5Data } from '../datos';

export const crearHojaMeta5 = async (wb: ExcelJS.Workbook, m: Meta5Data) => {
  const ws = wb.addWorksheet('Ejecución Meta No.5 2026');

  // Títulos
  ws.mergeCells(1, 2, 1, 4);
  ws.getCell(1, 2).value = 'Metas 2026';
  ws.getCell(1, 2).font = { bold: true, size: 14 };

  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';

  ws.mergeCells(3, 2, 3, 4);
  ws.getCell(3, 2).value = 'Meta No.5 - KPAX';
  ws.getCell(3, 2).font = { bold: true };

  ws.mergeCells(5, 2, 5, 4);
  ws.getCell(5, 2).value = 'SEGUIMIENTO SOFTWARE KPAX';
  ws.getCell(5, 2).font = { bold: true };

  // Resumen
  ws.getCell(7, 2).value = 'Resumen de Equipos:';

  // Headers
  const headerRow = 9;
  ['Indicador', 'Valor', '%'].forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
  });

  // Datos
  ws.getCell(10, 2).value = 'Equipos Online';
  ws.getCell(10, 3).value = m.equiposOnline;
  ws.getCell(10, 4).value = m.conectividad;

  ws.getCell(11, 2).value = 'Equipos Totales';
  ws.getCell(11, 3).value = m.equiposTotal;

  ws.getCell(12, 2).value = 'Equipos Críticos';
  ws.getCell(12, 3).value = m.criticos;

  ws.getCell(14, 2).value = 'Conectividad Regional:';
  ws.getCell(14, 3).value = `${m.conectividad}%`;

  [5, 25, 15, 12, 10, 10, 10, 10, 10].forEach((w, i) => ws.getColumn(i + 1).width = w);
};
