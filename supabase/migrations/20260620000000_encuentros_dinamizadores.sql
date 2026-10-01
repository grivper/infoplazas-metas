-- =============================================================================
-- Encuentros: dinamizadores, enlaces, encuentros, confirmaciones
-- =============================================================================
-- Ticket: Encuentros: base de dinamizadores (carga inicial + agregar/editar)
-- Reemplaza el seguimiento manual en Excel (Listado de Confirmaciones.xlsx /
-- GEBILO_V1.xlsx) por tablas en Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. enlaces - catálogo chico de personas que enlazan/acompañan infoplazas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enlaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. dinamizadores - dato maestro de la persona, reutilizable entre encuentros
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dinamizadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infoplaza_codigo text NOT NULL REFERENCES catalogo_infoplazas(codigo),
  nombre text NOT NULL,
  sexo text,
  cedula text,
  celular text,
  email text,
  talla text,
  estatus text NOT NULL DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inactivo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dinamizadores_infoplaza ON dinamizadores(infoplaza_codigo);

-- -----------------------------------------------------------------------------
-- 3. encuentros - cada evento (ej. jornada de capacitación)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encuentros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  fecha date,
  sede text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. confirmaciones - respuesta de cada dinamizador a cada encuentro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confirmaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encuentro_id uuid NOT NULL REFERENCES encuentros(id) ON DELETE CASCADE,
  dinamizador_id uuid NOT NULL REFERENCES dinamizadores(id) ON DELETE CASCADE,
  asiste boolean,
  se_hospeda boolean,
  cena boolean,
  enlace_id uuid REFERENCES enlaces(id),
  estado_envio text NOT NULL DEFAULT 'pendiente'
    CHECK (estado_envio IN ('pendiente', 'enviado', 'confirmado')),
  enviado_at timestamptz,
  confirmado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (encuentro_id, dinamizador_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmaciones_encuentro ON confirmaciones(encuentro_id);
CREATE INDEX IF NOT EXISTS idx_confirmaciones_dinamizador ON confirmaciones(dinamizador_id);
CREATE INDEX IF NOT EXISTS idx_confirmaciones_estado ON confirmaciones(estado_envio);

-- -----------------------------------------------------------------------------
-- 5. RLS: solo usuarios autenticados por ahora (admin de Encuentros).
--    El acceso público al formulario de autoconfirmación se resuelve en el
--    ticket "Encuentros: formulario público de autoconfirmación" con una
--    política acotada (ej. por token), no acá.
-- -----------------------------------------------------------------------------
ALTER TABLE enlaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinamizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuentros ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enlaces_authenticated_all" ON enlaces
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dinamizadores_authenticated_all" ON dinamizadores
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "encuentros_authenticated_all" ON encuentros
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "confirmaciones_authenticated_all" ON confirmaciones
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------------------------------
-- 6. Trigger genérico para mantener updated_at al día
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enlaces_updated_at
  BEFORE UPDATE ON enlaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_dinamizadores_updated_at
  BEFORE UPDATE ON dinamizadores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_encuentros_updated_at
  BEFORE UPDATE ON encuentros
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_confirmaciones_updated_at
  BEFORE UPDATE ON confirmaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Rollback: para revertir, ejecutar:
-- DROP TABLE IF EXISTS confirmaciones;
-- DROP TABLE IF EXISTS encuentros;
-- DROP TABLE IF EXISTS dinamizadores;
-- DROP TABLE IF EXISTS enlaces;
-- DROP FUNCTION IF EXISTS set_updated_at;
-- =============================================================================
