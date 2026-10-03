import React from 'react';
import { Trash2, Calendar, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ItinerarioEnlace } from '../services/cruceVisitas';

interface ItinerarioCardProps {
  it: ItinerarioEnlace;
  onEliminar: (enlace: string) => void;
}

/**
 * Tarjeta de un enlace: progreso del mes, días de ruta e infoplazas semaforizadas.
 */
export const ItinerarioCard: React.FC<ItinerarioCardProps> = ({ it, onEliminar }) => {
  return (
    <Card className="border border-border/80 shadow-sm break-inside-avoid bg-surface-container-lowest hover:border-indigo-200 transition-colors">

      {/* NIVEL 1: TARJETA DEL ENLACE + PROGRESS BAR */}
      <CardHeader className="bg-surface-container-low/50 border-b border-border/50 py-4 px-5">
        <div className="flex flex-row items-start justify-between mb-3">
          <div>
            <CardTitle className="text-lg font-bold text-on-surface flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              {it.enlace}
            </CardTitle>
            <CardDescription className="mt-1 font-medium text-on-surface-variant">
              {it.visitadasUnicas} / {it.totalInfoplazas} IPs visitadas este mes
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEliminar(it.enlace)} className="hover:bg-rose-50 rounded-full h-8 w-8 transition-colors -mt-1 -mr-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
          </Button>
        </div>

        {/* Progress Bar Dinámica en HTML Puro / Tailwind */}
        <div className="relative w-full bg-surface-container-highest rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ${it.pct >= 95 ? 'bg-emerald-500' : it.pct > 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(it.pct, 100)}%` }}
          />
          <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-slate-400/50 z-10" title="Meta: 95%"></div>
        </div>

        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className={it.pct >= 95 ? 'text-emerald-600' : 'text-outline'}>{it.pct}% Completado</span>
          {it.pct >= 95 && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Meta Alcanzada</span>}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {it.dias.map((d, index) => (
            <div key={`${d.diaRuta}-${index}`} className="p-5 hover:bg-surface-container-low/40 transition-colors">

              {/* NIVEL 2: FILA DIARIA */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-outline" />
                <h3 className="text-sm font-bold text-on-surface">
                  {d.diaSemana ? `${d.diaSemana} — ${d.diaRuta}` : d.diaRuta}
                </h3>
              </div>

              {/* NIVEL 3: INFOPLAZAS SEMAFORIZADAS */}
              <div className="flex flex-wrap gap-2 pl-6">
                {d.infoplazas.map(ip => (
                  <Badge
                    key={ip.nombre}
                    variant="secondary"
                    className={`
                      py-1 px-3 shadow-sm border font-medium flex items-center gap-1.5 transition-colors
                      ${ip.visitada
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}
                    `}
                  >
                    {ip.visitada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {ip.nombre}
                  </Badge>
                ))}
              </div>

            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
