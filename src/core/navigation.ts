import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Network, 
  MapPin, 
  Radar,
  Settings 
} from 'lucide-react';

/**
 * Rutas del sidebar
 * Compartido entre LayoutBento y cualquier otro componente que necesite acceso
 */
export const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Servicio Social', href: '/servicio-social', icon: Users },
  { name: 'Cumplimiento 30%', href: '/visitas-incidencias', icon: ClipboardCheck },
  { name: 'Mesas de Transformación', href: '/mesas', icon: Network },
  { name: 'Cumplimiento de Rutas', href: '/auditoria', icon: MapPin },
  { name: 'Radar Kpax', href: '/radar', icon: Radar },
  { name: 'Gestión de Infoplazas', href: '/auditoria/infoplazas', icon: Settings },
];

/**
 * Verifica si una ruta está activa
 */
export const isRouteActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }
  // Para rutas padre como /auditoria, NO activar si hay subrutas como /auditoria/infoplazas
  if (pathname.startsWith(href + '/')) {
    return false;
  }
  return pathname === href;
};
