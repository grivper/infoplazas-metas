# Technical Requirements Document (TRD) — Metas Infoplazas

## Estado
- **Versión**: 1.0
- **Fecha**: 2026-06-05
- **Autor**: IA / Equipo de Desarrollo Metas Infoplazas

---

## 1. Stack Tecnológico Base

### 1.1 Frontend
- **Framework**: React 19 + Vite 7
- **Lenguaje**: TypeScript 5.9
- **Estilos**: Tailwind CSS 3.4
- **Componentes UI**: Shadcn UI (Radix UI) + Lucide React (Iconos)
- **Gráficos**: Recharts 3.8
- **Enrutamiento**: React Router DOM 7.13
- **Manejo de Formularios**: React Hook Form + Zod (Validación)

### 1.2 Backend & Base de Datos
- **BaaS**: Supabase (PostgreSQL)
- **Cliente**: `@supabase/supabase-js` 2.99
- **Base de datos local (Legacy/Soporte)**: IndexedDB (`idb` 8.0)

### 1.3 Herramientas de Reportes
- **Generación de Excel**: `exceljs` 4.4
- **Generación de PDF**: `jspdf` + `jspdf-autotable`
- **Manejo de CSV**: `papaparse` 5.5

---

## 2. Arquitectura del Proyecto

El proyecto sigue un patrón de **Screaming Architecture** (Arquitectura por Funcionalidades/Módulos).

- Todo el código de negocio vive en `src/features/`.
- Cada módulo es autónomo y contiene sus propios:
  - `components/` (UI local)
  - `services/` (Llamadas a Supabase o lógicas de datos)
  - Vistas principales (`.tsx`)

---

## 3. Infraestructura de Datos (Supabase)
Las tablas principales detectadas en el ecosistema (basado en el código fuente):
- `itinerario_enlaces`: Mapeo de Enlaces Regionales y las Infoplazas asignadas a su ruta.
- `catalogo_infoplazas`: Maestro de Infoplazas (nombres, códigos, ubicaciones).
- `cognito_registros`: Registros en bruto importados del sistema Cognito (control de visitas físicas).
- Tablas satélites para módulos específicos (Mesas de Transformación, Servicio Social, Radar Conectividad).

---

## 4. Convenciones Críticas
- **No superar 300 líneas por archivo**: Si un componente crece, refactorizar dividiéndolo en partes más pequeñas dentro de `features/modulo/components/`.
- **UI Consistente**: Todo nuevo componente visual debe armarse usando Shadcn y Tailwind. No usar CSS crudo en `index.css` salvo para variables globales.
- **Consultas a BD**: Toda llamada a Supabase debe estar en la carpeta `services/` del módulo correspondiente, nunca embebida directamente en el componente visual.
### 3.1 Snapshots y Persistencia Histórica
- `meta_4_snapshots`: Implementado para la Meta 4 (Cumplimiento de Rutas). Conserva un historial ("fotos") por mes de la cantidad de Infoplazas (`total_ip`) asignadas a cada enlace. Esto permite agregar o quitar rutas en el mes actual sin alterar retrospectivamente las metas y porcentajes de los meses anteriores.
- `meta_30_snapshots`: Funcionalidad similar que almacena el conteo mensual de las infoplazas que superaron el 30% de cumplimiento.
