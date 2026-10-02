-- =============================================================================
-- Encuentros: control estricto de cupos (52 hospedajes, 62 cenas totales)
-- =============================================================================
-- Ticket: Encuentros: control de cupos máximos (52 hospedajes / 62 cenas)
--
-- Reglas inquebrantables:
-- 1. Todo el que se hospeda cena obligatoriamente (se_hospeda => cena = true).
-- 2. Máximo 52 hospedajes en total por encuentro.
-- 3. Máximo 62 cenas en total por encuentro (52 de hospedados + 10 extras no hospedados).
-- 4. get_confirmacion_publica devuelve los cupos restantes para informar en el form.
-- 5. responder_confirmacion valida atómicamente con FOR UPDATE que no se superen los cupos.
-- =============================================================================

-- Dropear primero la función previa para permitir cambiar los tipos de retorno
DROP FUNCTION IF EXISTS get_confirmacion_publica(text);

-- 1. Lectura pública con cupos disponibles
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
  respondido boolean,
  cupos_hospedaje_disponibles integer,
  cupos_cena_disponibles integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encuentro_id uuid;
  v_ocupados_hospedaje integer;
  v_ocupados_cena integer;
BEGIN
  -- Obtener encuentro de esta confirmación
  SELECT c.encuentro_id INTO v_encuentro_id
  FROM confirmaciones c
  WHERE c.token = p_token;

  IF v_encuentro_id IS NULL THEN
    RETURN; -- Token inválido
  END IF;

  -- Contar cupos ocupados actualmente en ese encuentro
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE c.se_hospeda = true), 0),
    COALESCE(COUNT(*) FILTER (WHERE c.cena = true), 0)
  INTO v_ocupados_hospedaje, v_ocupados_cena
  FROM confirmaciones c
  WHERE c.encuentro_id = v_encuentro_id;

  RETURN QUERY
  SELECT
    d.nombre,
    e.nombre,
    e.fecha_inicio,
    e.fecha_fin,
    e.sede,
    c.asiste,
    c.se_hospeda,
    c.cena,
    c.confirmado_at IS NOT NULL,
    GREATEST(0, 52 - v_ocupados_hospedaje)::integer AS cupos_hospedaje_disponibles,
    GREATEST(0, 62 - v_ocupados_cena)::integer AS cupos_cena_disponibles
  FROM confirmaciones c
  JOIN dinamizadores d ON d.id = c.dinamizador_id
  JOIN encuentros e ON e.id = c.encuentro_id
  WHERE c.token = p_token;
END;
$$;

-- 2. Respuesta pública con validación atómica de cupos
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
  v_confirmacion record;
  v_ocupados_hospedaje integer;
  v_ocupados_cena integer;
  v_quiere_hospedarse boolean;
  v_quiere_cenar boolean;
BEGIN
  IF p_asiste IS NULL THEN
    RAISE EXCEPTION 'La asistencia es obligatoria';
  END IF;

  -- Bloquear la fila para evitar respuestas concurrentes sobre el mismo token
  SELECT c.id, c.encuentro_id, c.confirmado_at
  INTO v_confirmacion
  FROM confirmaciones c
  WHERE c.token = p_token
  FOR UPDATE;

  IF NOT FOUND OR v_confirmacion.confirmado_at IS NOT NULL THEN
    -- Token inválido o ya respondido (candado de una sola respuesta)
    RETURN false;
  END IF;

  -- Regla: Si no asiste, no puede hospedarse ni cenar
  IF p_asiste = false THEN
    v_quiere_hospedarse := false;
    v_quiere_cenar := false;
  ELSE
    v_quiere_hospedarse := COALESCE(p_se_hospeda, false);
    -- Regla: Todo el que se hospeda cena obligatoriamente
    IF v_quiere_hospedarse THEN
      v_quiere_cenar := true;
    ELSE
      v_quiere_cenar := COALESCE(p_cena, false);
    END IF;
  END IF;

  -- Validar cupo de hospedaje si lo solicita
  IF v_quiere_hospedarse THEN
    SELECT COUNT(*) INTO v_ocupados_hospedaje
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = true;

    IF v_ocupados_hospedaje >= 52 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de hospedaje (límite: 52)';
    END IF;
  END IF;

  -- Validar cupo de cena si lo solicita
  IF v_quiere_cenar THEN
    SELECT COUNT(*) INTO v_ocupados_cena
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND cena = true;

    IF v_ocupados_cena >= 62 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de cena (límite: 62)';
    END IF;
  END IF;

  -- Aplicar actualización
  UPDATE confirmaciones
  SET
    asiste = p_asiste,
    se_hospeda = v_quiere_hospedarse,
    cena = v_quiere_cenar,
    estado_envio = 'confirmado',
    confirmado_at = now()
  WHERE id = v_confirmacion.id;

  RETURN true;
END;
$$;

-- 3. Función segura para actualizar respuesta desde el panel (con validación de cupos)
CREATE OR REPLACE FUNCTION admin_actualizar_respuesta(
  p_confirmacion_id uuid,
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
  v_confirmacion record;
  v_ocupados_hospedaje integer;
  v_ocupados_cena integer;
  v_quiere_hospedarse boolean;
  v_quiere_cenar boolean;
BEGIN
  IF p_asiste IS NULL THEN
    RAISE EXCEPTION 'La asistencia es obligatoria';
  END IF;

  SELECT c.id, c.encuentro_id, c.confirmado_at, c.se_hospeda, c.cena
  INTO v_confirmacion
  FROM confirmaciones c
  WHERE c.id = p_confirmacion_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Confirmación no encontrada';
  END IF;

  IF p_asiste = false THEN
    v_quiere_hospedarse := false;
    v_quiere_cenar := false;
  ELSE
    v_quiere_hospedarse := COALESCE(p_se_hospeda, false);
    IF v_quiere_hospedarse THEN
      v_quiere_cenar := true;
    ELSE
      v_quiere_cenar := COALESCE(p_cena, false);
    END IF;
  END IF;

  -- Validar cupo de hospedaje excluyendo la propia fila si ya lo tenía
  IF v_quiere_hospedarse AND COALESCE(v_confirmacion.se_hospeda, false) = false THEN
    SELECT COUNT(*) INTO v_ocupados_hospedaje
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = true
      AND id <> p_confirmacion_id;

    IF v_ocupados_hospedaje >= 52 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de hospedaje (límite: 52)';
    END IF;
  END IF;

  -- Validar cupo de cena excluyendo la propia fila si ya la tenía
  IF v_quiere_cenar AND COALESCE(v_confirmacion.cena, false) = false THEN
    SELECT COUNT(*) INTO v_ocupados_cena
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND cena = true
      AND id <> p_confirmacion_id;

    IF v_ocupados_cena >= 62 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de cena (límite: 62)';
    END IF;
  END IF;

  UPDATE confirmaciones
  SET
    asiste = p_asiste,
    se_hospeda = v_quiere_hospedarse,
    cena = v_quiere_cenar,
    estado_envio = 'confirmado',
    confirmado_at = COALESCE(v_confirmacion.confirmado_at, now())
  WHERE id = p_confirmacion_id;

  RETURN true;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION get_confirmacion_publica(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION responder_confirmacion(text, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_respuesta(uuid, boolean, boolean, boolean) TO authenticated;
