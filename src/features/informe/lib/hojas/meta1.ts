/**
 * Hoja: Meta 1 - Servicio Social Universitario
 */
import ExcelJS from 'exceljs';
import type { Meta1Data } from '../datos';

export const crearHojaMeta1 = async (wb: ExcelJS.Workbook, m: Meta1Data) => {
  const ws = wb.addWorksheet('Ejecución Meta No.1 2026');

  // Títulos
  ws.mergeCells(1, 2, 1, 4);
  ws.getCell(1, 2).value = 'Metas 2026';
  ws.getCell(1, 2).font = { bold: true, size: 14 };

  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';

  ws.mergeCells(3, 2, 3, 4);
  ws.getCell(3, 2).value = 'Meta No.1 - Servicio Social Universitario';
  ws.getCell(3, 2).font = { bold: true };

  ws.mergeCells(5, 2, 5, 4);
  ws.getCell(5, 2).value = 'PROGRAMA DE SERVICIO SOCIAL UNIVERSITARIO 2026';
  ws.getCell(5, 2).font = { bold: true };

  // Resultados
  ws.getCell(7, 2).value = 'Resultados Acumulados:';

  // Headers
  const headerRow = 9;
  ['Indicador', 'Meta', 'Ejecutado', '%'].forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
  });

  // Datos
  const datos = [
    { indicador: 'Universidades', meta: 5, actual: m.universidades },
    { indicador: 'Estudiantes', meta: 60, actual: m.estudiantes },
    { indicador: 'Talleres', meta: 140, actual: m.talleres },
    { indicador: 'Usuarios', meta: 600, actual: m.usuarios }
  ];

  datos.forEach((d, idx) => {
    const row = 10 + idx;
    ws.getCell(row, 2).value = d.indicador;
    ws.getCell(row, 3).value = d.meta;
    ws.getCell(row, 4).value = d.actual;
    ws.getCell(row, 5).value = Math.round((d.actual / d.meta) * 100);
  });

  // Avance mensual
  ws.getCell(15, 4).value = 'AVANCE MENSUAL';
  ws.getCell(15, 4).font = { bold: true };

  ws.getCell(17, 2).value = 'Mes';
  ws.getCell(17, 3).value = 'Talleres';
  ws.getCell(17, 4).value = 'Usuarios';
  [2, 3, 4].forEach(c => ws.getCell(17, c).font = { bold: true });

  m.talleresPorMes.forEach((t, idx) => {
    ws.getCell(18 + idx, 2).value = t.mes;
    ws.getCell(18 + idx, 3).value = t.cantidad;
    ws.getCell(18 + idx, 4).value = t.usuarios;
  });

  [5, 25, 12, 12, 10, 10, 10, 10, 10].forEach((w, i) => ws.getColumn(i + 1).width = w);
};
