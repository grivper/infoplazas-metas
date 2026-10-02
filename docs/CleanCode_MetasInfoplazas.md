# Clean Code y Patrones de Diseño — Metas Infoplazas

## Estado
- **Versión**: 1.0
- **Fecha**: 2026-06-05

---

## 1. Reglas de Oro (No Negociables)

### 1.1 Flujo Enterprise (Documentar antes de Codificar)
- **NUNCA** se escribe ni se modifica código para una nueva feature o rediseño sin que exista un ticket previo.
- Todo análisis debe ser documentado en Notion y aprobado antes de programar.
- **Kanban Automático**: Toda tarea que empieza a codificarse pasa a "En Progreso" y al finalizar se consulta para pasar a "Completada".

### 1.2 Límites Duros
- **Máximo 300 líneas por archivo**: Ningún componente o servicio debe superar este límite. Si se acerca, es obligatorio refactorizar y dividir (Ej. extraer modales, tablas o lógicas a archivos separados).
- **Una responsabilidad por archivo**: Un componente = Una responsabilidad.

### 1.3 Comentarios y Mentoría
- **Comentarios Vivos**: Se comenta el *por qué* de la lógica importante. Si el código cambia, el comentario **DEBE** actualizarse en el mismo commit.
- **Código como material de estudio**: El código debe ser limpio y explícito, pensado para que el desarrollador líder (novato en el stack) pueda leerlo, entenderlo y aprender de él.

---

## 2. Patrones de Diseño Recomendados

### 2.1 Screaming Architecture (Modularidad)
Implementado a nivel de carpetas. Cada carpeta dentro de `src/features/` debe "gritar" qué hace (ej. `auditoria`, `mesas`, `informe`). Todo lo relacionado con ese módulo vive adentro (UI, servicios, validaciones).

### 2.2 Container / Presentational Pattern
En el Frontend (React):
- **Container (Vistas)**: Archivos terminados en `View.tsx`. Manejan el estado, los efectos (`useEffect`) y las llamadas a la base de datos a través de los servicios.
- **Presentational (Componentes)**: Componentes tontos en las carpetas `components/`. Reciben datos vía `props` y emiten eventos, sin saber de dónde viene la data.

### 2.3 Patrón Servicio (Service Pattern)
- **Nunca** llamar a Supabase (`supabase.from()`) directamente dentro de un componente React.
- Todas las consultas a la base de datos deben abstraerse en funciones asíncronas dentro de `features/[modulo]/services/`. El componente solo llama a la función y espera la promesa.

---

## 3. Clean Code: Principios Universales Aplicados

### DRY (Don't Repeat Yourself)
- Utilizar los componentes de `src/components/ui` (Shadcn) para mantener uniformidad. No recrear botones, inputs o modales en cada feature.
- Funciones matemáticas de KPI o cruces de arreglos (como los de las Metas) deben ser extraídos si se usan en múltiples vistas.

### Nomenclatura Intuitiva (Prosa)
- **Booleanos**: `isModalOpen`, `hasVisitas`, `canEdit`.
- **Eventos**: `onSuccess`, `handleDelete`.
- **Servicios**: `fetchAllItinerarios`, `updateInfoplaza`.
- Evitar nombres crípticos (`d`, `arr`, `val`). Usar `fecha`, `infoplazas`, `visitaSeleccionada`.

### Early Return (Retorno Temprano)
Evitar el código anidado en forma de "flecha" (`>`). Validar errores al inicio de la función y hacer `return` inmediato, dejando la lógica principal limpia en el primer nivel de indentación.