import React from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { DonutChart } from '@/components/ui/donut-chart';
import { buildMesValorMap, buildCuatrimestreData } from './utils';

interface Meta2CardProps {
  historial: Array<{
    mes_nombre: string;
    ip_sobre_30: number;
  }>;
}

/**
 * Card de Cumplimiento 30% (Meta 2)
 * Muestra progreso por cuatrimestres
 */
export const Meta2Card: React.FC<Meta2CardProps> = ({ historial }) => {
  // Construir mapa de IPs por mes
  const ipPorMes = buildMesValorMap(historial, 'ip_sobre_30');

  // Calcular progreso anual
  const incrC1 = historial.filter(h => 
    ['Enero', 'Febrero', 'Marzo', 'Abril'].includes(h.mes_nombre)
  ).reduce((sum, h, i, arr) => {
    if (i === 0) return sum;
    const prev = arr[i - 1].ip_sobre_30;
    return sum + Math.max(0, h.ip_sobre_30 - prev);
  }, 0);

  const incrC2 = historial.filter(h => 
    ['Mayo', 'Junio', 'Julio', 'Agosto'].includes(h.mes_nombre)
  ).reduce((sum, h, i, arr) => {
    if (i === 0) return sum;
    const prev = arr[i - 1].ip_sobre_30;
    return sum + Math.max(0, h.ip_sobre_30 - prev);
  }, 0);

  const incrC3 = historial.filter(h => 
    ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].includes(h.mes_nombre)
  ).reduce((sum, h, i, arr) => {
    if (i === 0) return sum;
    const prev = arr[i - 1].ip_sobre_30;
    return sum + Math.max(0, h.ip_sobre_30 - prev);
  }, 0);

  const incrTotal = incrC1 + incrC2 + incrC3;
  const progresoAnual = Math.round((incrTotal / 95) * 100);

  // Datos de cuatrimestres para UI
  const cuats = buildCuatrimestreData(ipPorMes);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#b4005d]"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'rgb(180 0 93)' }}>
            <ClipboardCheck className="w-5 h-5" style={{ color: 'rgb(180 0 93)' }} />
            <h4 className="font-bold text-lg text-on-surface">Cumplimiento 30%</h4>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgb(180 0 93 / 0.1)', color: 'rgb(180 0 93)' }}>
            Meta 2
          </span>
          <p className="text-sm text-outline mt-2">Incrementos por cuatrimestre vs meta de 31.66 IPs</p>
        </div>
        <DonutChart percentage={progresoAnual} color="secondary" size="md" />
      </div>
      
      {/* Progreso por Cuatrimestre */}
      <div className="space-y-3">
        {cuats.map((q) => (
          <div key={q.nombre} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low">
            <div className={`w-12 text-center ${!q.isActivo && !q.isCompletado ? 'opacity-40' : ''}`}>
              <p className="text-lg font-black" style={{ color: q.isActivo ? '#b4005d' : '#9ca3af' }}>
                {q.nombre}
              </p>
              <p className="text-xs text-outline">{q.meses}</p>
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between text-xs text-outline mb-1">
                <span>{q.incremento.toFixed(1)} / 31.66 incrementos</span>
                <span style={{ color: q.isCompletado ? '#059669' : q.estaAtrasado ? '#dc2626' : '#b4005d' }}>
                  {q.isCompletado ? '✓' : q.isActivo ? `${q.pct}%` : '-'}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${!q.isActivo && !q.isCompletado ? 'opacity-30' : ''}`}
                  style={{ 
                    width: `${Math.min(q.pct, 100)}%`, 
                    backgroundColor: q.isCompletado ? '#059669' : q.estaAtrasado ? '#dc2626' : '#b4005d'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="w-20 text-right">
              {q.isCompletado ? (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Completado</span>
              ) : q.estaAtrasado ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Atrasado</span>
              ) : q.isActivo ? (
                <span className="text-xs font-bold text-[#b4005d] bg-pink-50 px-2 py-1 rounded-full">En curso</span>
              ) : (
                <span className="text-xs font-bold text-gray-400 px-2 py-1 rounded-full">Pendiente</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end mt-4">
        <a className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#b4005d' }} href="/visitas-incidencias">
          Ver más <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
