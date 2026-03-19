-- Funciones RPC para leer snapshots (bypass RLS)

-- Obtener todos los snapshots
CREATE OR REPLACE FUNCTION get_radar_snapshots()
RETURNS SETOF radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM radar_mensual_snapshots ORDER BY mes DESC;
END;
$$;

-- Obtener último snapshot
CREATE OR REPLACE FUNCTION get_ultimo_radar_snapshot()
RETURNS radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT * FROM radar_mensual_snapshots ORDER BY mes DESC LIMIT 1);
END;
$$;

-- Obtener snapshot anterior a un mes dado
CREATE OR REPLACE FUNCTION get_radar_snapshot_anterior(p_mes DATE)
RETURNS radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT * FROM radar_mensual_snapshots WHERE mes < p_mes ORDER BY mes DESC LIMIT 1);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_radar_snapshots TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ultimo_radar_snapshot TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_radar_snapshot_anterior TO anon, authenticated;
