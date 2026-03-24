import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { DonutChart } from '@/components/ui/donut-chart';
import type { MetaItem } from '@/components/MetaCard';

interface Meta1CardProps {
  meta: MetaItem;
}

/**
 * Meta1Card - Card para Servicio Social
 * Usa tokens CSS de shadcn/ui para colores
 */
export const Meta1Card: React.FC<Meta1CardProps> = ({ meta }) => {
  const color = 'var(--primary)';

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color }}>
            <Users className="w-5 h-5" />
            <h4 className="font-bold text-on-surface">Servicio Social</h4>
          </div>
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full" 
            style={{ backgroundColor: `${color}20`, color }}
          >
            Meta 1
          </span>
        </div>
        <DonutChart 
          percentage={meta.progreso} 
          color="primary" 
          aria-label={`Progreso de Servicio Social: ${meta.progreso}%`} 
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {meta.metricas.slice(0, 4).map((m, idx) => {
          const pct = Math.round((m.valor / m.meta) * 100);
          return (
            <div key={idx} className="p-3 rounded-lg bg-surface-container-low">
              <p className="text-sm font-medium text-on-surface mb-2">{m.label}</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black" style={{ color }}>{m.valor}</p>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-outline mb-1">
                    <span>/ {m.meta}</span>
                    <span style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Link 
          className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" 
          style={{ color }} 
          to="/servicio-social"
          aria-label="Ver más detalles de Servicio Social"
        >
          Ver más <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
