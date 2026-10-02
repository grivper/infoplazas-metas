# Catálogo de Infoplazas: distrito y corregimiento

## Ticket
- Notion: `3ed64f42-ddd3-8139-847f-ce22144a1f66`
- Estado: En progreso

## Objetivo
Incorporar Distrito y Corregimiento al catálogo de infoplazas, cargar los datos desde la hoja `SUCURSAL` de `encuentros/GEBILO_V1.xlsx`, mostrarlos en Gestión de Infoplazas y dejar la base preparada para el informe de confirmaciones.

## Tareas
- [x] Crear migración y carga reproducible para `distrito` y `corregimiento`, cruzando por código de infoplaza. Aplicado de forma segura mediante SQL Editor; el importador actualizó 126 registros y omitió 17 códigos obsoletos, el código 0 y el conflicto no catalogado 269.
- [x] Mostrar Distrito y Corregimiento en Gestión de Infoplazas → Catálogo. Verificado en navegador con 34-La Pintada; la tabla mantiene scroll horizontal interno en móvil.
- [x] Generar el Excel de confirmaciones con las columnas solicitadas, verificando datos y totales. Se generaron 106 filas; 105 tienen enlace y 670-La Pava se deja sin enlace porque no posee asignación registrada.
- [x] Agregar en Encuentros \u2192 Respuestas un bot\u00f3n que genere y descargue el Excel bajo demanda, en el navegador y con la sesi\u00f3n del admin (sin clave de servicio).

## Criterios
- No modificar confirmaciones ni dinamizadores.
- No inventar datos territoriales: los ausentes se informan explícitamente.
- El Excel contiene: #, Infoplaza, Provincia, Distrito, Corregimiento, Cédula, Asistencia, Hospedaje, Cena, Enlace, Confirmados y Pendientes de confirmación.

## Evidencia
- Importador preparado: `scripts/import-territorio-infoplazas.mjs`, con `--dry-run`, detección de conflictos y actualización limitada a los dos campos.
- Migración preparada: `supabase/migrations/20260625120000_catalogo_territorio.sql`.
- La reconciliación no se pudo completar: las 8 migraciones locales de 2025 comparten la versión inválida `2025`, el remoto tiene 7 migraciones de agosto/septiembre de 2026 ausentes del repositorio y también falta la migración base que crea `catalogo_infoplazas`. `db pull` no puede construir la base temporal. Se revirtió la reparación parcial del historial; no se modificaron datos ni esquema de producción.
- La migración territorial se aplicó manualmente y de forma no destructiva en SQL Editor. `scripts/import-territorio-infoplazas.mjs` actualizó 126 filas; se verificó `34-la-pintada` con La Pintada / La Pintada.
- Commit territorial y catálogo: `93f2f80 feat: add infoplaza territorial catalog` (revisión de confiabilidad aprobada).
- Reporte generado: `reportes/confirmaciones-encuentro-regional.xlsx`, hoja `Confirmaciones`, 106 filas y 12 columnas. `scripts/generate-confirmaciones-workbook.mjs` es de solo lectura para Supabase; las respuestas sin contestar se muestran como `Pendiente`, y las columnas Confirmados/Pendientes de confirmación usan Sí/No según `confirmado_at`.
