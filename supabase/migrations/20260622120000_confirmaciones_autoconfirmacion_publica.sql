-- =============================================================================
-- Encuentros: autoconfirmación pública por token
-- =============================================================================
-- Ticket: Encuentros: formulario público de autoconfirmación
-- Cada confirmación recibe un token impredecible. El público (anon) NO accede a
-- las tablas: solo puede llamar a dos funciones que operan sobre UN token.
-- =============================================================================

-- 1. Token por confirmación (dos UUID v4 sin guiones = 244 bits aleatorios)
ALTER TABLE confirmaciones
  ADD COLUMN IF NOT EXISTS token text;

UPDATE confirmaciones
SET token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE token IS NULL;

ALTER TABLE confirmaciones
  ALTER COLUMN token SET DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  ALTER COLUMN token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmaciones_token_unique
  ON confirmaciones(token);

-- 2. Lectura pública acotada: devuelve solo lo necesario para mostrar el form
CREATE OR REPLACE FUNCTION get_confirmacion_publica(p_token text)
RETURNS TABLE (
  dinamizador_nombre text,
  encuentro_nombre text,
  fecha_inicio date,
  fecha_fin date,
  sede text,
  asiste boolean,
  se_hospeda boolean,
  cena boolean,
  respondido boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.nombre,
    e.nombre,
    e.fecha_inicio,
    e.fecha_fin,
    e.sede,
    c.asiste,
    c.se_hospeda,
    c.cena,
    c.confirmado_at IS NOT NULL
  FROM confirmaciones c
  JOIN dinamizadores d ON d.id = c.dinamizador_id
  JOIN encuentros e ON e.id = c.encuentro_id
  WHERE c.token = p_token;
$$;

-- 3. Respuesta pública: actualiza SOLO la fila de ese token
CREATE OR REPLACE FUNCTION responder_confirmacion(
  p_token text,
  p_asiste boolean,
  p_se_hospeda boolean,
  p_cena boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  filas integer;
BEGIN
  IF p_asiste IS NULL THEN
    RAISE EXCEPTION 'La asistencia es obligatoria';
  END IF;

  UPDATE confirmaciones
  SET
    asiste = p_asiste,
    -- Si no asiste, no hay hospedaje ni cena
    se_hospeda = p_asiste AND COALESCE(p_se_hospeda, false),
    cena = p_asiste AND COALESCE(p_cena, false),
    estado_envio = 'confirmado',
    confirmado_at = now()
  WHERE token = p_token;

  GET DIAGNOSTICS filas = ROW_COUNT;
  RETURN filas = 1;
END;
$$;

-- 4. Permisos: anon y authenticated solo ejecutan las funciones
REVOKE ALL ON FUNCTION get_confirmacion_publica(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION responder_confirmacion(text, boolean, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_confirmacion_publica(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION responder_confirmacion(text, boolean, boolean, boolean) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Rollback:
-- DROP FUNCTION IF EXISTS responder_confirmacion(text, boolean, boolean, boolean);
-- DROP FUNCTION IF EXISTS get_confirmacion_publica(text);
-- DROP INDEX IF EXISTS idx_confirmaciones_token_unique;
-- ALTER TABLE confirmaciones DROP COLUMN IF EXISTS token;
-- =============================================================================
