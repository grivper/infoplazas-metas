-- =============================================================================
-- Encuentros: cupo de cena independiente para no hospedados (52 hospedajes / 10 cenas extra)
-- =============================================================================
-- Ticket: odd/tasks/cupos-cena-libres.md
--
-- Reglas acordadas (reemplazan la migración 20260624120000):
-- 1. Hospedaje: máximo 52 en total por encuentro.
-- 2. Todo el que se hospeda cena obligatoriamente (se_hospeda => cena = true) y esa
--    cena NO consume el cupo de cenas extra: es automática y no tiene tope propio.
-- 3. Cenas para asistentes que NO se hospedan: exactamente 10, fijas e independientes
--    del cupo de hospedaje. Que sobren o se agoten hospedajes no cambia este número.
-- 4. Los dos cupos son independientes entre sí: agotar las 10 cenas extra nunca
--    bloquea el hospedaje, y un hospedado nunca es rechazado por falta de cupo de cena.
-- 5. No asiste => no hospedaje ni cena. Se hospeda => cena = true siempre.
-- 6. Total de cenas a cobrar = hospedados + cenas extra (no un número fijo de 62).
-- 7. get_confirmacion_publica devuelve los cupos restantes para informar en el form.
-- 8. responder_confirmacion y admin_actualizar_respuesta validan atómicamente con
--    FOR UPDATE, excluyendo la propia fila cuando se edita/reresponde, igual que antes.
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
  v_ocupados_cena_extra integer;
BEGIN
  -- Obtener encuentro de esta confirmación
  SELECT c.encuentro_id INTO v_encuentro_id
  FROM confirmaciones c
  WHERE c.token = p_token;

  IF v_encuentro_id IS NULL THEN
    RETURN; -- Token inválido
  END IF;

  -- Contar cupos ocupados actualmente en ese encuentro.
  -- Las cenas de hospedados son automáticas y no consumen el cupo de cena extra;
  -- solo cuentan las cenas de asistentes que NO se hospedan.
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE c.se_hospeda = true), 0),
    COALESCE(COUNT(*) FILTER (WHERE c.se_hospeda = false AND c.cena = true), 0)
  INTO v_ocupados_hospedaje, v_ocupados_cena_extra
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
    -- cupos_cena_disponibles se mantiene por compatibilidad con consumidores existentes:
    -- equivale al cupo de cena EXTRA restante (para asistentes que no se hospedan),
    -- ya que las cenas de hospedados son automáticas y no tienen cupo propio.
    GREATEST(0, 10 - v_ocupados_cena_extra)::integer AS cupos_cena_disponibles
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
  v_ocupados_cena_extra integer;
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

  -- Validar cupo de hospedaje si lo solicita (independiente del cupo de cena extra)
  IF v_quiere_hospedarse THEN
    SELECT COUNT(*) INTO v_ocupados_hospedaje
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = true;

    IF v_ocupados_hospedaje >= 52 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de hospedaje (límite: 52)';
    END IF;
  END IF;

  -- Validar cupo de cena EXTRA solo cuando la cena es de alguien que no se hospeda.
  -- La cena de un hospedado es automática y nunca se valida contra este cupo.
  IF v_quiere_cenar AND NOT v_quiere_hospedarse THEN
    SELECT COUNT(*) INTO v_ocupados_cena_extra
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = false
      AND cena = true;

    IF v_ocupados_cena_extra >= 10 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de cena (límite: 10 para quienes no se hospedan)';
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
  v_ocupados_cena_extra integer;
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

  -- Validar cupo de cena EXTRA excluyendo la propia fila, solo si la cena nueva es
  -- de alguien que no se hospeda y antes no contaba ya como cena extra ocupada.
  IF v_quiere_cenar AND NOT v_quiere_hospedarse
     AND NOT (COALESCE(v_confirmacion.cena, false) = true AND COALESCE(v_confirmacion.se_hospeda, false) = false) THEN
    SELECT COUNT(*) INTO v_ocupados_cena_extra
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = false
      AND cena = true
      AND id <> p_confirmacion_id;

    IF v_ocupados_cena_extra >= 10 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de cena (límite: 10 para quienes no se hospedan)';
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
-- Seguridad: admin_actualizar_respuesta es SECURITY DEFINER y no verifica quién la llama;
-- por defecto PostgreSQL otorga EXECUTE a PUBLIC (y por tanto a anon). Solo el panel
-- administrativo (usuarios autenticados) debe poder invocarla.
REVOKE ALL ON FUNCTION admin_actualizar_respuesta(uuid, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_confirmacion_publica(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION responder_confirmacion(text, boolean, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_actualizar_respuesta(uuid, boolean, boolean, boolean) TO authenticated;

-- =============================================================================
-- ROLLBACK
-- =============================================================================
-- Para revertir esta migración, volver a aplicar las definiciones de
-- 20260624120000_encuentros_cupos_hospedaje_cena.sql (DROP FUNCTION
-- get_confirmacion_publica(text); luego recrear las 3 funciones con el límite
-- fijo de 62 cenas totales y los GRANT correspondientes). Para devolver el permiso
-- que se retiró: GRANT EXECUTE ON FUNCTION admin_actualizar_respuesta(uuid, boolean,
-- boolean, boolean) TO PUBLIC;  (no recomendado: expone la función a la clave anon).
-- =============================================================================
