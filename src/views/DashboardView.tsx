import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  Network, 
  MapPin, 
  Activity,
  Download,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RemeLoader } from '@/components/ui/reme-loader';
import { Button } from '@/components/ui/button';
import { getDatosDashboard } from '@/services/dashboardDb';
import type { MetaItem } from '@/components/MetaCard';

/**
 * DonutChart con gradiente dinámico según percentage
 * @param size: 'sm' (64px), 'md' (96px, default), 'lg' (120px)
 */
const DonutChart: React.FC<{ percentage: number; color: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  percentage, 
  color,
  size = 'md'
}) => {
  const colorMap: Record<string, string> = {
    primary: '#2a4bd9',
    secondary: '#b4005d',
    orange: '#f59e0b',
    green: '#00694c'
  };
  const hexColor = colorMap[color] || colorMap.primary;
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-28 h-28'
  };
  const innerSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
      style={{ background: `conic-gradient(${hexColor} 0% ${percentage}%, #e8eaed ${percentage}% 100%)` }}
    >
      <div className={`bg-white ${innerSizes[size]} rounded-full flex items-center justify-center shadow-sm`}>
        <span className={`font-extrabold font-headline ${textSizes[size]}`} style={{ color: hexColor }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
};

/**
 * DashboardView - Copiado del template "Polished Luminary"
 */
export const DashboardView: React.FC = () => {
  const [metas, setMetas] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarMetas = async () => {
      try {
        setLoading(true);
        const datos = await getDatosDashboard();
        setMetas(datos);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    cargarMetas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RemeLoader size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-rose-600">{error}</p>
      </div>
    );
  }

  // Obtener datos por meta
  const meta1 = metas.find(m => m.id === 'meta-1'); // Servicio Social
  const meta2 = metas.find(m => m.id === 'meta-2'); // Cumplimiento 30%
  const meta3 = metas.find(m => m.id === 'meta-3'); // Mesas
  const meta4 = metas.find(m => m.id === 'meta-4'); // Rutas
  const meta5 = metas.find(m => m.id === 'meta-5'); // KPAX

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-black font-headline text-on-surface tracking-tight">
            Estado General de Metas
          </h3>
          <p className="text-on-surface-variant font-medium mt-1">
            Resumen ejecutivo del cumplimiento regional acumulado.
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 border-[#b4005d] text-[#b4005d] bg-pink-50 hover:bg-pink-100">
          <Download className="w-4 h-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Fila 1: Servicio Social + Cumplimiento 30% (50% cada uno) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Servicio Social (50%) */}
        {meta1 && (
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2a4bd9]"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 text-[#2a4bd9] mb-1">
                  <Users className="w-5 h-5" />
                  <h4 className="font-bold text-on-surface">Servicio Social</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#2a4bd9]/10 text-[#2a4bd9]">
                  Meta 1
                </span>
              </div>
              <DonutChart percentage={meta1.progreso} color="primary" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {meta1.metricas.slice(0, 4).map((m, idx) => {
                const pct = Math.round((m.valor / m.meta) * 100);
                return (
                  <div key={idx} className="p-3 rounded-lg bg-surface-container-low">
                    <p className="text-sm font-medium text-on-surface mb-2">{m.label}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-black" style={{ color: '#2a4bd9' }}>
                        {m.valor}
                      </p>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-outline mb-1">
                          <span>/ {m.meta}</span>
                          <span style={{ color: '#2a4bd9' }}>{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#2a4bd9' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Link className="text-xs font-bold text-[#2a4bd9] flex items-center gap-1 hover:gap-2 transition-all" to="/servicio-social">
                Ver más <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Card 2: Cumplimiento 30% (50%) */}
        {meta2 && meta2.historial && meta2.historial!.length > 0 && (() => {
        const historial = meta2.historial!;
        
        // Calcular progreso anual basado en incrementos
        const mesesC1 = ['Enero', 'Febrero', 'Marzo', 'Abril'];
        const mesesC2 = ['Mayo', 'Junio', 'Julio', 'Agosto'];
        const mesesC3 = ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const ipPorMes = new Map<string, number>();
        historial.forEach(h => ipPorMes.set(h.mes_nombre, h.ip_sobre_30));
        
        const calcularIncrementos = (meses: string[]): number => {
          let total = 0;
          for (let i = 1; i < meses.length; i++) {
            const ipActual = ipPorMes.get(meses[i]) || 0;
            const ipAnterior = ipPorMes.get(meses[i - 1]) || 0;
            total += Math.max(0, ipActual - ipAnterior);
          }
          return total;
        };
        
        const incrTotal = calcularIncrementos(mesesC1) + calcularIncrementos(mesesC2) + calcularIncrementos(mesesC3);
        const progresoAnual = Math.round((incrTotal / 95) * 100);
        
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
          {(() => {
            const metaCuatrimestre = 31.66;
            
            const incrC1 = calcularIncrementos(mesesC1);
            const incrC2 = calcularIncrementos(mesesC2);
            const incrC3 = calcularIncrementos(mesesC3);
            
            // Determinar cuatrimestre actual
            const hoy = new Date().getMonth();
            let cuatrimestreActual = 1;
            if (hoy >= 4 && hoy <= 7) cuatrimestreActual = 2;
            else if (hoy >= 8) cuatrimestreActual = 3;
            
            const cuats = [
              { nombre: 'C1', meses: 'Ene-Abr', incremento: incrC1, current: cuatrimestreActual === 1 },
              { nombre: 'C2', meses: 'May-Ago', incremento: incrC2, current: cuatrimestreActual === 2 },
              { nombre: 'C3', meses: 'Sep-Dic', incremento: incrC3, current: cuatrimestreActual === 3 },
            ];
            
            return (
              <div className="space-y-3">
                {cuats.map((q) => {
                  const pct = metaCuatrimestre > 0 ? Math.round((q.incremento / metaCuatrimestre) * 100) : 0;
                  const isCompletado = q.incremento >= metaCuatrimestre;
                  const isActivo = q.current;
                  const estaAtrasado = isActivo && q.incremento < metaCuatrimestre && q.incremento > 0;
                  
                  return (
                    <div key={q.nombre} className="flex items-center gap-4 p-3 rounded-lg bg-surface-container-low">
                      <div className={`w-12 text-center ${!isActivo && !isCompletado ? 'opacity-40' : ''}`}>
                        <p className="text-lg font-black" style={{ color: isActivo ? '#b4005d' : '#9ca3af' }}>
                          {q.nombre}
                        </p>
                        <p className="text-xs text-outline">{q.meses}</p>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-outline mb-1">
                          <span>{q.incremento.toFixed(1)} / {metaCuatrimestre.toFixed(1)} incrementos</span>
                          <span style={{ color: isCompletado ? '#059669' : estaAtrasado ? '#dc2626' : '#b4005d' }}>
                            {isCompletado ? '✓' : isActivo ? `${pct}%` : '-'}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${!isActivo && !isCompletado ? 'opacity-30' : ''}`}
                            style={{ 
                              width: `${Math.min(pct, 100)}%`, 
                              backgroundColor: isCompletado ? '#059669' : estaAtrasado ? '#dc2626' : '#b4005d'
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="w-20 text-right">
                        {isCompletado ? (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Completado</span>
                        ) : estaAtrasado ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Atrasado</span>
                        ) : isActivo ? (
                          <span className="text-xs font-bold text-[#b4005d] bg-pink-50 px-2 py-1 rounded-full">En curso</span>
                        ) : (
                          <span className="text-xs font-bold text-gray-400 px-2 py-1 rounded-full">Pendiente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          
          <div className="flex justify-end mt-4">
            <a className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#b4005d' }} href="/visitas-incidencias">
              Ver más <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        );
      })()}

      </div>

      {/* Fila 2: Cumplimiento de Rutas (SOLITA) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Card 4: Cumplimiento de Rutas - UNA TARJETA POR ENLACE */}
        {meta4 && (
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
              {meta4.enlaces?.map((enlace) => {
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
                      {/* Total IPs / Meta Mínima */}
                      <div className="p-2 bg-white/50 rounded">
                        <p className="text-xs text-outline mb-0.5">Meta Mínima</p>
                        <p className="text-lg font-black" style={{ color: '#00694c' }}>
                          {metaMinima}
                          <span className="text-xs font-normal text-outline"> / {totalIp} IPs</span>
                        </p>
                      </div>
                      
                      {/* % Cumplimiento */}
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
        )}

      </div>

      {/* Fila 3: Mesas + KPAX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 3: Mesa de Transformación */}
        {meta3 && (
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#f59e0b]"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1" style={{ color: '#f59e0b' }}>
                  <Network className="w-5 h-5" />
                  <h4 className="font-bold text-on-surface">Mesas de Transformación</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: '#f59e0b', backgroundColor: 'rgb(245 158 11 / 0.1)' }}>
                  Meta 3
                </span>
              </div>
              <DonutChart percentage={meta3.progreso} color="orange" />
            </div>
            
            {/* Avance por Región */}
            <div className="space-y-2">
              {meta3.regiones?.map((region) => {
                const pct = region.avance;
                const isCompletado = pct >= 100;
                
                return (
                  <div key={region.region} className="p-3 rounded-lg bg-surface-container-low">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-on-surface">{region.region}</span>
                      <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                        {region.completadas}/{region.total}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(pct, 100)}%`, 
                          backgroundColor: isCompletado ? '#059669' : '#f59e0b'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <Link className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#f59e0b' }} to="/mesas">
                Ver más <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Card 5: KPAX */}
        {meta5 && (
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_40px_rgba(44,47,48,0.06)] relative overflow-hidden hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#9f0051]"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1" style={{ color: '#9f0051' }}>
                  <Activity className="w-5 h-5" />
                  <h4 className="font-bold text-lg text-on-surface">KPAX</h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(159,0,81,0.1)', color: '#9f0051' }}>
                  Meta 5
                </span>
              </div>
              <DonutChart percentage={meta5.metricas[3]?.valor || meta5.progreso} color="secondary" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-500">Equipos Online</p>
                  <p className="text-2xl font-black text-slate-900">{meta5.metricas[0]?.valor}</p>
                </div>
                <Activity className="w-5 h-5" style={{ color: '#00694c' }} />
              </div>
              <div className="flex justify-between items-end p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-500">Conectividad del Mes</p>
                  <p className="text-2xl font-black text-slate-900">{meta5.metricas[1]?.valor}%</p>
                </div>
                <TrendingUp className="w-5 h-5" style={{ color: '#00694c' }} />
              </div>
              <div className="flex justify-between items-end p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-500">Equipos Críticos</p>
                  <p className="text-2xl font-black text-slate-900">{meta5.metricas[2]?.valor || 0}</p>
                </div>
                <MapPin className="w-5 h-5" style={{ color: '#b4005d' }} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Link className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: '#9f0051' }} to="/radar">
                Ver más <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardView;
