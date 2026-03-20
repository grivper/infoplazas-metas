import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EnlaceRutaData } from '@/services/dashboard/meta4-rutas';

interface Meta4CardProps {
  enlaces: EnlaceRutaData[];
}

/**
 * Card de Cumplimiento de Rutas (Meta 4)
 * Muestra métricas por enlace
 */
export const Meta4Card: React.FC<Meta4CardProps> = ({ enlaces }) => {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#00694c]"></div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1" style={{ color: '#00694c' }}>
          <MapPin className="w-5 h-5" />
          <h4 className="font-bold text-on-surface">Cumplimiento de Rutas</h4>
        </div>
        <span className="text-xs font-bold inline-block py-0.5 px-2 rounded-full" style={{ color: '#00694c', backgroundColor: 'rgba(0,105,76,0.1)' }}>
          Meta 4
        </span>
      </div>
      
      {/* UNA TARJETA POR ENLACE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {enlaces.map((enlace) => {
          const { 
            enlace: nombre, 
            totalIp, 
            metaMinima, 
            mesActual, 
            tasaExitoYtd,
            mesesCumplidos,
            mesesEvaluados,
            historial 
          } = enlace;
          
          const cumple = mesActual.cumplimiento >= 95;
          
          return (
            <div 
              key={nombre} 
              className="p-3 rounded-lg bg-surface-container-low border-l-4"
              style={{ borderColor: '#00694c' }}
            >
              {/* Header del enlace */}
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm text-on-surface truncate">{nombre}</span>
                <span 
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: cumple ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.1)',
                    color: cumple ? '#059669' : '#dc2626'
                  }}
                >
                  {cumple ? '✓ Cumple' : '❌ Incumple'}
                </span>
              </div>
              
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-white/50 rounded">
                  <p className="text-xs text-outline mb-0.5">Meta Mínima</p>
                  <p className="text-lg font-black" style={{ color: '#00694c' }}>
                    {metaMinima}
                    <span className="text-xs font-normal text-outline"> / {totalIp} IPs</span>
                  </p>
                </div>
                
                <div className="p-2 bg-white/50 rounded">
                  <p className="text-xs text-outline mb-0.5">Cumplimiento {mesActual.nombreMes}</p>
                  <p className="text-lg font-black" style={{ color: '#00694c' }}>
                    {mesActual.cumplimiento}%
                  </p>
                </div>
              </div>
              
              {/* Barra de cumplimiento mensual */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-outline mb-1">
                  <span>Visitadas: {mesActual.visitadas}</span>
                  <span>Meta: {metaMinima}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(mesActual.cumplimiento, 100)}%`, 
                      backgroundColor: cumple ? '#00694c' : '#ea580c'
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Brecha */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-outline">Brecha:</span>
                {mesActual.brecha > 0 ? (
                  <span className="font-bold text-red-600">
                    -{mesActual.brecha} visitas faltantes
                  </span>
                ) : mesActual.brecha === 0 ? (
                  <span className="font-bold text-green-600">✓ Exacto</span>
                ) : (
                  <span className="font-bold text-green-600">
                    +{Math.abs(mesActual.brecha)} de más
                  </span>
                )}
              </div>
              
              {/* Tasa Éxito YTD */}
              <div className="p-2 bg-white/50 rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-outline">Tasa Éxito YTD</p>
                    <p className="text-xl font-black" style={{ color: '#00694c' }}>
                      {tasaExitoYtd}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-outline">
                      {mesesCumplidos}/{mesesEvaluados} meses
                    </p>
                    <p className="text-xs font-medium" style={{ color: '#00694c' }}>
                      cumplan 95%
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Historial YTD */}
              {historial && historial.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-outline mb-2">Historial YTD</p>
                  <div className="flex flex-wrap gap-2">
                    {historial.map((m, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ 
                          backgroundColor: m.cumple ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)'
                        }}
                        title={`${m.mes}: ${m.visitadas}/${m.metaMinima} IPs (${m.cumplimiento}%)`}
                      >
                        <span className="font-medium">{m.mes}</span>
                        <span className="text-outline">·</span>
                        <span className="font-bold" style={{ color: m.cumple ? '#059669' : '#dc2626' }}>
                          {m.visitadas}/{m.metaMinima}
                        </span>
                        <span style={{ color: m.cumple ? '#059669' : '#dc2626' }}>
                          {m.cumple ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end mt-4">
        <Link className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#00694c' }} to="/visitas-incidencias">
          Ver más <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
