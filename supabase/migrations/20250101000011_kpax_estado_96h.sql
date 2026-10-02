-- Migration: Update KPAX estado threshold from 24h to 96h (4 days)
-- Drop and recreate the GENERATED column with new function

-- 1. Drop existing generated column
ALTER TABLE radar_kpax_unificado DROP COLUMN IF EXISTS estado;

-- 2. Create new function with 96h threshold
CREATE OR REPLACE FUNCTION calcular_estado_kpax(
  inactividad_impresora TEXT,
  inactividad_agente TEXT
) RETURNS TEXT AS $$
DECLARE
  horas_impresora INTEGER := 0;
  horas_agente INTEGER := 0;
  horas INTEGER;
BEGIN
  -- Parse inactivity_impresora
  IF inactividad_impresora IS NOT NULL THEN
    -- Extract months (format: "3mes", "3 mes")
    horas := COALESCE(SUBSTRING(inactividad_impresora FROM '(\d+)\s*mes')::INTEGER, 0) * 24 * 30;
    horas_impresora := horas_impresora + horas;
    
    -- Extract days (format: "9j", "9j,", "9 días", "9d")
    horas := COALESCE(SUBSTRING(LOWER(inactividad_impresora) FROM '(\d+)\s*(?:j|d(?:í|i)?s)')::INTEGER, 0) * 24;
    horas_impresora := horas_impresora + horas;
    
    -- Extract hours (format: "19h")
    horas := COALESCE(SUBSTRING(LOWER(inactividad_impresora) FROM '(\d+)\s*h')::INTEGER, 0);
    horas_impresora := horas_impresora + horas;
  END IF;
  
  -- Parse inactivity_agente
  IF inactividad_agente IS NOT NULL THEN
    -- Extract months
    horas := COALESCE(SUBSTRING(inactividad_agente FROM '(\d+)\s*mes')::INTEGER, 0) * 24 * 30;
    horas_agente := horas_agente + horas;
    
    -- Extract days
    horas := COALESCE(SUBSTRING(LOWER(inactividad_agente) FROM '(\d+)\s*(?:j|d(?:í|i)?s)')::INTEGER, 0) * 24;
    horas_agente := horas_agente + horas;
    
    -- Extract hours
    horas := COALESCE(SUBSTRING(LOWER(inactividad_agente) FROM '(\d+)\s*h')::INTEGER, 0);
    horas_agente := horas_agente + horas;
  END IF;
  
  -- Critico si ALGUNA supera 96 horas (4 días)
  IF horas_impresora >= 96 OR horas_agente >= 96 THEN
    RETURN 'critico';
  ELSE
    RETURN 'online';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Recreate generated column with new function
ALTER TABLE radar_kpax_unificado 
ADD COLUMN estado TEXT 
GENERATED ALWAYS AS (calcular_estado_kpax(inactividad_impresora, inactividad_agente)) STORED;
