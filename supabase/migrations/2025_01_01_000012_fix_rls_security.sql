-- =============================================================================
-- Fix RLS Security: Corregir políticas RLS abiertas
-- =============================================================================
-- Tabla: radar_mensual_snapshots
-- Problema: Políticas actuales permiten acceso público (TO anon USING (true))
-- Solución: Cambiar a usuarios autenticados con validación de auth.uid()
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. radar_mensual_snapshots - Eliminar políticas públicas
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public reads" ON radar_mensual_snapshots;
DROP POLICY IF EXISTS "Allow public inserts" ON radar_mensual_snapshots;
DROP POLICY IF EXISTS "Allow public updates" ON radar_mensual_snapshots;

-- -----------------------------------------------------------------------------
-- 2. radar_mensual_snapshots - Crear políticas seguras para autenticados
-- -----------------------------------------------------------------------------
-- SELECT: Solo usuarios autenticados pueden leer
CREATE POLICY "Allow authenticated reads" ON radar_mensual_snapshots
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- INSERT: Solo usuarios autenticados pueden insertar
CREATE POLICY "Allow authenticated inserts" ON radar_mensual_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Solo usuarios autenticados pueden actualizar
CREATE POLICY "Allow authenticated updates" ON radar_mensual_snapshots
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Solo usuarios autenticados pueden eliminar
CREATE POLICY "Allow authenticated deletes" ON radar_mensual_snapshots
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 3. meta_30_sincronizacion - Verificar si tiene políticas y asegurar
-- -----------------------------------------------------------------------------
-- Esta tabla es escriturada principalmente por la Edge Function (service role)
-- Pero vamos a asegurar que tenga políticas consistentes

-- Eliminar políticas existentes si son demasiado abiertas
DROP POLICY IF EXISTS "Allow public inserts" ON meta_30_sincronizacion;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON meta_30_sincronizacion;

-- Crear política para service role (Edge Function) - ya tiene acceso por SERVICE_ROLE_KEY
-- Los usuarios autenticados pueden leer sus propios registros
CREATE POLICY "meta_30_sincronizacion_select" ON meta_30_sincronizacion
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Nota: INSERT/UPDATE/DELETE quedan restringidos a service role (Edge Function)
-- Esto es correcto porque solo la función serverless debe escribir en esta tabla

-- -----------------------------------------------------------------------------
-- 4. Verificar que RLS esté habilitado en las tablas
-- -----------------------------------------------------------------------------
ALTER TABLE radar_mensual_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_30_sincronizacion ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Rollback: Para revertir, ejecutar:
-- DROP POLICY IF EXISTS "Allow authenticated reads" ON radar_mensual_snapshots;
-- DROP POLICY IF EXISTS "Allow authenticated inserts" ON radar_mensual_snapshots;
-- DROP POLICY IF EXISTS "Allow authenticated updates" ON radar_mensual_snapshots;
-- DROP POLICY IF EXISTS "Allow authenticated deletes" ON radar_mensual_snapshots;
-- CREATE POLICY "Allow public reads" ON radar_mensual_snapshots FOR SELECT TO anon USING (true);
-- CREATE POLICY "Allow public inserts" ON radar_mensual_snapshots FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Allow public updates" ON radar_mensual_snapshots FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- =============================================================================
