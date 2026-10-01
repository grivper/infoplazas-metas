-- =============================================================================
-- Encuentros: la autoconfirmación pública solo se puede responder UNA vez
-- =============================================================================
-- Después de la primera respuesta, el link queda bloqueado. Cualquier cambio lo
-- hace el organizador desde el panel (usuarios autenticados, por RLS).
-- =============================================================================

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
  WHERE token = p_token
    AND confirmado_at IS NULL; -- candado: solo la primera respuesta

  GET DIAGNOSTICS filas = ROW_COUNT;
  -- false = token inexistente o ya respondido
  RETURN filas = 1;
END;
$$;

-- -----------------------------------------------------------------------------
-- Rollback: volver a la versión sin candado (migración 20260622120000)
-- =============================================================================
