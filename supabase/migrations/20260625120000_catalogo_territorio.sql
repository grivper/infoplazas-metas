-- Añade la división territorial disponible en la hoja SUCURSAL de GEBILO.
-- Los datos se cargan de forma reproducible con scripts/import-territorio-infoplazas.mjs.
ALTER TABLE catalogo_infoplazas
  ADD COLUMN IF NOT EXISTS distrito text,
  ADD COLUMN IF NOT EXISTS corregimiento text;
