import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Network, 
  MapPin, 
  Activity,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RemeLoader } from '@/components/ui/reme-loader';
import { DonutChart } from '@/components/ui/donut-chart';
import { getDatosDashboard } from '@/services/dashboard';
import type { MetaItem } from '@/components/MetaCard';
import { Meta2Card } from './dashboard/Meta2Card';
import { Meta4Card } from './dashboard/Meta4Card';

/**
 * DashboardView - Vista principal del dashboard con métricas de las 5 metas
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

  const meta1 = metas.find(m => m.id === 'meta-1');
  const meta2 = metas.find(m => m.id === 'meta-2');
  const meta3 = metas.find(m => m.id === 'meta-3');
  const meta4 = metas.find(m => m.id === 'meta-4');
  const meta5 = metas.find(m => m.id === 'meta-5');

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
        {/* TODO: Reactivar cuando esté implementado el generador de PDF */}
        {/* <Button 
          variant="outline" 
          className="flex items-center gap-2 border-[#b4005d] text-[#b4005d] bg-pink-50 hover:bg-pink-100"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button> */}
      </div>

      {/* Fila 1: Servicio Social + Cumplimiento 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Servicio Social */}
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
                      <p className="text-2xl font-black" style={{ color: '#2a4bd9' }}>{m.valor}</p>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-outline mb-1">
                          <span>/ {m.meta}</span>
                          <span style={{ color: '#2a4bd9' }}>{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#2a4bd9' }}></div>
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

        {/* Card 2: Cumplimiento 30% */}
        {meta2 && meta2.historial && meta2.historial.length > 0 && (
          <Meta2Card historial={meta2.historial} />
        )}
      </div>

      {/* Fila 2: Cumplimiento de Rutas */}
      <div className="grid grid-cols-1 gap-6">
        {meta4 && meta4.enlaces && meta4.enlaces.length > 0 && (
          <Meta4Card enlaces={meta4.enlaces} />
        )}
      </div>

      {/* Fila 3: Mesas + KPAX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 3: Mesas de Transformación */}
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
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isCompletado ? '#059669' : '#f59e0b' }}></div>
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
