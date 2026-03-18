import { MonitorSmartphone, Wifi, AlertTriangle, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RadarKpaxKpis } from '../types/kpaxUnificado';

interface RadarKpisProps {
  kpis: RadarKpaxKpis;
}

/**
 * Componente de KPIs para el Radar KPAX Unificado
 * Muestra: Total, Online, Crítico, Agentes Caídos
 */
export const RadarKpis: React.FC<RadarKpisProps> = ({ kpis }) => {
  const { total, online, critico, agentesCaidos } = kpis;
  const pctCritico = total > 0 ? ((critico / total) * 100).toFixed(1) : '0';

  const cards = [
    {
      title: 'Total Dispositivos',
      value: total,
      subtitle: 'Enrolados en KPAX',
      icon: <MonitorSmartphone className="w-4 h-4 text-indigo-500 mr-2" />,
      color: 'bg-indigo-500'
    },
    {
      title: 'En Línea',
      value: online,
      subtitle: '< 24 Horas de Inactividad',
      icon: <Wifi className="w-4 h-4 text-emerald-500 mr-2" />,
      color: 'bg-emerald-500'
    },
    {
      title: 'Crítico',
      value: `${critico} (${pctCritico}%)`,
      subtitle: '≥ 1 Semana Inactivo',
      icon: <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" />,
      color: 'bg-rose-500'
    },
    {
      title: 'Ag. Caídos',
      value: agentesCaidos,
      subtitle: 'Agentes Sin Respuesta',
      icon: <WifiOff className="w-4 h-4 text-amber-500 mr-2" />,
      color: 'bg-amber-500'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(card => (
        <Card 
          key={card.title} 
          className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white"
        >
          <div className={`h-1 ${card.color}`} />
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-600 font-semibold flex items-center">
              {card.icon}
              {card.title}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
