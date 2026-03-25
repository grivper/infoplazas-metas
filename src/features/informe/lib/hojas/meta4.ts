/**
 * Hoja: Meta 4 - Plan de Visitas
 */
import ExcelJS from 'exceljs';
import type { Meta4Data } from '../datos';

export const crearHojaMeta4 = async (wb: ExcelJS.Workbook, m: Meta4Data) => {
  const ws = wb.addWorksheet('Ejecución Meta No.4 2026');

  // Títulos
  ws.mergeCells(1, 2, 1, 4);
  ws.getCell(1, 2).value = 'Metas 2026';
  ws.getCell(1, 2).font = { bold: true, size: 14 };

  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';

  ws.mergeCells(3, 2, 3, 4);
  ws.getCell(3, 2).value = 'Meta No.4 - Plan de Visitas';
  ws.getCell(3, 2).font = { bold: true };

  ws.mergeCells(5, 2, 5, 4);
  ws.getCell(5, 2).value = 'CUMPLIMIENTO DE RUTAS';
  ws.getCell(5, 2).font = { bold: true };

  // Resumen
  ws.getCell(7, 2).value = 'Resumen:';
  ws.getCell(7, 3).value = `Tasa de Éxito: ${m.tasaExito}%`;

  // Headers
  const headerRow = 9;
  ['Enlace', 'Visitadas', 'Meta', '%'].forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
  });

  // Datos
  m.enlaces.forEach((e, idx) => {
    const row = 10 + idx;
    ws.getCell(row, 2).value = e.nombre;
    ws.getCell(row, 3).value = e.visitadas;
    ws.getCell(row, 4).value = e.meta;
    ws.getCell(row, 5).value = e.cumplimiento;
  });

  [5, 30, 12, 10, 15, 10, 10, 10, 10].forEach((w, i) => ws.getColumn(i + 1).width = w);
};
