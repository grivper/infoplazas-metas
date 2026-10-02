# Plan de Implementación — Lógica Territorial de Rutas (Meta 4)

## Estado
- **Versión**: 1.0
- **Fecha**: 2026-06-05
- **Autor**: IA / Equipo de Desarrollo Metas Infoplazas

---

## Fase 0: Contexto y Objetivo
El objetivo de este sprint es cambiar la lógica de evaluación de visitas (Meta 4) de un esquema de "coincidencia exacta empleado-ruta" a un enfoque 100% **territorial**. Las visitas a una Infoplaza deben reflejarse en la ruta a la que pertenece esa Infoplaza (para seguimiento regional) y, a su vez, cada empleado acumula avance de su meta basada en todas las visitas que realiza, independientemente de la región de la Infoplaza.

---

## Fase 1: Base de Datos y Reportes Estáticos
**Objetivo**: Retirar a "Jose Ruiz" y dejar la ruta disponible bajo un concepto de "Vacante".

### Sprint 1.1 — Renombrar Ruta en BD (Supabase)
- **Tarea**: Ejecutar script SQL o update en la tabla `itinerario_enlaces` donde `enlace_nombre = 'Jose Ruiz'`.
- **Nuevo valor**: `Ruta Coclé (Vacante)`.

### Sprint 1.2 — Modificar Excel Hardcodeado
- **Archivo**: `src/features/informe/lib/hojas/resumen.ts`
- **Tarea**: Reemplazar 'Jose Ruiz' por 'Ruta Coclé (Vacante)' en la Meta 2, Meta 4 y Meta 5.

---

## Fase 2: Lógica de Backend / Dashboard
**Objetivo**: Modificar los cálculos de la Meta 4 para premiar el esfuerzo total y proteger el promedio.

### Sprint 2.1 — Refactor del Dashboard
- **Archivo**: `src/features/dashboard/services/meta4-rutas.ts`
- **Tareas**:
  1. Eliminar el filtro `.filter(ip => progSet.has(ip))` para que las visitas sumen al cumplimiento del enlace, sin importar si la IP pertenece a su itinerario asignado.
  2. Filtrar "Ruta Coclé (Vacante)" o enlaces con "(Vacante)" en el nombre del cálculo del `promedioGlobal` (`tasaExitoYtd`), para que su 0% operativo no baje el KPI del equipo.

---

## Fase 3: Frontend y Visualización
**Objetivo**: El mapa de rutas debe mostrar el avance territorial.

### Sprint 3.1 — Semáforo de Rutas Visuales
- **Archivo**: `src/features/auditoria/PlanVisitasView.tsx`
- **Tarea**: Quitar el filtro `visitasDelEnlace` y evaluar `matchVisita` directamente contra `visitasMes`. Así, la Infoplaza se pinta de verde si *cualquiera* la visitó en ese mes.

---

## Fase 4: Despliegue y Pruebas
- Verificar en Dashboard que el promedio no colapsa.
- Comprobar que Plan de Visitas muestra las IPs de Coclé en verde si hay visitas correspondientes registradas en Cognito.
- Confirmar descarga correcta del archivo de resumen Excel.
