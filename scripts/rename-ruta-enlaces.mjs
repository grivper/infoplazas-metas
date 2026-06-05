#!/usr/bin/env node
/**
 * Script: rename-ruta-enlaces.js
 * Purpose: Rename 'José Ruiz' to 'Ruta Coclé (Vacante)' in itinerario_enlaces table
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Updating José Ruiz -> Ruta Coclé (Vacante) in itinerario_enlaces...');

  const { data, error } = await supabase
    .from('itinerario_enlaces')
    .update({ enlace_nombre: 'Ruta Coclé (Vacante)' })
    .eq('enlace_nombre', 'José Ruiz')
    .select();

  if (error) {
    console.error('Error updating records:', error);
    process.exit(1);
  }

  console.log(`Successfully updated ${data?.length || 0} record(s):`);
  console.log(JSON.stringify(data, null, 2));
}

main();