# Product Requirements Document (PRD) — Metas Infoplazas

## Estado
- **Versión**: 1.0
- **Fecha**: 2026-06-05

---

## 1. Visión del Producto
Sistema centralizado para la Subdirección de Operaciones que permite medir, monitorear y reportar el cumplimiento de las "Metas 2026" establecidas para los Enlaces Regionales de las Infoplazas (Coclé, Herrera, Los Santos, etc.).

## 2. Objetivos de Negocio (Las 5 Metas)
El sistema debe calcular automáticamente en tiempo real las siguientes metas:

1. **Meta 1 (Servicio Social)**: Implementar programa universitario. KPIs: 5 universidades, 60 estudiantes, 140 talleres, 600 usuarios.
2. **Meta 2 (Participación)**: Incrementar participación en 29 Infoplazas al 30% y uso de Cognitos al 100%.
3. **Meta 3 (Mesas de Transformación)**: Completar 21 mesas en la regional de Los Santos (Coclé: 6, Los Santos: 9, Herrera: 6).
4. **Meta 4 (Visitas Territoriales / Auditoría)**: Cumplir con el plan de visitas a Infoplazas al 95% mensual. El esfuerzo mide cobertura territorial cruzando itinerarios asignados contra registros importados de Cognito.
5. **Meta 5 (Soporte y Conectividad)**: Monitoreo de KPAX. 100% de equipos reportando y 100% de licencias activas.

## 3. Funcionalidades Clave

### 3.1 Carga de Datos (Ingesta)
- Importación de datos crudos (CSV) del sistema de visitas físicas "Cognito".
- Carga de planificaciones e itinerarios de visitas.

### 3.2 Dashboard de Monitoreo (KPIs)
- Pantalla principal unificada que consolida el avance de las 5 metas.
- Tarjetas visuales (Semaforización) para alertar sobre brechas de cumplimiento.
- Lógica de "Esfuerzo Territorial" vs "Esfuerzo Empleado" (implementado en V1.1 para la Meta 4).

### 3.3 Generación de Reportes
- Emisión de reportes duros ejecutivos en Excel (`exceljs`).
- Emisión de comprobantes o actas en PDF (`jspdf`).

## 4. Usuarios del Sistema
- **Enlaces Regionales**: Suben sus datos y auditan su propio progreso.
- **Subdirección de Operaciones (Gerencia)**: Consume el Dashboard general y descarga reportes de rendición de cuentas.