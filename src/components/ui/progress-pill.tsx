import React from 'react';

/**
 * Props para ProgressPill
 */
interface ProgressPillProps {
  value: number;
  max?: number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Mapeo de colores
 */
const colorMap = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
};

/**
 * Mapeo de tamaños
 */
const sizeMap = {
  sm: 'h-1.5',
  md: 'h-3',
  lg: 'h-4',
};

/**
 * ProgressPill - Barra de progreso estilo pill (rounded-full)
 * - Barra de color con efecto de brillo
 * - Track gris claro
 */
export const ProgressPill: React.FC<ProgressPillProps> = ({
  value,
  max = 100,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-xs font-medium text-on-surface">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div 
        className={`w-full ${sizeMap[size]} rounded-full overflow-hidden bg-surface-container-highest`}
      >
        <div
          className={`h-full ${colorMap[color]} rounded-full relative transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        >
          {/* Efecto de brillo */}
          <div className="absolute top-0 right-0 w-2 h-full bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default ProgressPill;
