# Botón editar infoplaza

## Ticket
- Épica Notion: `3f064f42-ddd3-810e-847e-df4373015fb8`
- Estado: Completada
- Rama: `feat/editar-infoplaza`

## Objetivo
Editar nombre, código, provincia, distrito y corregimiento de cada infoplaza desde Gestión de Infoplazas → Catálogo. Caso inmediato: intercambiar `667-chupa` y `668-santa-ana` en tres ediciones (con código temporal), verificando que los dinamizadores sigan a su infoplaza.

## Tareas
- [x] DB: migración `ON UPDATE CASCADE` en FKs hacia `catalogo_infoplazas(codigo)` (Notion `3f064f42-ddd3-8177-b36f-c84cf15f1ee1`). Aplicada en SQL Editor (proyecto xaawdamsgpfcqklviseh); verificado `dinamizadores_infoplaza_codigo_fkey` = CASCADE. Las demás FKs usan `infoplaza_id`, no el código.
- [x] Servicio: `updateInfoplaza` en `infoplazaUpdateService.ts` (archivo aparte: `infoplazasService.ts` ya tenía 278 líneas y el límite es 300). 3 tests pasan; tsc y eslint limpios (Notion `3f064f42-ddd3-81fd-ac01-f328e21c6303`).
- [x] UI (pendiente de prueba manual del usuario con el intercambio 667/668): `ModalEditarInfoplaza`, columna Acciones y conexión en la vista (Notion `3f064f42-ddd3-8155-b375-e15cd4805e03`).

## Criterios
- Cambiar un código con dinamizadores no falla y los dinamizadores quedan con el código nuevo.
- Código duplicado muestra un error claro.
- Ningún archivo supera 300 líneas.

## Evidencia
- Migración aplicada y verificada; servicio con 3 tests; UI aprobada por el usuario (commit cab293b).
