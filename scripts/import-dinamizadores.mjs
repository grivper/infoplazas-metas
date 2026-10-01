#!/usr/bin/env node
/**
 * Script: import-dinamizadores.mjs
 * Propósito: Carga inicial (una sola vez) de la tabla `dinamizadores` en Supabase,
 * cruzando:
 *  - encuentros/Listado de Confirmaciones.xlsx (hoja "General y Cenas verdes")
 *    -> infoplaza, nombre, sexo, cédula, email, talla
 *  - encuentros/GEBILO_V1.xlsx (hoja "EMPLEADO")
 *    -> celular y estatus por cédula
 *  - catalogo_infoplazas (Supabase) -> para resolver el código real (slug) de
 *    cada infoplaza a partir de su número.
 *
 * También asegura el catálogo `enlaces` con los enlaces actuales.
 *
 * Uso:
 *   node scripts/import-dinamizadores.mjs           (aplica los cambios)
 *   node scripts/import-dinamizadores.mjs --dry-run  (solo muestra qué haría)
 */
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const CONFIRMACIONES_PATH = resolve(__dirname, '../encuentros/Listado de Confirmaciones.xlsx');
const GEBILO_PATH = resolve(__dirname, '../encuentros/GEBILO_V1.xlsx');

const ENLACES_ACTUALES = ['Guillermo Rivera', 'Rogelio Cruz'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

// Service role: necesario porque este script corre fuera de una sesión de
// usuario logueado, y las tablas tienen RLS restringido a "authenticated".
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Extrae texto plano de un valor de celda de ExcelJS, que puede venir como
 * string, número, hipervínculo ({ text, hyperlink }) o texto enriquecido
 * ({ richText: [...] }).
 */
function textoDeCelda(valor) {
  if (valor == null) return '';
  if (typeof valor === 'object') {
    if (Array.isArray(valor.richText)) return valor.richText.map((p) => p.text).join('');
    if ('text' in valor) return valor.text;
    if ('result' in valor) return valor.result;
    return '';
  }
  return valor.toString();
}

/** Limpia espacios dobles, tabs y espacios al inicio/fin. */
const limpiar = (valor) => textoDeCelda(valor).replace(/\s+/g, ' ').trim();

/** Normaliza variantes con errores de tipeo (ej. "ActIvo") al valor canónico. */
function normalizarEstatus(valor) {
  const v = limpiar(valor).toLowerCase();
  return v.startsWith('inactiv') ? 'Inactivo' : 'Activo';
}

/** Lee una hoja de un workbook de ExcelJS como array de arrays (valores crudos). */
function hojaAFilas(workbook, nombreHoja) {
  const hoja = workbook.getWorksheet(nombreHoja);
  if (!hoja) throw new Error(`No se encontró la hoja "${nombreHoja}"`);
  const filas = [];
  hoja.eachRow({ includeEmpty: false }, (row) => {
    filas.push(row.values.slice(1)); // row.values[0] es undefined en ExcelJS
  });
  return filas;
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN: no se escribe nada en Supabase ===\n' : '=== Importando dinamizadores ===\n');

  // ---------------------------------------------------------------------
  // 1. Catálogo de infoplazas (para resolver número -> código/slug real)
  // ---------------------------------------------------------------------
  const { data: infoplazas, error: errInfoplazas } = await supabase
    .from('catalogo_infoplazas')
    .select('codigo');
  if (errInfoplazas) throw errInfoplazas;

  const numeroACodigo = new Map();
  for (const { codigo } of infoplazas) {
    const numero = codigo.split('-')[0];
    numeroACodigo.set(numero, codigo);
  }
  console.log(`Infoplazas en catálogo: ${numeroACodigo.size}`);

  // ---------------------------------------------------------------------
  // 2. GEBILO -> mapa cédula -> { celular, estatus }
  // ---------------------------------------------------------------------
  const gebiloWb = new ExcelJS.Workbook();
  await gebiloWb.xlsx.readFile(GEBILO_PATH);
  const empleadoFilas = hojaAFilas(gebiloWb, 'EMPLEADO');
  const [empleadoHeader, ...empleadoDatos] = empleadoFilas;
  const idx = (col) => empleadoHeader.indexOf(col);

  const gebiloPorCedula = new Map();
  for (const fila of empleadoDatos) {
    const cedula = limpiar(fila[idx('CED')]);
    if (!cedula) continue;
    gebiloPorCedula.set(cedula, {
      celular: limpiar(fila[idx('CEL')]),
      estatus: limpiar(fila[idx('ESTATUS')]) || 'Activo',
    });
  }
  console.log(`Dinamizadores en GEBILO (EMPLEADO): ${gebiloPorCedula.size}`);

  // ---------------------------------------------------------------------
  // 3. Listado de Confirmaciones -> dato base del dinamizador por infoplaza
  // ---------------------------------------------------------------------
  const confirmWb = new ExcelJS.Workbook();
  await confirmWb.xlsx.readFile(CONFIRMACIONES_PATH);
  const generalFilas = hojaAFilas(confirmWb, 'General y Cenas verdes');
  const [generalHeader, ...generalDatos] = generalFilas;
  const gIdx = (col) => generalHeader.indexOf(col);

  const candidatos = [];
  const sinInfoplaza = [];

  for (const fila of generalDatos) {
    const infoplazaNum = limpiar(fila[gIdx('infoplaza')]);
    const nombre = limpiar(fila[gIdx('Dinamizador (Nombre)')]);
    const cedula = limpiar(fila[gIdx('Cédula Dinamizador')]);

    // Filas de total/footer u otras sin datos reales: se ignoran en silencio.
    if (!infoplazaNum && !nombre && !cedula) continue;

    if (!infoplazaNum || !nombre || !cedula) {
      sinInfoplaza.push({ infoplazaNum, nombre, cedula });
      continue;
    }

    const codigo = numeroACodigo.get(infoplazaNum);
    if (!codigo) {
      sinInfoplaza.push({ infoplazaNum, nombre, cedula, motivo: 'infoplaza no existe en catalogo_infoplazas' });
      continue;
    }

    // El celular sale de GEBILO (no está en la hoja de Confirmaciones).
    // El estatus sale de la hoja de Confirmaciones (la más actual), no de
    // GEBILO, que puede tener datos de RRHH desactualizados.
    const datoGebilo = gebiloPorCedula.get(cedula);

    candidatos.push({
      infoplaza_codigo: codigo,
      nombre,
      sexo: limpiar(fila[gIdx('Sexo')]) || null,
      cedula,
      celular: datoGebilo?.celular || null,
      email: limpiar(fila[gIdx('Email Dinamizador')]) || null,
      talla: limpiar(fila[gIdx('Talla Dinamizador')]) || null,
      estatus: normalizarEstatus(fila[gIdx('Estatus Dinamizador')]),
    });
  }

  console.log(`Filas válidas para importar: ${candidatos.length}`);
  if (sinInfoplaza.length > 0) {
    console.log(`\n⚠ Filas descartadas (${sinInfoplaza.length}) por datos incompletos o infoplaza no encontrada:`);
    for (const r of sinInfoplaza) console.log('  -', r);
  }

  // ---------------------------------------------------------------------
  // 4. Enlaces (catálogo) — altas de los enlaces actuales
  // ---------------------------------------------------------------------
  console.log('\n--- Enlaces ---');
  if (DRY_RUN) {
    console.log('Se asegurarían:', ENLACES_ACTUALES);
  } else {
    const { error: errEnlaces } = await supabase
      .from('enlaces')
      .upsert(
        ENLACES_ACTUALES.map((nombre) => ({ nombre })),
        { onConflict: 'nombre', ignoreDuplicates: true }
      );
    if (errEnlaces) throw errEnlaces;
    console.log('OK:', ENLACES_ACTUALES.join(', '));
  }

  // ---------------------------------------------------------------------
  // 5. Dinamizadores — insertar o actualizar por cédula
  // ---------------------------------------------------------------------
  console.log('\n--- Dinamizadores ---');
  if (DRY_RUN) {
    console.log(`Se insertarían/actualizarían ${candidatos.length} dinamizadores.`);
    console.log('Ejemplo (primeros 3):', JSON.stringify(candidatos.slice(0, 3), null, 2));
    return;
  }

  let creados = 0;
  let actualizados = 0;

  for (const dinamizador of candidatos) {
    const { data: existente, error: errBusqueda } = await supabase
      .from('dinamizadores')
      .select('id')
      .eq('cedula', dinamizador.cedula)
      .maybeSingle();
    if (errBusqueda) throw errBusqueda;

    if (existente) {
      const { error: errUpdate } = await supabase
        .from('dinamizadores')
        .update(dinamizador)
        .eq('id', existente.id);
      if (errUpdate) throw errUpdate;
      actualizados++;
    } else {
      const { error: errInsert } = await supabase.from('dinamizadores').insert(dinamizador);
      if (errInsert) throw errInsert;
      creados++;
    }
  }

  console.log(`\n✅ Listo. Creados: ${creados} · Actualizados: ${actualizados} · Descartados: ${sinInfoplaza.length}`);
}

main().catch((err) => {
  console.error('\n❌ Error en la importación:', err);
  process.exit(1);
});
