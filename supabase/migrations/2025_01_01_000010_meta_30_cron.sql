-- Cron job para guardar snapshot diario de Meta 30%.
-- Corre todos los días a las 00:05 para capturar datos apenas lleguen.
-- Si el mes actual no tiene datos aún, usa el último mes disponible.

-- Habilitar extensión pg_cron (debe existir en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar snapshot diario
SELECT cron.schedule(
  'meta_30_snapshot_diario',
  '5 0 * * *',  -- 00:05 todos los días
  $$SELECT save_meta_30_snapshot();$$
);
