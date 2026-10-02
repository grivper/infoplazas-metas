#!/usr/bin/env node
/**
 * Importa distrito y corregimiento del libro GEBILO al catálogo de infoplazas.
 *
 * Uso:
 *   node scripts/import-territorio-infoplazas.mjs --dry-run
 *   node scripts/import-territorio-infoplazas.mjs
 *
 * La hoja SUCURSAL se vincula con catalogo_infoplazas por SUCURSAL_NUN y el
 * prefijo numérico de codigo (por ejemplo, "34" -> "34-La Pintada").
 */
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEBILO_PATH = resolve(__dirname, '../encuentros/GEBILO_V1.xlsx');
const DRY_RUN = process.argv.includes('--dry-run');
const supportedArguments = new Set(['--dry-run']);

if (process.argv.slice(2).some((argument) => !supportedArguments.has(argument))) {
  throw new Error('Uso: node scripts/import-territorio-infoplazas.mjs [--dry-run]');
}

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function textoDeCelda(cell) {
  const value = cell.value;
  if (value == null) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if ('result' in value) return String(value.result ?? '');
    if ('text' in value) return value.text;
  }
  return String(value);
}

function limpiar(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

/** Conserva ceros iniciales y acepta únicamente códigos enteros inequívocos. */
function normalizarNumero(value) {
  const number = limpiar(value);
  if (!/^\d+$/.test(number)) return null;
  return number;
}

function territorio(value) {
  const cleaned = limpiar(value);
  return cleaned || null;
}

function compararTerritorio(a, b) {
  return a.distrito === b.distrito && a.corregimiento === b.corregimiento;
}

function reportarLista(title, values) {
  if (values.length === 0) return;
  console.error(`\n${title} (${values.length}):`);
  for (const value of values) console.error(`  - ${value}`);
}

async function leerSucursales() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(GEBILO_PATH);

  const worksheet = workbook.getWorksheet('SUCURSAL');
  if (!worksheet) throw new Error('No se encontró la hoja "SUCURSAL" en GEBILO_V1.xlsx');

  const headers = new Map();
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, column) => {
    headers.set(limpiar(textoDeCelda(cell)), column);
  });

  const requiredHeaders = ['SUCURSAL_NUN', 'DIST', 'CORRE'];
  const missingHeaders = requiredHeaders.filter((header) => !headers.has(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Faltan columnas requeridas en SUCURSAL: ${missingHeaders.join(', ')}`);
  }

  const sucursales = new Map();
  const conflicts = [];
  const invalidCodes = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const sourceCode = normalizarNumero(textoDeCelda(row.getCell(headers.get('SUCURSAL_NUN'))));
    const data = {
      distrito: territorio(textoDeCelda(row.getCell(headers.get('DIST')))),
      corregimiento: territorio(textoDeCelda(row.getCell(headers.get('CORRE')))),
    };

    if (!sourceCode || sourceCode === '0') {
      if (data.distrito || data.corregimiento) {
        invalidCodes.push(`fila ${rowNumber}: código ${sourceCode === '0' ? '0 no válido' : 'inválido o vacío'}`);
      }
      return;
    }

    const previous = sucursales.get(sourceCode);
    if (previous && !compararTerritorio(previous.data, data)) {
      conflicts.push({
        code: sourceCode,
        message: `código ${sourceCode}: filas ${previous.rowNumber} y ${rowNumber} tienen territorios distintos`,
      });
      return;
    }

    sucursales.set(sourceCode, { data, rowNumber });
  });

  return { sucursales, conflicts, invalidCodes };
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN: no se escribe nada en Supabase ===' : '=== Importando territorio de infoplazas ===');

  const { sucursales, conflicts, invalidCodes } = await leerSucursales();
  const { data: catalogo, error } = await supabase
    .from('catalogo_infoplazas')
    .select('codigo, distrito, corregimiento');
  if (error) throw error;

  const catalogoPorNumero = new Map();
  const catalogConflicts = [];
  for (const infoplaza of catalogo) {
    const codigo = limpiar(infoplaza.codigo);
    const number = normalizarNumero(codigo.split('-')[0]);
    if (!codigo || !number) {
      catalogConflicts.push(`código de catálogo inválido: ${codigo || '(vacío)'}`);
      continue;
    }

    const existing = catalogoPorNumero.get(number);
    if (existing && existing.codigo !== codigo) {
      catalogConflicts.push(`número ${number}: ${existing.codigo} y ${codigo}`);
      continue;
    }
    catalogoPorNumero.set(number, { ...infoplaza, codigo });
  }

  const unmatchedCodes = [];
  const updates = [];
  for (const [number, source] of sucursales) {
    const infoplaza = catalogoPorNumero.get(number);
    if (!infoplaza) {
      unmatchedCodes.push(number);
      continue;
    }

    if (!compararTerritorio(infoplaza, source.data)) {
      updates.push({ codigo: infoplaza.codigo, ...source.data });
    }
  }

  const blockingSourceConflicts = conflicts.filter(({ code }) => catalogoPorNumero.has(code));
  const skippedSourceConflicts = conflicts
    .filter(({ code }) => !catalogoPorNumero.has(code))
    .map(({ message }) => message);

  reportarLista('Conflictos en SUCURSAL que bloquean actualizaciones', blockingSourceConflicts.map(({ message }) => message));
  reportarLista('Conflictos en SUCURSAL sin infoplaza en catálogo (omitidos)', skippedSourceConflicts);
  reportarLista('Códigos inválidos en SUCURSAL (omitidos)', invalidCodes);
  reportarLista('Conflictos en catálogo', catalogConflicts);
  reportarLista('Códigos de SUCURSAL sin infoplaza en catálogo (omitidos)', unmatchedCodes.sort());
  console.log(`\nSUCURSALES únicas leídas: ${sucursales.size}`);
  console.log(`Actualizaciones necesarias: ${updates.length}`);

  if (blockingSourceConflicts.length || catalogConflicts.length) {
    throw new Error('No se aplicaron cambios: resuelva los conflictos reportados primero.');
  }

  if (DRY_RUN) {
    console.log('Muestra de actualizaciones:', JSON.stringify(updates.slice(0, 5), null, 2));
    return;
  }

  for (const update of updates) {
    const { codigo, distrito, corregimiento } = update;
    const { error: updateError } = await supabase
      .from('catalogo_infoplazas')
      .update({ distrito, corregimiento })
      .eq('codigo', codigo);
    if (updateError) throw updateError;
  }

  console.log(`✅ Actualizadas: ${updates.length}`);
}

main().catch((error) => {
  console.error(`\n❌ Error en la importación: ${error.message}`);
  process.exit(1);
});
