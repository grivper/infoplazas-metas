# Botón editar infoplaza

## Ticket
- Épica Notion: `3f064f42-ddd3-810e-847e-df4373015fb8`
- Estado: En progreso
- Rama: `feat/editar-infoplaza`

## Objetivo
Editar nombre, código, provincia, distrito y corregimiento de cada infoplaza desde Gestión de Infoplazas → Catálogo. Caso inmediato: intercambiar `667-chupa` y `668-santa-ana` en tres ediciones (con código temporal), verificando que los dinamizadores sigan a su infoplaza.

## Tareas
- [ ] DB: migración `ON UPDATE CASCADE` en FKs hacia `catalogo_infoplazas(codigo)` (Notion `3f064f42-ddd3-8177-b36f-c84cf15f1ee1`). Aplicación manual en SQL Editor.
- [ ] Servicio: `updateInfoplaza` en `infoplazasService.ts` (Notion `3f064f42-ddd3-81fd-ac01-f328e21c6303`).
- [ ] UI: `ModalEditarInfoplaza`, columna Acciones y conexión en la vista (Notion `3f064f42-ddd3-8155-b375-e15cd4805e03`).

## Criterios
- Cambiar un código con dinamizadores no falla y los dinamizadores quedan con el código nuevo.
- Código duplicado muestra un error claro.
- Ningún archivo supera 300 líneas.

## Evidencia
- Pendiente.
