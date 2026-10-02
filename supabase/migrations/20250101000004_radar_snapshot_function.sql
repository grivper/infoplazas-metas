-- Función para guardar snapshot mensual (bypass RLS)
CREATE OR REPLACE FUNCTION guardar_radar_snapshot(
  p_mes DATE,
  p_total INT,
  p_online INT,
  p_critico INT,
  p_tasa DECIMAL,
  p_nuevas_fallas INT,
  p_fallas_resueltas INT
)
RETURNS radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result radar_mensual_snapshots;
BEGIN
  INSERT INTO radar_mensual_snapshots (mes, total_dispositivos, online, critico, tasa_disponibilidad, nuevas_fallas, fallas_resueltas)
  VALUES (p_mes, p_total, p_online, p_critico, p_tasa, p_nuevas_fallas, p_fallas_resueltas)
  ON CONFLICT (mes) DO UPDATE SET
    total_dispositivos = EXCLUDED.total_dispositivos,
    online = EXCLUDED.online,
    critico = EXCLUDED.critico,
    tasa_disponibilidad = EXCLUDED.tasa_disponibilidad,
    nuevas_fallas = EXCLUDED.nuevas_fallas,
    fallas_resueltas = EXCLUDED.fallas_resueltas,
    created_at = NOW();
  
  SELECT * INTO result FROM radar_mensual_snapshots WHERE mes = p_mes;
  RETURN result;
END;
$$;

-- Permisos para usar la función
GRANT EXECUTE ON FUNCTION guardar_radar_snapshot TO anon;
GRANT EXECUTE ON FUNCTION guardar_radar_snapshot TO authenticated;
