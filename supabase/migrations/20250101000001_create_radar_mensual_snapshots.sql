-- Radar de Conectividad: Snapshots Mensuales para Seguimiento
-- Permite hacer seguimiento de efectividad mensual y comparativas

CREATE TABLE IF NOT EXISTS radar_mensual_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL UNIQUE,  -- Primer día del mes (ej: 2024-01-01)
  
  -- Métricas de dispositivos
  total_dispositivos INT NOT NULL DEFAULT 0,
  online INT NOT NULL DEFAULT 0,
  critico INT NOT NULL DEFAULT 0,
  tasa_disponibilidad DECIMAL(5,2) NOT NULL DEFAULT 0,  -- porcentaje (ej: 97.40)
  
  -- Fallas del mes
  nuevas_fallas INT NOT NULL DEFAULT 0,
  fallas_resueltas INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas por mes
CREATE INDEX IF NOT EXISTS idx_radar_snapshots_mes ON radar_mensual_snapshots(mes DESC);

-- Comentarios para documentación
COMMENT ON TABLE radar_mensual_snapshots IS 'Snapshots mensuales del radar de conectividad para seguimiento de efectividad';
COMMENT ON COLUMN radar_mensual_snapshots.mes IS 'Primer día del mes (YYYY-MM-01)';
COMMENT ON COLUMN radar_mensual_snapshots.tasa_disponibilidad IS 'Porcentaje de dispositivos online: (online / total) * 100';
COMMENT ON COLUMN radar_mensual_snapshots.nuevas_fallas IS 'Count de radar_historial_fallas con fecha_registro en este mes';
COMMENT ON COLUMN radar_mensual_snapshots.fallas_resueltas IS 'Count de radar_historial_fallas con fecha_arqueo en este mes';
