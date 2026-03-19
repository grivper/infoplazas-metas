-- Habilitar RLS y crear políticas para radar_mensual_snapshots
-- Permite lectura y escritura a usuarios autenticados

ALTER TABLE radar_mensual_snapshots ENABLE ROW LEVEL SECURITY;

-- Política para lectura: cualquier usuario autenticado
CREATE POLICY "Allow authenticated reads" ON radar_mensual_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para insert: cualquier usuario autenticado
CREATE POLICY "Allow authenticated inserts" ON radar_mensual_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para update: cualquier usuario autenticado
CREATE POLICY "Allow authenticated updates" ON radar_mensual_snapshots
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
