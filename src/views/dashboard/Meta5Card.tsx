import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { DonutChart } from '@/components/ui/donut-chart';
import type { MetaItem } from '@/components/MetaCard';

interface Meta5CardProps {
  meta: MetaItem;
}

/**
 * Meta5Card - Card para KPAX
 * Usa tokens CSS de shadcn/ui para colores
 */
export const Meta5Card: React.FC<Meta5CardProps> = ({ meta }) => {
  const color = 'var(--secondary)'; // rosa
  const successColor = '#00694c'; // verde
  const warningColor = 'var(--secondary)'; // rojo

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color }}>
            <Activity className="w-5 h-5" />
            <h4 className="font-bold text-lg text-on-surface">KPAX</h4>
          </div>
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full" 
            style={{ backgroundColor: `${color}20`, color }}
          >
            Meta 5
          </span>
        </div>
        <DonutChart 
          percentage={meta.metricas[3]?.valor || meta.progreso} 
          color="secondary" 
          aria-label={`Progreso de KPAX: ${meta.progreso}%`} 
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end p-3 rounded-xl bg-muted border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-500">Equipos Online</p>
            <p className="text-2xl font-black text-slate-900">{meta.metricas[0]?.valor}</p>
          </div>
          <Activity className="w-5 h-5" style={{ color: successColor }} />
        </div>
        <div className="flex justify-between items-end p-3 rounded-xl bg-muted border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-500">Conectividad del Mes</p>
            <p className="text-2xl font-black text-slate-900">{meta.metricas[1]?.valor}%</p>
          </div>
          <TrendingUp className="w-5 h-5" style={{ color: successColor }} />
        </div>
        <div className="flex justify-between items-end p-3 rounded-xl bg-muted border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-500">Equipos Críticos</p>
            <p className="text-2xl font-black text-slate-900">{meta.metricas[2]?.valor || 0}</p>
          </div>
          <MapPin className="w-5 h-5" style={{ color: warningColor }} />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Link 
          className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" 
          style={{ color }} 
          to="/radar"
          aria-label="Ver más detalles de KPAX"
        >
          Ver más <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
