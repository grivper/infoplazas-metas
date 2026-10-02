#!/usr/bin/env node
/**
 * Genera el libro de confirmaciones del Encuentro Regional de Dinamizadores.
 *
 * Uso:
 *   node scripts/generate-confirmaciones-workbook.mjs
 *   node scripts/generate-confirmaciones-workbook.mjs --output ruta/reporte.xlsx
 *
 * Lee datos mediante la service role; no modifica datos en Supabase.
 */
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT = 'reportes/confirmaciones-encuentro-regional.xlsx';
const ENCUENTRO_CLAVE = 'encuentro-regional-dinamizadores-2026';
const HEADERS = [
  '#',
  'Infoplaza',
  'Provincia',
  'Distrito',
  'Corregimiento',
  'Cedula',
  'Asistencia',
  'Hospedaje',
  'Cena',
  'Enlace',
  'Confirmados',
  'Pendientes de confirmacion',
];

function parseArguments(argumentsList) {
  let output = DEFAULT_OUTPUT;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument !== '--output') {
      throw new Error('Uso: node scripts/generate-confirmaciones-workbook.mjs [--output <ruta.xlsx>]');
    }

    const outputPath = argumentsList[index + 1];
    if (!outputPath || outputPath.startsWith('--')) {
      throw new Error('Falta la ruta después de --output.');
    }

    output = outputPath;
    index += 1;
  }

  return resolve(process.cwd(), output);
}

function requireConfiguration() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  }

  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('VITE_SUPABASE_URL en .env no contiene una URL válida.');
  }

  return { supabaseUrl, serviceRoleKey };
}

function formatResponse(value) {
  if (value === null || value === undefined) return 'Pendiente';
  return value ? 'Sí' : 'No';
}

function formatBoolean(value) {
  return value ? 'Sí' : 'No';
}

function text(value) {
  return String(value ?? '').trim();
}

function getRelatedRow(value) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function createEnlacesByInfoplazaId(itinerarioEnlaces) {
  const namesByInfoplazaId = new Map();

  for (const itinerary of itinerarioEnlaces ?? []) {
    const infoplazaId = text(itinerary.infoplaza_id);
    const enlaceName = text(itinerary.enlace_nombre);
    if (!infoplazaId || !enlaceName) continue;

    const names = namesByInfoplazaId.get(infoplazaId) ?? new Set();
    names.add(enlaceName);
    namesByInfoplazaId.set(infoplazaId, names);
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  return new Map([...namesByInfoplazaId].map(([infoplazaId, names]) => [
    infoplazaId,
    [...names].sort(collator.compare).join(', '),
  ]));
}

async function loadRows(supabase) {
  const { data: encuentro, error: encuentroError } = await supabase
    .from('encuentros')
    .select('id, nombre')
    .eq('clave', ENCUENTRO_CLAVE)
    .maybeSingle();

  if (encuentroError) {
    throw new Error(`No se pudo leer el encuentro regional: ${encuentroError.message}`);
  }
  if (!encuentro) {
    throw new Error(
      `No existe el encuentro con clave "${ENCUENTRO_CLAVE}". Aplique la migración del Encuentro Regional antes de generar el reporte.`,
    );
  }

  const { data: confirmaciones, error: confirmacionesError } = await supabase
    .from('confirmaciones')
    .select(`
      asiste,
      se_hospeda,
      cena,
      confirmado_at,
      dinamizadores!inner (
        nombre,
        cedula,
        estatus,
        catalogo_infoplazas!inner (
          id,
          nombre,
          region,
          distrito,
          corregimiento,
          cerrada
        )
      )
    `)
    .eq('encuentro_id', encuentro.id)
    .eq('dinamizadores.estatus', 'Activo');

  if (confirmacionesError) {
    throw new Error(`No se pudieron leer las confirmaciones: ${confirmacionesError.message}`);
  }

  const { data: itinerarioEnlaces, error: itinerarioEnlacesError } = await supabase
    .from('itinerario_enlaces')
    .select('infoplaza_id, enlace_nombre');

  if (itinerarioEnlacesError) {
    throw new Error(`No se pudo leer el itinerario de enlaces: ${itinerarioEnlacesError.message}`);
  }

  const enlacesByInfoplazaId = createEnlacesByInfoplazaId(itinerarioEnlaces);
  const validRows = (confirmaciones ?? []).flatMap((confirmacion) => {
    const dinamizador = getRelatedRow(confirmacion.dinamizadores);
    const infoplaza = getRelatedRow(dinamizador?.catalogo_infoplazas);
    if (!dinamizador || !infoplaza || infoplaza.cerrada) return [];

    const enlace = enlacesByInfoplazaId.get(text(infoplaza.id)) ?? '';
    const confirmed = confirmacion.confirmado_at !== null && confirmacion.confirmado_at !== undefined;

    return [{
      infoplaza: text(infoplaza.nombre),
      provincia: text(infoplaza.region),
      distrito: text(infoplaza.distrito),
      corregimiento: text(infoplaza.corregimiento),
      cedula: text(dinamizador.cedula),
      asistencia: formatResponse(confirmacion.asiste),
      hospedaje: formatResponse(confirmacion.se_hospeda),
      cena: formatResponse(confirmacion.cena),
      enlace,
      confirmados: formatBoolean(confirmed),
      pendientes: formatBoolean(!confirmed),
      dinamizador: text(dinamizador.nombre),
    }];
  });

  if (validRows.length === 0) {
    throw new Error(
      'No hay confirmaciones válidas para el encuentro regional. Verifique que existan dinamizadores activos en infoplazas no cerradas.',
    );
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  validRows.sort((left, right) => (
    collator.compare(left.provincia, right.provincia)
    || collator.compare(left.infoplaza, right.infoplaza)
    || collator.compare(left.dinamizador, right.dinamizador)
    || collator.compare(left.cedula, right.cedula)
  ));

  return { encuentro, rows: validRows };
}

function createWorkbook(encuentro, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Metas Infoplazas';
  workbook.created = new Date();
  workbook.subject = `Confirmaciones: ${encuentro.nombre}`;

  const worksheet = workbook.addWorksheet('Confirmaciones', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  worksheet.columns = [
    { width: 7 }, { width: 32 }, { width: 20 }, { width: 20 },
    { width: 24 }, { width: 18 }, { width: 15 }, { width: 15 },
    { width: 12 }, { width: 26 }, { width: 15 }, { width: 30 },
  ];

  const header = worksheet.addRow(HEADERS);
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

  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow([
      index + 1,
      row.infoplaza,
      row.provincia,
      row.distrito,
      row.corregimiento,
      row.cedula,
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

  worksheet.autoFilter = `A1:L${worksheet.rowCount}`;
  return workbook;
}

async function main() {
  const outputPath = parseArguments(process.argv.slice(2));
  dotenv.config({ path: resolve(__dirname, '../.env') });

  const { supabaseUrl, serviceRoleKey } = requireConfiguration();
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { encuentro, rows } = await loadRows(supabase);
  const workbook = createWorkbook(encuentro, rows);

  await mkdir(dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Reporte generado con ${rows.length} confirmaciones: ${outputPath}`);
}

main().catch((error) => {
  console.error(`\n❌ No se pudo generar el reporte: ${error.message}`);
  process.exitCode = 1;
});
