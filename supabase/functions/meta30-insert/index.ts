import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function para insertar datos en meta_30_sincronizacion
 * Receptiona datos desde Google Apps Script
 */
Deno.serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar que sea POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método no permitido. Usa POST" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parsear el body
    const body = await req.json();
    
    const { sheet_name, data, fecha_sincronizacion } = body;

    // Validar campos requeridos
    if (!sheet_name || !data) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos: sheet_name y data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Crear cliente de Supabase con service role (para escribir en la tabla protegida)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insertar en la tabla
    const { data: inserted, error } = await supabase
      .from("meta_30_sincronizacion")
      .insert({
        sheet_name,
        data,
        fecha_sincronizacion: fecha_sincronizacion || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error insertando:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Datos insertados correctamente:", inserted.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Datos sincronizados correctamente",
        id: inserted.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
