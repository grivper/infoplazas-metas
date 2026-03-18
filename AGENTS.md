# Metas Core

---

name: metas-core
description: Reglas principales de desarrollo, arquitectura, stack tecnológico y directorio de skills para Metas Infoplazas. Úsala siempre como base al iniciar cualquier tarea, escribir o refactorizar código.

---

Esta skill define el comportamiento obligatorio para trabajar en este proyecto. Debes tenerla siempre en cuenta.

## 👤 Contexto del Usuario (Regla de Interacción)

El desarrollador líder (el usuario) es novato y está aprendiendo la pila tecnológica.

- Háblale de forma directa, cercana y sin jerga innecesaria.
- Da instrucciones claras, paso a paso. Un archivo a la vez.
- **ESPERA SIEMPRE SU CONFIRMACIÓN** antes de avanzar al siguiente paso.

## 📚 Stack Tecnológico Principal

- **Frontend:** React + TypeScript + Vite
- **UI & Estilos:** Tailwind CSS + Shadcn UI
- **Backend & Auth:** Supabase (PostgreSQL)
- **Enrutamiento:** React Router DOM
- **Arquitectura:** Screaming Architecture (agrupación por módulos en `src/features/`: `servicio-social`, `visitas-cognitos`, `mesas`, `auditoria`).

## 📜 Reglas Estrictas de Clean Code

**0. FLUJO ENTERPRISE (Documentar antes de codificar):**

- **NUNCA** escribas ni modifiques código para una nueva feature o rediseño sin que exista un ticket previo.
- Si el usuario te pide hacer un cambio importante y no te ha pedido documentarlo, **detente** y sugiérele usar la skill `notion-auto-pm` para registrarlo primero en "Notas Rápidas Metas Infoplazas".
- El orden inquebrantable es: 1. Analizar -> 2. Documentar en Notion -> 3. Esperar aprobación -> 4. Programar.

**1. CICLO DE VIDA DEL TICKET (KANBAN AUTOMÁTICO):**

- **En Progreso:** En el instante en que el usuario te da luz verde para empezar a programar un ticket que estaba "Sin empezar", tu PRIMERA acción (vía MCP) debe ser cambiar el `Status` de ese ticket en Notion a "En progreso" (o la etiqueta equivalente en la base de datos).
- **Revisión y Cierre:** Una vez que termines de escribir el código, SIEMPRE termina tu mensaje preguntando de forma natural: _"¿Te gusta el resultado? ¿Paso la tarea a 'Completada' en Notion?"_
- **Acción Rápida:** Si el usuario responde simplemente "Sí", "Listo" o "Ciérralo", conéctate a Notion vía MCP y cambia el estado a "Completada" de inmediato, sin pedirle más instrucciones.

1. **Simplicidad:** Escribe código fácil de leer. Cero código "espagueti" o complejidad innecesaria.
2. **Modularidad:** Un componente = Una responsabilidad. Crea módulos reutilizables.
3. **Límite de Tamaño:** NINGÚN archivo debe superar las **300 líneas**. Si se acerca, refactoriza y divídelo.
4. **Comentarios Vivos:** Comenta la lógica importante. Si cambias el código, DEBES actualizar el comentario.
5. **Buenas Prácticas:** Aplica lógica estructurada pensando en que el código servirá como material de estudio para el usuario.

## 🧰 Directorio de Skills Disponibles

- **`.agent/skills/pdf`**: Úsala para tareas de generación, lectura o manipulación de archivos PDF.
- **`.agent/skills/shadcn-ui`**: Úsala estrictamente al crear o modificar componentes de la interfaz de usuario para mantener el diseño del sistema.
- **`.agent/skills/supabase-postgres-best-practices`**: Úsala para consultas a la base de datos, políticas RLS o manejo de autenticación.
- **`.agent/skills/tailwind-patterns`**: Úsala para aplicar estilos consistentes, layouts y utilidades CSS.
- **`.agent/skills/typescript-advanced-types`**: Úsala para definir interfaces, types y asegurar el tipado estricto de los datos.
- **`.agent/skills/vercel-react-best-practices`**: Úsala para optimización de rendimiento y estándares de despliegue en React.
- **`.agent/skills/web-design-guidelines`**: Úsala para mantener una buena experiencia de usuario (UX) y consistencia visual en las pantallas.
- **`.agent/skills/notion-auto-pm`**: Úsala para gestionar tareas en Notion, cambiar estados de tickets y mantener el flujo Kanban.
- **`.agent/skills/notion-daily-notes`**: Úsala para gestionar tareas en cortas en Notion, agregando informacion relevante del dia.
