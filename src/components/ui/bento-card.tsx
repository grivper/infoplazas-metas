import React, { type ReactNode } from 'react';
import { CardContent } from './card';

/**
 * Colores disponibles para la barra superior de la card
 */
type BentoCardColor = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error';

/**
 * Props para BentoCard
 */
interface BentoCardProps {
  children: ReactNode;
  color?: BentoCardColor;
  className?: string;
  hoverable?: boolean;
  colSpan?: 'full' | '1/2' | '1/3';
}

/**
 * Mapeo de colores a clases CSS
 */
const colorMap: Record<BentoCardColor, string> = {
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
