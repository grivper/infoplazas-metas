import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Network, 
  MapPin, 
  Radar 
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
];

/**
 * Verifica si una ruta está activa
 */
export const isRouteActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(href);
};
