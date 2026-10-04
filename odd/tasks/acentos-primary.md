# Map interactive indigo/blue accents to --primary

Branch: feat/accents-to-primary
Rule: only interactive accents (buttons, links, action icons, focus, active tabs, hover rows). Keep status colors, chart/KPI series colors and the dark sidebar untouched.

Mapping: text-indigo/blue-500..800 -> text-primary; bg-indigo/blue-600 hover:bg-*-700 -> bg-primary hover:bg-primary/90 text-primary-foreground; bg/hover:bg *-50/100 -> bg-primary/10 (or /5); border-*-200 -> border-primary/20; focus:ring-*-300 -> focus:ring-primary/30.

## Tasks
- [x] 1. Visitas-Cognitos: CognitoView, TablaMensual, IncidenciasView (Ver button), IncidenciaDetalleModal (line 137 button only)
- [x] 2. Mesas: MesasView, MesaForm
- [x] 3. Auditoria: GestionInfoplazasView, InfoplazasCatalogTable, ItinerarioCard, PlanVisitasView (non-series), RutaUploader
- [x] 4. Servicio Social + shared: ServicioSocialView button, ModalTaller submit, StudentTrackingTable line 132, reme-loader, MetaCard link
- [x] 5. Verify: tsc, rg residual list reviewed, commit evidence

## Evidence
- abc1568 visitas-cognitos
- 542ff70 mesas
- 9639262 auditoria
- ee036ca servicio-social + shared (includes StudentsTable split, needed to pass the 300-line pre-commit hook)
- Native review approved per candidate; tsc passes.
- Left untouched on purpose: status colors, chart/KPI series, dark sidebar, static display colors.
