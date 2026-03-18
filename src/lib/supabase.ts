import { createClient } from '@supabase/supabase-js';

// Obtenemos las variables de entorno de Vite
// Estas variables deben estar en el archivo .env en la raíz del proyecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificamos que las variables existan para evitar errores sutiles
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY).');
}

/**
 * Cliente oficial de Supabase configurado con sessionStorage.
 * Esto asegura que la sesión se destruya completamente al cerrar el navegador.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
