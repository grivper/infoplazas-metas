-- ============================================
-- Tabla para snapshots mensuales de Meta 4 (Rutas)
-- Congela la cantidad de Infoplazas asignadas por mes
-- ============================================

CREATE TABLE IF NOT EXISTS meta_4_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enlace_nombre TEXT NOT NULL,
  mes_num INTEGER NOT NULL CHECK (mes_num >= 1 AND mes_num <= 12),
  año INTEGER NOT NULL,
  total_ip INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (enlace_nombre, mes_num, año)
);

-- Habilitar RLS
ALTER TABLE meta_4_snapshots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "meta_4_snapshots_select" ON meta_4_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "meta_4_snapshots_insert" ON meta_4_snapshots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "meta_4_snapshots_update" ON meta_4_snapshots FOR UPDATE TO authenticated USING (true);
