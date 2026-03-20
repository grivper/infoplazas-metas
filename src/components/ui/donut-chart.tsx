import React from 'react';

interface DonutChartProps {
  percentage: number;
  color: 'primary' | 'secondary' | 'orange' | 'green';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<string, { stroke: string; bg: string }> = {
  primary: { stroke: '#2a4bd9', bg: '#eff1f2' },
  secondary: { stroke: '#b4005d', bg: '#eff1f2' },
  orange: { stroke: '#f59e0b', bg: '#eff1f2' },
  green: { stroke: '#00694c', bg: '#eff1f2' },
};

const sizeConfig = {
  sm: { size: 64, strokeWidth: 6 },
  md: { size: 96, strokeWidth: 8 },
  lg: { size: 112, strokeWidth: 10 },
};

/**
 * DonutChart - Gráfico circular estilo donut
 * Soporta colores: primary, secondary, orange, green
 * Soporta tamaños: sm (64px), md (96px), lg (112px)
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  percentage,
  color,
  size = 'md',
}) => {
  const colors = colorMap[color] || colorMap.primary;
  const { size: svgSize, strokeWidth } = sizeConfig[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className={`font-extrabold font-headline ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}
          style={{ color: colors.stroke }}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export default DonutChart;
