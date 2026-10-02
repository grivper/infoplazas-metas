# Estructura de Carpetas — Metas Infoplazas

## Estado
- **Versión**: 1.0
- **Fecha**: 2026-06-05

---

## 1. Patrón Arquitectónico
El proyecto utiliza **Feature-Sliced Design / Screaming Architecture**. En lugar de agrupar por tipo técnico (todos los componentes juntos, todos los servicios juntos), se agrupa por **dominio de negocio** en `src/features/`.

## 2. Árbol de Directorios

```text
src/
├── core/                   # Núcleo de la aplicación
│   ├── hooks/              # Hooks globales (ej. useUserProfile)
│   ├── LayoutBento.tsx     # Layout principal de la app
│   └── navigation.ts       # Definición del menú y rutas
│
├── components/             # Componentes compartidos y Design System
│   ├── ui/                 # Componentes de Shadcn UI generados
│   └── MetaCard.tsx        # Tarjetas de KPI comunes
│
├── features/               # Módulos de Negocio (Screaming Architecture)
│   ├── auditoria/          # Rutas de enlaces, control de itinerarios y visitas planificadas
│   ├── dashboard/          # Pantalla principal, consolidación de Meta 1 a 5
│   ├── informe/            # Motor de generación de reportes (Excel/PDF)
│   ├── mesas/              # Meta: Mesas de Transformación (Coclé, Herrera, Los Santos)
│   ├── radar-conectividad/ # Monitoreo de equipos y licencias (KPAX)
│   ├── servicio-social/    # Meta: Capacitaciones, universidades y usuarios finales
│   └── visitas-cognitos/   # Carga y parseo de reportes en crudo del sistema Cognito
│
├── lib/                    # Librerías globales y utilidades puras
│   ├── supabase.ts         # Inicialización del cliente Supabase
│   ├── utils.ts            # Utilidades generales (ej. cn para Tailwind)
│   └── constants.ts        # Constantes globales
│
└── views/                  # Vistas sueltas de nivel root (Dashboard fallback, Login)
```

## 3. Reglas de Importación
- Un módulo en `features/A` no debería importar directamente servicios de `features/B`. Si se necesita cruzar datos, debe unificarse en el `dashboard` o abstraerse a un hook compartido.
- Los componentes de `src/components/ui` son de uso libre para cualquier módulo.
- La lógica de acceso a datos siempre va dentro de `features/[modulo]/services/`.