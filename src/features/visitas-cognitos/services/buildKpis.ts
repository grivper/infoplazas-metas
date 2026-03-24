import { UNIVERSO } from '@/lib/constants';

interface KpiItem {
  title: string;
  value: number;
  desc: string;
  color: 'indigo' | 'slate' | 'rose' | 'amber' | 'emerald';
}

/**
 * Construye los KPIs para mostrar en las tarjetas superiores.
 * Calcula: Con Datos, Sin Datos, En Riesgo, 10-30%, Sobre 30%.
 */
export function buildKpis(datos: { 
  ipEnRiesgo?: number; 
  ipSobre30?: number; 
  totalIP?: number; 
  mesActual?: string 
} | null): KpiItem[] {
  const { ipEnRiesgo = 0, ipSobre30 = 0, totalIP = 0, mesActual = '' } = datos || {};
  const ipEntre10y30 = UNIVERSO - ipEnRiesgo - ipSobre30;
  const ipSinDatos = UNIVERSO - totalIP;
  
  return [
    { title: 'Con Datos', value: totalIP, desc: 'Reportaron', color: 'indigo' },
    { title: 'Sin Datos', value: ipSinDatos, desc: 'Sin reportar', color: 'slate' },
    { title: 'En Riesgo', value: ipEnRiesgo, desc: '< 10%', color: 'rose' },
    { title: '10-30%', value: ipEntre10y30, desc: 'Por mejorar', color: 'amber' },
    { title: 'Sobre 30%', value: ipSobre30, desc: mesActual, color: 'emerald' },
  ];
}
