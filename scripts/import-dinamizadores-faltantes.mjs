#!/usr/bin/env node
/**
 * Script puntual (no repetible): agrega los 6 dinamizadores que faltaban en
 * `dinamizadores` porque no estaban en la hoja de Confirmaciones (evento
 * regional del año pasado) pero sí tienen un dinamizador activo real en
 * GEBILO, verificado a mano uno por uno. Ver conversación del ticket
 * "Encuentros: base de dinamizadores" para el detalle de cómo se armó esta
 * lista (incluye un bug corregido en el filtro de "activos").
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const normalizarSexo = (s) => {
  const v = (s || '').toLowerCase();
  if (v.startsWith('masc')) return 'Masculino';
  if (v.startsWith('fem')) return 'Femenino';
  return s || null;
};

const FALTANTES = [
  { numero: '455', nombre: 'Alex Antonio Mendieta', sexo: 'MasculIno', cedula: '7-709-1653', celular: '64912046', email: 'alex.mendieta27@gmail.com', talla: 'S-Hombre' },
  { numero: '521', nombre: 'Belkis Espino', sexo: 'FemenIno', cedula: '7-709-969', celular: '69373125', email: 'belkissespino@gmail.com', talla: 'M-Mujer / 16' },
  { numero: '498', nombre: 'Nicole Sánchez', sexo: 'FemenIno', cedula: '8-953-931', celular: '66074208', email: 'marytorres2700@gmail.com', talla: 'S-Mujer / 14' },
  { numero: '453', nombre: 'Yessica Cordoba', sexo: 'FemenIno', cedula: '7-711-183', celular: '65200103', email: 'yessikacordoba6@gmail.com', talla: 'L-Mujer / 18' },
  { numero: '663', nombre: 'Yanitza Herrera', sexo: 'Femenino', cedula: '2-732-734', celular: '65915735', email: 'natainfoplazas@gmail.com', talla: 'L-Mujer / 18' },
  { numero: '667', nombre: 'Oderay Mendoza', sexo: 'Femenino', cedula: '6-83-763', celular: '64032700', email: 'odemisu@hotmail.com', talla: 'L-Mujer / 18' },
];

async function main() {
  const { data: infoplazas, error: errInfoplazas } = await supabase.from('catalogo_infoplazas').select('codigo');
  if (errInfoplazas) throw errInfoplazas;
  const numeroACodigo = new Map(infoplazas.map((i) => [i.codigo.split('-')[0], i.codigo]));

  let creados = 0;
  for (const f of FALTANTES) {
    const codigo = numeroACodigo.get(f.numero);
    if (!codigo) {
      console.error(`⚠ No se encontró código de catálogo para infoplaza ${f.numero}, se omite.`);
      continue;
    }
    const { error } = await supabase.from('dinamizadores').insert({
      infoplaza_codigo: codigo,
      nombre: f.nombre,
      sexo: normalizarSexo(f.sexo),
      cedula: f.cedula,
      celular: f.celular,
      email: f.email,
      talla: f.talla,
      estatus: 'Activo',
    });
    if (error) throw error;
    console.log(`✓ ${f.nombre} (infoplaza ${f.numero})`);
    creados++;
  }
  console.log(`\n✅ Listo. ${creados} dinamizadores agregados.`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
