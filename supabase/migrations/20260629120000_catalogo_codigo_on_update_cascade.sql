-- Permite corregir el código de una infoplaza (catalogo_infoplazas.codigo)
-- sin romper las tablas que lo referencian: el cambio se propaga solo.
--
-- Hoy dinamizadores.infoplaza_codigo apunta a catalogo_infoplazas(codigo) sin
-- ON UPDATE CASCADE, así que cambiar un código con dinamizadores falla.
-- Se recrea cada FK que apunta a esa columna, conservando su nombre y su
-- ON DELETE, y agregando ON UPDATE CASCADE. Es idempotente.

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT
      con.conname,
      con.conrelid::regclass AS tabla,
      att.attname AS columna,
      CASE con.confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        WHEN 'r' THEN 'RESTRICT'
        ELSE 'NO ACTION'
      END AS on_delete
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    JOIN pg_attribute ref
      ON ref.attrelid = con.confrelid AND ref.attnum = con.confkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = 'public.catalogo_infoplazas'::regclass
      AND ref.attname = 'codigo'
      AND array_length(con.conkey, 1) = 1
      AND con.confupdtype <> 'c'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tabla, fk.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.catalogo_infoplazas(codigo) ON UPDATE CASCADE ON DELETE %s',
      fk.tabla, fk.conname, fk.columna, fk.on_delete
    );
  END LOOP;
END $$;
