/**
 * Hoja: Meta 3 - Mesas de Transformación
 */
import ExcelJS from 'exceljs';
import type { Meta3Data } from '../datos';

export const crearHojaMeta3 = async (wb: ExcelJS.Workbook, m: Meta3Data) => {
  const ws = wb.addWorksheet('Ejecución Meta No.3 2026');

  // Títulos
  ws.mergeCells(1, 2, 1, 4);
  ws.getCell(1, 2).value = 'Metas 2026';
  ws.getCell(1, 2).font = { bold: true, size: 14 };

  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';

  ws.mergeCells(3, 2, 3, 4);
  ws.getCell(3, 2).value = 'Meta No.3 - Mesas de Transformación';
  ws.getCell(3, 2).font = { bold: true };

  ws.mergeCells(5, 2, 5, 4);
  ws.getCell(5, 2).value = 'MESAS DE TRANSFORMACIÓN 2026';
  ws.getCell(5, 2).font = { bold: true };

  // Resumen
  ws.getCell(7, 2).value = 'Resumen:';
  ws.getCell(7, 3).value = `Completadas: ${m.totalCompletadas}`;
  ws.getCell(7, 4).value = `En Progreso: ${m.totalProgreso}`;

  // Headers
  const headerRow = 9;
  ['Región', 'Mesa', 'Infoplaza', 'Estado', 'Participantes', 'Dinamizador'].forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
  });

  // Datos
  m.mesas.forEach((mesa, idx) => {
    const row = 10 + idx;
    ws.getCell(row, 2).value = mesa.region;
    ws.getCell(row, 3).value = mesa.mesa;
    ws.getCell(row, 4).value = mesa.infoplaza;
    ws.getCell(row, 5).value = mesa.estado;
    ws.getCell(row, 6).value = mesa.participantes;
    ws.getCell(row, 7).value = mesa.dinamizador;
  });

  [5, 15, 8, 25, 15, 12, 25, 10, 10].forEach((w, i) => ws.getColumn(i + 1).width = w);
};
