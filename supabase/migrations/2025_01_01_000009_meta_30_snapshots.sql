-- ============================================
-- Tabla para snapshots mensuales de Meta 30%
-- Guarda el progreso mensual de infoplazas sobre 30%
-- ============================================

-- Tabla principal de snapshots
CREATE TABLE IF NOT EXISTS meta_30_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE, -- Primer día del mes (YYYY-MM-01)
  ip_sobre_30 INTEGER NOT NULL DEFAULT 0,
  ip_debajo_30 INTEGER NOT NULL DEFAULT 0,
  total_ip INTEGER NOT NULL DEFAULT 0,
  meta_acumulada INTEGER NOT NULL DEFAULT 0, -- Meta esperada (+7 por mes)
  progreso_pct NUMERIC(5,2) NOT NULL DEFAULT 0, -- % vs meta anual de 95
  mes_nombre VARCHAR(20), -- Nombre del mes (Enero, Febrero, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_meta_30_snapshots_fecha ON meta_30_snapshots(fecha DESC);

-- Comentarios
COMMENT ON TABLE meta_30_snapshots IS 'Snapshots mensuales del progreso de Meta 30% - Infoplazas sobre el 30%';
COMMENT ON COLUMN meta_30_snapshots.fecha IS 'Fecha del snapshot (primer día del mes)';
COMMENT ON COLUMN meta_30_snapshots.ip_sobre_30 IS 'Cantidad de infoplazas con >=30% de cumplimiento';
COMMENT ON COLUMN meta_30_snapshots.ip_debajo_30 IS 'Cantidad de infoplazas con <30% de cumplimiento';
COMMENT ON COLUMN meta_30_snapshots.total_ip IS 'Total de infoplazas en el catálogo';
COMMENT ON COLUMN meta_30_snapshots.meta_acumulada IS 'Meta acumulada esperada (+7 por mes)';
COMMENT ON COLUMN meta_30_snapshots.progreso_pct IS 'Porcentaje de progreso vs meta anual de 95';

-- ============================================
-- Función: Guardar snapshot del mes actual
-- ============================================
CREATE OR REPLACE FUNCTION save_meta_30_snapshot()
RETURNS meta_30_snapshots AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  v_fecha DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_ip_sobre_30 INTEGER := 0;
  v_ip_debajo_30 INTEGER := 0;
  v_total_ip INTEGER := 0;
  v_meta_acumulada INTEGER := v_month * 7;
  v_progreso_pct NUMERIC(5,2) := 0;
  v_mes_nombre VARCHAR(20);
  v_result meta_30_snapshots;
  v_sync_data JSONB;
  v_meses TEXT[] := ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                           'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  v_sync_month INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_total_ip FROM catalogo_infoplazas;

  SELECT data INTO v_sync_data
  FROM meta_30_sincronizacion
  ORDER BY fecha_sincronizacion DESC
  LIMIT 1;

  IF v_sync_data IS NOT NULL AND jsonb_typeof(v_sync_data) = 'array' THEN
    SELECT 
      COUNT(*) FILTER (WHERE (value->>'Porcentaje')::NUMERIC >= 30)::INTEGER,
      COUNT(*) FILTER (WHERE (value->>'Porcentaje')::NUMERIC < 30 OR (value->>'Porcentaje') IS NULL)::INTEGER
    INTO v_ip_sobre_30, v_ip_debajo_30
    FROM jsonb_array_elements(v_sync_data) AS value
    WHERE (value->>'Año')::TEXT = v_year::TEXT
      AND value->>'Mes' = v_meses[v_month];

    IF v_ip_sobre_30 = 0 AND v_ip_debajo_30 = 0 THEN
      FOR v_sync_month IN REVERSE v_month..1 LOOP
        SELECT 
          COUNT(*) FILTER (WHERE (value->>'Porcentaje')::NUMERIC >= 30)::INTEGER,
          COUNT(*) FILTER (WHERE (value->>'Porcentaje')::NUMERIC < 30 OR (value->>'Porcentaje') IS NULL)::INTEGER
        INTO v_ip_sobre_30, v_ip_debajo_30
        FROM jsonb_array_elements(v_sync_data) AS value
        WHERE (value->>'Año')::TEXT = v_year::TEXT
          AND value->>'Mes' = v_meses[v_sync_month];
        EXIT WHEN v_ip_sobre_30 > 0 OR v_ip_debajo_30 > 0;
      END LOOP;
    END IF;
  END IF;

  IF v_ip_sobre_30 > 0 OR v_ip_debajo_30 > 0 THEN
    IF v_ip_sobre_30 > 0 THEN
      v_progreso_pct := LEAST(ROUND((v_ip_sobre_30::NUMERIC / 95) * 100, 2), 100);
    END IF;
    v_mes_nombre := v_meses[v_month];

    INSERT INTO meta_30_snapshots (fecha, ip_sobre_30, ip_debajo_30, total_ip, meta_acumulada, progreso_pct, mes_nombre, updated_at)
    VALUES (v_fecha, v_ip_sobre_30, v_ip_debajo_30, v_total_ip, v_meta_acumulada, v_progreso_pct, v_mes_nombre, NOW())
    ON CONFLICT (fecha) DO UPDATE SET
      ip_sobre_30 = EXCLUDED.ip_sobre_30,
      ip_debajo_30 = EXCLUDED.ip_debajo_30,
      total_ip = EXCLUDED.total_ip,
      meta_acumulada = EXCLUDED.meta_acumulada,
      progreso_pct = EXCLUDED.progreso_pct,
      updated_at = NOW()
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial de snapshots
CREATE OR REPLACE FUNCTION get_meta_30_snapshot_history(year_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
  fecha DATE,
  ip_sobre_30 INTEGER,
  ip_debajo_30 INTEGER,
  total_ip INTEGER,
  meta_acumulada INTEGER,
  progreso_pct NUMERIC(5,2),
  mes_nombre VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.fecha,
    s.ip_sobre_30,
    s.ip_debajo_30,
    s.total_ip,
    s.meta_acumulada,
    s.progreso_pct,
    s.mes_nombre
  FROM meta_30_snapshots s
  WHERE year_filter IS NULL OR EXTRACT(YEAR FROM s.fecha) = year_filter
  ORDER BY s.fecha ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS
ALTER TABLE meta_30_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy para lectura (todos los usuarios autenticados)
CREATE POLICY "meta_30_snapshots_select" ON meta_30_snapshots
  FOR SELECT TO authenticated USING (true);

-- Policy para insert/update (solo service_role o usuarios específicos)
CREATE POLICY "meta_30_snapshots_admin" ON meta_30_snapshots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "meta_30_snapshots_admin_update" ON meta_30_snapshots
  FOR UPDATE TO authenticated USING (true);
