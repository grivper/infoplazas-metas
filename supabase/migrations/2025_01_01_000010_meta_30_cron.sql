-- Cron job para guardar snapshot mensual de Meta 30%
-- Se ejecuta el día 1 de cada mes a las 00:05

-- Habilitar extensión pg_cron (debe existir en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar snapshot mensual
SELECT cron.schedule(
  'meta_30_snapshot_mensual',
  '5 0 1 * *',  -- 00:05 del día 1 de cada mes
  $$SELECT save_meta_30_snapshot();$$
);
