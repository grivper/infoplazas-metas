/**
 * Hoja: Meta 2 - Cumplimiento 30%
 */
import ExcelJS from 'exceljs';
import type { Meta2Data } from '../datos';

export const crearHojaMeta2 = async (wb: ExcelJS.Workbook, m: Meta2Data) => {
  const ws = wb.addWorksheet('Ejecución Meta No.2 2026');

  // Títulos
  ws.mergeCells(1, 2, 1, 4);
  ws.getCell(1, 2).value = 'Metas 2026';
  ws.getCell(1, 2).font = { bold: true, size: 14 };

  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';

  ws.mergeCells(3, 2, 3, 4);
  ws.getCell(3, 2).value = 'Meta No.2 - Cumplimiento 30%';
  ws.getCell(3, 2).font = { bold: true };

  ws.mergeCells(5, 2, 5, 4);
  ws.getCell(5, 2).value = 'SEGUIMIENTO VISITAS A INFOPLAZAS';
  ws.getCell(5, 2).font = { bold: true };

  // Resultados
  ws.getCell(7, 2).value = 'Resultados:';
  ws.getCell(7, 3).value = `Incidencias: ${m.incidencias}`;

  // Headers
  const headerRow = 9;
  ['Mes', 'IP Sobre 30%', 'Total IP', '%'].forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
  });

  // Datos
  m.historial.forEach((h, idx) => {
    const row = 10 + idx;
    ws.getCell(row, 2).value = h.mes;
    ws.getCell(row, 3).value = h.ip_sobre_30;
    ws.getCell(row, 4).value = h.total;
    ws.getCell(row, 5).value = h.progreso;
  });

  [5, 20, 15, 12, 12, 10, 10, 10, 10].forEach((w, i) => ws.getColumn(i + 1).width = w);
};
