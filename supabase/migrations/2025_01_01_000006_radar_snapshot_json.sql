-- Funciones RPC simples para leer snapshots

-- Obtener todos los snapshots
CREATE OR REPLACE FUNCTION get_radar_snapshots()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT json_agg(radar_mensual_snapshots.*) FROM radar_mensual_snapshots ORDER BY mes DESC);
END;
$$;

-- Obtener último snapshot
CREATE OR REPLACE FUNCTION get_ultimo_radar_snapshot()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT row_to_json(t) FROM (SELECT * FROM radar_mensual_snapshots ORDER BY mes DESC LIMIT 1) t);
END;
$$;

-- Obtener snapshot anterior
CREATE OR REPLACE FUNCTION get_radar_snapshot_anterior(p_mes TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT row_to_json(t) FROM (
    SELECT * FROM radar_mensual_snapshots WHERE mes < p_mes::date ORDER BY mes DESC LIMIT 1
  ) t);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_radar_snapshots TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ultimo_radar_snapshot TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_radar_snapshot_anterior TO anon, authenticated;
