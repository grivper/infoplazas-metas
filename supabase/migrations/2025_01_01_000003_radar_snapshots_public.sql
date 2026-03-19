-- Hacer radar_mensual_snapshots pública (sin RLS) para testing
DROP POLICY IF EXISTS "Allow authenticated reads" ON radar_mensual_snapshots;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON radar_mensual_snapshots;
DROP POLICY IF EXISTS "Allow authenticated updates" ON radar_mensual_snapshots;

-- Políticas públicas
CREATE POLICY "Allow public reads" ON radar_mensual_snapshots
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public inserts" ON radar_mensual_snapshots
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public updates" ON radar_mensual_snapshots
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
