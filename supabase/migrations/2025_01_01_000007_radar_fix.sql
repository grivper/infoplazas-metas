-- Función simple para obtener snapshots
CREATE OR REPLACE FUNCTION get_radar_snapshots()
RETURNS SETOF radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM radar_mensual_snapshots;
END;
$$;

CREATE OR REPLACE FUNCTION get_ultimo_radar_snapshot()
RETURNS radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM radar_mensual_snapshots ORDER BY mes DESC LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_radar_snapshot_anterior(p_mes TEXT)
RETURNS radar_mensual_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM radar_mensual_snapshots 
    WHERE mes < p_mes::date ORDER BY mes DESC LIMIT 1;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_radar_snapshots TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ultimo_radar_snapshot TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_radar_snapshot_anterior TO anon, authenticated;
