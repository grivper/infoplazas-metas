import { UNIVERSO } from '@/lib/constants';

interface KpiItem {
  title: string;
  value: number;
  desc: string;
  color: string;
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
    { title: 'Con Datos', value: totalIP, desc: 'Reportaron', color: 'bg-indigo-500' },
    { title: 'Sin Datos', value: ipSinDatos, desc: 'Sin reportar', color: 'bg-slate-400' },
    { title: 'En Riesgo', value: ipEnRiesgo, desc: '< 10%', color: 'bg-rose-500' },
    { title: '10-30%', value: ipEntre10y30, desc: 'Por mejorar', color: 'bg-amber-500' },
    { title: 'Sobre 30%', value: ipSobre30, desc: mesActual, color: 'bg-emerald-500' },
  ];
}
