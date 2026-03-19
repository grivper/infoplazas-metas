import React from 'react';

/**
 * Props para DonutChart
 */
interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'error';
  className?: string;
}

/**
 * Mapeo de colores a valores CSS
 */
const colorMap = {
  primary: { stroke: '#2a4bd9', bg: '#eff1f2' },
  secondary: { stroke: '#b4005d', bg: '#eff1f2' },
  tertiary: { stroke: '#00694c', bg: '#eff1f2' },
  warning: { stroke: '#f59e0b', bg: '#eff1f2' },
  error: { stroke: '#ef4444', bg: '#eff1f2' },
};

/**
 * DonutChart - Gráfico circular estilo donut
 * Usa CSS puro con conic-gradient (no requiere librería)
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  percentage,
  size = 96,
  strokeWidth = 8,
  color = 'primary',
  className = '',
}) => {
  const colors = colorMap[color];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* SVG Donut */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center content slot - se puede usar con children */}
      <div className="absolute inset-0 flex items-center justify-center" />
    </div>
  );
};

export default DonutChart;
