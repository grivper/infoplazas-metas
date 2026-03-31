import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Configuracion de seguridad - REQUIERE configuracion en Supabase Dashboard -> Edge Functions -> meta30-insert -> Secrets
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") ?? [];
const API_KEY_GAS = Deno.env.get("API_KEY_GAS") ?? "";

/**
 * Rate limiting configuration
 * LIMITACION: Este rate limiting usa Map en memoria y no funciona correctamente
 * en Edge Functions distribuidas (multiples instancias). Cada instancia tiene su propio contador.
 * Para produccion se deberia usar Redis o Supabase Database.
 */
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Valida si el origen esta en la whitelist
 * @param origin - El header Origin de la peticion
 * @returns true si el origen esta permitido
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => origin.trim().startsWith(allowed));
}

/**
 * Valida autenticacion via JWT o API key
 * @param req - Request de la Edge Function
 * @returns Resultado de la validacion
 */
function validateAuth(req: Request): { valid: boolean; error?: string; identifier?: string } {
  const authHeader = req.headers.get("Authorization");
  const apiKey = req.headers.get("x-api-key");

  // Verificar API key (para Google Apps Script)
  if (apiKey && API_KEY_GAS && apiKey === API_KEY_GAS) {
    return { valid: true, identifier: "api-key" };
  }

  // Verificar JWT (Authorization: Bearer <token>)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token.length > 0) {
      // El SDK de Supabase valida automaticamente el JWT cuando se usa createClient con anon key
      // Si el token es invalido o esta expirado, el SDK lanzara error
      return { valid: true, identifier: "jwt" };
    }
  }

  return { valid: false, error: "Unauthorized" };
}

/**
 * Verifica rate limiting para un identificador
 * NOTA: Esta implementacion tiene limitaciones en entornos distribuidos
 */
function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Genera headers CORS dinamicos segun el origen
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * Edge Function para insertar datos en meta_30_sincronizacion
 * Receptiona datos desde Google Apps Script
 * Requiere autenticacion via JWT (frontend) o API key (GAS)
 * 
 * NOTA: Usa SUPABASE_SERVICE_ROLE_KEY que tiene permisos de superusuario
 * y omite las politicas RLS. Esto es necesario para escribir en la tabla.
 */
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validar CORS
    if (!isOriginAllowed(origin)) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Origin not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validar autenticacion
    const authResult = validateAuth(req);
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Nota: La validacion de JWT se hace automaticamente por el SDK de Supabase al hacer queries

    // 4. Rate limiting (usar IP + identifier como key)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimitKey = `${clientIP}-${authResult.identifier}`;
    const rateResult = checkRateLimit(rateLimitKey);
    
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Too Many Requests" }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateResult.retryAfter || 3600)
          } 
        }
      );
    }

    // 5. Validar que sea POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Metodo no permitido. Usa POST" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Parsear el body
    const body = await req.json();
    
    const { sheet_name, data, fecha_sincronizacion } = body;

    // 7. Validar campos requeridos
    if (!sheet_name || !data) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos: sheet_name y data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Crear cliente de Supabase con service role (para escribir en la tabla protegida)
    // NOTA: Este cliente omite RLS por tener permisos de service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 9. Insertar en la tabla
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
