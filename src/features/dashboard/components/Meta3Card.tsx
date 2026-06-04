import React from 'react';
import { Link } from 'react-router-dom';
import { Network, ArrowRight } from 'lucide-react';
import { DonutChart } from '@/components/ui/donut-chart';
import type { MetaItem } from '@/components/MetaCard';

interface Meta3CardProps {
  meta: MetaItem;
}

/**
 * Meta3Card - Card para Mesas de Transformación
 * Usa token #f59e0b (naranja) para mantener consistencia visual
 */
export const Meta3Card: React.FC<Meta3CardProps> = ({ meta }) => {
  const color = '#f59e0b'; // naranja
  const successColor = '#059669'; // verde para completado

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color }}>
            <Network className="w-5 h-5" />
            <h4 className="font-bold text-on-surface">Mesas de Transformación</h4>
          </div>
          <span 
            className="text-xs font-bold px-2 py-0.5 rounded-full" 
            style={{ color, backgroundColor: `${color}20` }}
          >
            Meta 3
          </span>
        </div>
        <DonutChart 
          percentage={meta.progreso} 
          color="orange" 
          aria-label={`Progreso de Mesas de Transformación: ${meta.progreso}%`} 
        />
      </div>
      <div className="space-y-2">
        {meta.regiones?.map((region) => {
          const pct = region.avance;
          const isCompletado = pct >= 100;
          return (
            <div key={region.region} className="p-3 rounded-lg bg-surface-container-low">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-on-surface">{region.region}</span>
                <span className="text-sm font-bold" style={{ color }}>
                  {region.completadas}/{region.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all" 
                  style={{ 
                    width: `${Math.min(pct, 100)}%`, 
                    backgroundColor: isCompletado ? successColor : color 
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end mt-4">
        <Link 
          className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" 
          style={{ color }} 
          to="/mesas"
          aria-label="Ver más detalles de Mesas de Transformación"
        >
          Ver más <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
