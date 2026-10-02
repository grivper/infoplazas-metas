# Encuentros

## Objetivo
Crear el módulo Encuentros para administrar dinamizadores y, en iteraciones posteriores, gestionar confirmaciones por WhatsApp y formulario público.

## Alcance aprobado
- Carga inicial desde Excel/GEBILO ya realizada: 105 dinamizadores y 2 enlaces en Supabase.
- Agregar/editar dinamizadores desde la página.
- La sincronización automática con Google Sheets queda fuera de alcance por ahora.

## Tareas
- [x] Migrar tablas `enlaces`, `dinamizadores`, `encuentros`, `confirmaciones`.
- [x] Importar dinamizadores desde los Excel y completar los 6 matches inequívocos de GEBILO.
- [x] Crear servicio CRUD y la primera vista administrativa para listar/agregar/editar dinamizadores.
- [x] Separar en dos tablas las infoplazas con dinamizador asignado y las vacantes.
- [x] Ocultar las infoplazas cerradas/inactivas de la vista Encuentros.
- [x] Permitir asignar un dinamizador directamente desde la tabla de vacantes.
- [x] Registrar el Encuentro Regional de Dinamizadores (29–30 de octubre de 2026, Gran Hotel Azuero) y generar sus 104 confirmaciones iniciales.
- [x] Añadir tablero de confirmaciones, plantilla editable y tablas de estado.
- [x] Mover la gestión de dinamizadores a Gestión de Infoplazas, junto a Catálogo y Rutas.
- [x] Añadir formulario público de autoconfirmación (/confirmar/:token).

## Unidad de trabajo: envío de confirmación por WhatsApp
- [x] Añadir el servicio de envío y actualización de estado: al abrir el botón `wa.me`, la confirmación pasa a `enviado`.
- [x] Añadir la acción por confirmación en el tablero, con un enlace personalizado a partir de la plantilla guardada y el token público.
- [x] Verificar el flujo de apertura, actualización de estado y recarga de tablas.

### Decisión de producto
El estado cambia a `enviado` al presionar el botón de WhatsApp. WhatsApp no confirma si el organizador finalmente pulsó “Enviar” dentro de la aplicación externa.

## Evidencia
- Migración: `supabase/migrations/20260620000000_encuentros_dinamizadores.sql`, aplicada remotamente.
- Scripts: `scripts/import-dinamizadores.mjs`, `scripts/import-dinamizadores-faltantes.mjs`.
- Datos cargados: 105 dinamizadores; 2 enlaces (Guillermo Rivera y Rogelio Cruz).
- Pendientes de dato: 20 infoplazas sin dinamizador (17 vacantes en GEBILO; 3 ambiguas).

## Evidencia adicional
- Primera vista administrativa creada en `src/features/encuentros/` y registrada en `/encuentros`.
- Validación: `npm run build` y lint específico de los archivos modificados pasaron.
- La aplicación abrió sin mensajes de consola en un navegador aislado; la vista privada requiere iniciar sesión para probarla en vivo.

## Próximo paso
Implementar confirmaciones por encuentro, la plantilla de WhatsApp y las tablas de estado.
