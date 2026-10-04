-- ============================================
-- meta_4_snapshots.infoplazas_json
-- Adds the column that stores the list of infoplaza IDs assigned to a
-- route (enlace) in a given month.
--
-- Written by src/features/dashboard/services/meta4-rutas.ts and read by
-- src/features/auditoria/services/cruceVisitas.ts.
--
-- The column already exists in production (it was added by hand), so this
-- migration is a no-op there (IF NOT EXISTS). Its purpose is to make a fresh
-- database built from migrations match production.
-- ============================================

ALTER TABLE meta_4_snapshots
  ADD COLUMN IF NOT EXISTS infoplazas_json JSONB;
