import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Una métrica individual dentro de una meta
 */
export interface MetaMetrica {
  label: string;
  valor: number;
  meta: number;
  unidad?: string;
}

/**
 * Datos de una meta para el dashboard
 */
export interface MetaItem {
  id: string;
  titulo: string;
  numero: number;
  progreso: number; // 0-100
  metricas: MetaMetrica[];
  color: string;
  link: string;
}

interface MetaCardProps {
  meta: MetaItem;
}

/**
 * MetaCard: Componente que muestra el progreso de una meta con sus métricas
 */
export const MetaCard: React.FC<MetaCardProps> = ({ meta }) => {
  // Determinar color de la barra según progreso
  const getBarraColor = () => {
    if (meta.progreso >= 80) return 'bg-emerald-500';
    if (meta.progreso >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Color del badge
  const getBadgeColor = () => {
    if (meta.progreso >= 80) return 'bg-emerald-100 text-emerald-700';
    if (meta.progreso >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Meta {meta.numero}
            </span>
            <div className={`w-1 h-6 rounded-full ${meta.color}`} />
          </div>
          <Badge className={`text-xs font-medium ${getBadgeColor()}`}>
            {meta.progreso}%
          </Badge>
        </div>
        <CardTitle className="text-lg font-bold text-slate-800 mt-1">
          {meta.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Barra de progreso */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getBarraColor()}`}
            style={{ width: `${Math.min(meta.progreso, 100)}%` }}
          />
        </div>

        {/* Métricas */}
        <div className="space-y-2">
          {meta.metricas.map((metrica, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{metrica.label}</span>
              <span className="font-medium text-slate-800">
                {metrica.valor}
                {metrica.meta > 0 && (
                  <span className="text-slate-400 text-xs">/{metrica.meta}</span>
                )}
                {metrica.unidad && (
                  <span className="text-slate-400 text-xs"> {metrica.unidad}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Link a la vista */}
        <Link
          to={meta.link}
          className="flex items-center justify-end gap-1 mt-4 text-sm text-indigo-600 hover:text-indigo-700"
        >
          Ver más
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default MetaCard;
