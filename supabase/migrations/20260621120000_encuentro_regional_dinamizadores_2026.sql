-- =============================================================================
-- Encuentro regional de dinamizadores | 29–30 octubre 2026 | Gran Hotel Azuero
-- =============================================================================
-- Añade soporte para rango de fechas y mensaje editable, registra el encuentro
-- regional 2026 y genera una confirmación pendiente por cada infoplaza activa
-- con dinamizador activo. La generación es idempotente: no duplica registros
-- ni reinicia respuestas existentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Evolución aditiva de encuentros
-- -----------------------------------------------------------------------------
ALTER TABLE encuentros
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin date,
  ADD COLUMN IF NOT EXISTS mensaje_template text,
  ADD COLUMN IF NOT EXISTS clave text;

-- Conserva compatibilidad con cualquier evento anterior de fecha única.
UPDATE encuentros
SET
  fecha_inicio = COALESCE(fecha_inicio, fecha),
  fecha_fin = COALESCE(fecha_fin, fecha_inicio, fecha)
WHERE fecha_inicio IS NULL OR fecha_fin IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_encuentros_clave_unique
  ON encuentros(clave)
  WHERE clave IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Evento activo: Encuentro regional de dinamizadores 2026
-- -----------------------------------------------------------------------------
INSERT INTO encuentros (
  clave,
  nombre,
  fecha,
  fecha_inicio,
  fecha_fin,
  sede,
  mensaje_template
)
VALUES (
  'encuentro-regional-dinamizadores-2026',
  'Encuentro regional de dinamizadores: Infoplazas, hubs regionales de alfabetización digital y en IA',
  '2026-10-29',
  '2026-10-29',
  '2026-10-30',
  'Gran Hotel Azuero',
  'Hola {nombre}, te invitamos al Encuentro regional de dinamizadores: Infoplazas, hubs regionales de alfabetización digital y en IA, los días 29 y 30 de octubre de 2026 en el Gran Hotel Azuero. Por favor, confirma tu asistencia aquí: {link}'
)
ON CONFLICT (clave) WHERE clave IS NOT NULL DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Confirmaciones iniciales
-- Solo incluye infoplazas activas y dinamizadores activos. La clave única de
-- confirmaciones evita insertar duplicados si esta migración se aplica otra vez.
-- -----------------------------------------------------------------------------
INSERT INTO confirmaciones (encuentro_id, dinamizador_id, estado_envio)
SELECT
  encuentro.id,
  dinamizador.id,
  'pendiente'
FROM encuentros AS encuentro
JOIN dinamizadores AS dinamizador
  ON dinamizador.estatus = 'Activo'
JOIN catalogo_infoplazas AS infoplaza
  ON infoplaza.codigo = dinamizador.infoplaza_codigo
WHERE encuentro.clave = 'encuentro-regional-dinamizadores-2026'
  AND COALESCE(infoplaza.cerrada, false) = false
ON CONFLICT (encuentro_id, dinamizador_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Rollback: para revertir el evento de prueba antes de recibir respuestas:
-- DELETE FROM encuentros WHERE clave = 'encuentro-regional-dinamizadores-2026';
-- (las confirmaciones asociadas se eliminan por ON DELETE CASCADE)
-- =============================================================================
