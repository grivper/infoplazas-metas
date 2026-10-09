/**
 * Construcción y estilizado del libro de Excel con las confirmaciones del
 * encuentro regional. Extraído de confirmacionesExcel.ts para mantener los
 * archivos por debajo del límite de 300 líneas con una sola responsabilidad
 * cada uno: este archivo solo arma el `ExcelJS.Workbook`, sin tocar Supabase.
 */
import ExcelJS from 'exceljs';
import type { ConfirmacionWorkbookRow } from './confirmacionesExcel';

const HEADERS = [
  '#',
  'Infoplaza',
  'Provincia',
  'Distrito',
  'Corregimiento',
  'Cedula',
  'Nombre del dinamizador',
  'Asistencia',
  'Hospedaje',
  'Cena',
  'Enlace',
  'Confirmados',
  'Pendientes de confirmacion',
];

const COLUMN_WIDTHS = [
  { width: 7 }, { width: 32 }, { width: 20 }, { width: 20 },
  { width: 24 }, { width: 18 }, { width: 32 }, { width: 15 }, { width: 15 },
  { width: 12 }, { width: 26 }, { width: 15 }, { width: 30 },
];

/** Estiliza la fila de encabezados: fondo azul, texto blanco y bordes. */
const styleHeaderRow = (header: ExcelJS.Row): void => {
  header.height = 28;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF1E3A8A' } },
      right: { style: 'thin', color: { argb: 'FF1E3A8A' } },
    };
  });
};

/** Agrega las filas de datos al worksheet, centrando la columna de número. */
const addDataRows = (worksheet: ExcelJS.Worksheet, rows: ConfirmacionWorkbookRow[]): void => {
  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow([
      index + 1,
      row.infoplaza,
      row.provincia,
      row.distrito,
      row.corregimiento,
      row.cedula,
      row.dinamizador,
      row.asistencia,
      row.hospedaje,
      row.cena,
      row.enlace,
      row.confirmados,
      row.pendientes,
    ]);
    excelRow.eachCell((cell, columnNumber) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: columnNumber === 1 ? 'center' : 'left',
      };
    });
  });
};

/** Construye el libro de Excel con la hoja "Confirmaciones" estilizada. */
export const createWorkbook = (encuentroNombre: string, rows: ConfirmacionWorkbookRow[]): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Metas Infoplazas';
  workbook.created = new Date();
  workbook.subject = `Confirmaciones: ${encuentroNombre}`;

  const worksheet = workbook.addWorksheet('Confirmaciones', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  worksheet.columns = COLUMN_WIDTHS;

  const header = worksheet.addRow(HEADERS);
  styleHeaderRow(header);

  addDataRows(worksheet, rows);

  worksheet.autoFilter = `A1:M${worksheet.rowCount}`;
  return workbook;
};
