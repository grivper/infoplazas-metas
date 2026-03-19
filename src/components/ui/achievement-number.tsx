import React from 'react';
import { type ReactNode } from 'react';

/**
 * Props para AchievementNumber
 */
interface AchievementNumberProps {
  children: ReactNode;
  color?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Mapeo de colores
 */
const colorMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
  warning: 'text-amber-500',
  error: 'text-rose-500',
  default: 'text-on-surface',
};

/**
 * Mapeo de tamaños
 */
const sizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

/**
 * AchievementNumber - Número grande estilo editorial
 * Tipografía Plus Jakarta Sans para impacto visual
 */
export const AchievementNumber: React.FC<AchievementNumberProps> = ({
  children,
  color = 'default',
  size = 'lg',
  className = '',
}) => {
  return (
    <span 
      className={`
        font-black 
        font-headline 
        ${colorMap[color]} 
        ${sizeMap[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default AchievementNumber;
