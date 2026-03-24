import React, { type ReactNode } from 'react';
import { CardContent } from './card';

/**
 * Colores disponibles para la barra superior de la card
 */
type BentoCardColor = 
  | 'slate' 
  | 'indigo' 
  | 'violet' 
  | 'blue' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'purple'
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'warning' 
  | 'error';

/**
 * Props para BentoCard
 */
interface BentoCardProps {
  children?: ReactNode;
  color?: BentoCardColor;
  className?: string;
  hoverable?: boolean;
  colSpan?: 'full' | '1/2' | '1/3';
}

/**
 * Mapeo de colores a clases CSS
 */
const colorMap: Record<BentoCardColor, string> = {
  slate: 'bg-slate-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  purple: 'bg-purple-500',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
};

/**
 * Mapeo de colSpan a clases Tailwind
 */
const colSpanMap = {
  full: '',
  '1/2': 'md:col-span-2 lg:col-span-2',
  '1/3': 'lg:col-span-1',
};

/**
 * Variant simple - solo banda de color, sin efectos complejos
 */
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  color?: BentoCardColor;
  className?: string;
}

/**
 * StatCard con progress - para tarjetas con barra de progreso (ej: Servicio Social)
 */
interface StatCardWithProgressProps extends StatCardProps {
  progress?: number;      // Porcentaje de progreso (0-100)
  weight?: number;        // Peso en % para mostrar como badge
  showProgressBar?: boolean;
}

/**
 * StatCard - Tarjeta simple de estadísticas con banda de color
 * Estilo: sin borde, sombra suave, banda de color arriba
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  color = 'indigo',
  className = '',
}) => {
  return (
    <div className={`rounded-xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white ${className}`}>
      <div className={`h-1 ${colorMap[color!]}`} />
      <div className="p-6 pt-4 pb-4">
        <p className="text-sm text-slate-600 font-semibold flex items-center">
          {icon && <span className={`mr-2 ${colorMap[color!].replace('bg-', 'text-')}`}>{icon}</span>}
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
    </div>
  );
};

/**
 * StatCardWithProgress - Tarjeta con barra de progreso y badge de peso
 * Ideal para KPIs con meta y progreso (ej: Servicio Social)
 */
export const StatCardWithProgress: React.FC<StatCardWithProgressProps> = ({
  title,
  value,
  description,
  icon,
  color = 'indigo',
  className = '',
  progress = 0,
  weight,
  showProgressBar = true,
}) => {
  return (
    <div className={`rounded-xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white h-full ${className}`}>
      <div className={`h-1 ${colorMap[color!]}`} />
      <div className="p-6">
        {/* Header con título, peso e ícono */}
        <div className="flex flex-row items-center justify-between pb-2">
          <div className="tracking-tight text-sm font-medium text-slate-500">
            {title}
          </div>
          <div className="flex items-center gap-2">
            {weight !== undefined && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded bg-${color}-500 bg-opacity-20 text-${color}-700`}>
                {weight}%
              </span>
            )}
            {icon && (
              <div className={`p-2 rounded-lg bg-${color}-500 bg-opacity-10`}>
                <span className={`h-4 w-4 block text-${color}-500`}>{icon}</span>
              </div>
            )}
          </div>
        </div>
        {/* Valor principal */}
        <div className="text-2xl font-bold text-slate-800 mt-2">{value}</div>
        {/* Barra de progreso */}
        {showProgressBar && (
          <>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
              <div
                className={`bg-${color}-500 h-1.5 rounded-full`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{Number(progress).toFixed(2)}% de la meta anual</p>
          </>
        )}
        {description && !showProgressBar && (
          <p className="text-xs text-slate-400 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

/**
 * BentoCard - Card estilo "Polished Luminary"
 * - Barra de color arriba (en vez de borde)
 * - Sin borde, usa sombras suaves
 * - Hover effect con elevación sutil
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  color = 'primary',
  className = '',
  hoverable = true,
  colSpan = 'full',
}) => {
  return (
    <div 
      className={`
        bg-surface-container-lowest 
        rounded-xl 
        p-6 
        shadow-[0_12px_40px_rgba(44,47,48,0.06)] 
        relative 
        overflow-hidden 
        ${hoverable ? 'hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(44,47,48,0.1)]' : ''} 
        transition-all 
        duration-300
        ${colSpanMap[colSpan]}
        ${className}
      `}
    >
      {/* Barra de color arriba */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${colorMap[color]}`} />
      
      <CardContent className="pt-4 pb-0 px-0">
        {children}
      </CardContent>
    </div>
  );
};

export default BentoCard;
