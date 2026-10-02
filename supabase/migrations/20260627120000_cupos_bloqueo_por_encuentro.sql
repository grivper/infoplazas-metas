-- =============================================================================
-- Encuentros: cierra la condición de carrera en la validación de cupos
-- =============================================================================
-- Problema: responder_confirmacion y admin_actualizar_respuesta bloquean solo la
-- fila de la persona que responde (FOR UPDATE). Dos personas distintas que confirman
-- a la vez pueden contar el mismo total, pasar ambas la validación y superar el tope
-- (52 hospedajes / 10 cenas extra).
--
-- Solución: antes de contar, cada función toma un advisory lock transaccional por
-- encuentro (pg_advisory_xact_lock). Las confirmaciones del mismo encuentro se
-- serializan; se libera solo al terminar la transacción. Reglas y mensajes no cambian
-- respecto de 20260626120000_cupos_cena_no_hospedados.sql.
-- =============================================================================

-- 1. Respuesta pública
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

  -- Serializar las confirmaciones del mismo encuentro antes de contar cupos.
  -- Siempre se toma después del bloqueo de fila y en el mismo orden en ambas
  -- funciones, por lo que no genera interbloqueos.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_confirmacion.encuentro_id::text, 0));

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

  -- Validar cupo de hospedaje (independiente del cupo de cena extra)
  IF v_quiere_hospedarse THEN
    SELECT COUNT(*) INTO v_ocupados_hospedaje
    FROM confirmaciones
    WHERE encuentro_id = v_confirmacion.encuentro_id
      AND se_hospeda = true;

    IF v_ocupados_hospedaje >= 52 THEN
      RAISE EXCEPTION 'No hay cupos disponibles de hospedaje (límite: 52)';
    END IF;
  END IF;

  -- Validar cupo de cena EXTRA solo para quien no se hospeda
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

-- 2. Edición desde el panel administrativo
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

  -- Mismo candado por encuentro que responder_confirmacion (ver arriba)
  PERFORM pg_advisory_xact_lock(hashtextextended(v_confirmacion.encuentro_id::text, 0));

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

  -- Validar cupo de cena EXTRA excluyendo la propia fila
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

-- CREATE OR REPLACE conserva los permisos vigentes (admin_actualizar_respuesta solo
-- para authenticated; responder_confirmacion para anon y authenticated).

-- =============================================================================
-- ROLLBACK
-- =============================================================================
-- Reaplicar las definiciones de responder_confirmacion y admin_actualizar_respuesta
-- de 20260626120000_cupos_cena_no_hospedados.sql (sin la línea pg_advisory_xact_lock).
-- =============================================================================
