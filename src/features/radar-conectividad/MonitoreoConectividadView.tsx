import React, { useState, useEffect } from 'react';
import { Activity, History, Server, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/bento-card';
import { MenuSecciones, type ItemMenu } from '@/components/MenuSecciones';

import {
  fetchHistorialFallas,
  type HistorialFalla
} from './services/radarSupabaseDb';
import { RadarKpaxView } from './components/RadarKpaxView';
import { ReporteView } from './components/ReporteView';
import { RadarEvolucionView } from './components/RadarEvolucionView';

type TabId = 'kpax' | 'agentes' | 'historial' | 'evolucion';

// Secciones de la vista, dibujadas por el menú compartido
const TABS: ItemMenu<TabId>[] = [
  { id: 'kpax', label: 'KPAX', icon: Activity },
  { id: 'agentes', label: 'Reporte', icon: Server },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'evolucion', label: 'Evolución', icon: TrendingUp },
];

const MonitoreoConectividadView: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialFalla[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('kpax');

  // Cargar datos según tab activa
  useEffect(() => {
    if (activeTab === 'historial') {
      //-IIFE para evitar setState directo en effect
      (async () => {
        try {
          const historialData = await fetchHistorialFallas();
          setHistorial(historialData);
        } catch (e) { console.error("Error cargando historial:", e); }
      })();
    }
  }, [activeTab]);

  // Renderizado de contenido según pestaña
  const renderContenido = () => {
    // Tab KPAX Unificado (principal)
    if (activeTab === 'kpax') {
      return <RadarKpaxView />;
    }

    // Tab Reporte (dispositivos críticos sin motivo)
    if (activeTab === 'agentes') {
      return <ReporteView />;
    }

    // Tab Evolución
    if (activeTab === 'evolucion') {
      return <RadarEvolucionView />;
    }

    // Tab Historial
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Fallas Registradas" value={historial.length} color="indigo" />
          <StatCard title="Fallas Activas" value={historial.filter(h => h.activo).length} color="rose" />
          <StatCard title="Fallas Resueltas" value={historial.filter(h => !h.activo).length} color="emerald" />
        </div>

        {historial.length > 0 ? (
          <div className="rounded-xl bg-surface-container-lowest shadow-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="hidden sm:table-cell text-left px-4 py-3 font-semibold text-on-surface-variant">Fecha Registro</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 font-semibold text-on-surface-variant">Agente</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Infoplaza</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Estado</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 font-semibold text-on-surface-variant">Fecha Arreglo</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 font-semibold text-on-surface-variant">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {historial.map((h, idx) => {
                  const fechaRegistro = h.fecha_registro ? new Date(h.fecha_registro) : null;
                  const fechaArqueo = h.fecha_arqueo ? new Date(h.fecha_arqueo) : null;
                  const duracion = fechaRegistro && fechaArqueo 
                    ? Math.round((fechaArqueo.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24))
                    : fechaRegistro 
                      ? Math.round((new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                  return (
                    <tr key={h.id || idx} className="hover:bg-surface-container-low">
                      <td className="hidden sm:table-cell px-4 py-3 text-on-surface">
                        {fechaRegistro ? fechaRegistro.toLocaleDateString('es-PA') : '-'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 font-medium text-on-surface">{h.agente_id}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{h.infoplaza || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                          {h.motivo_falla}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {h.activo ? (
                          <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Resuelta
                          </Badge>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">
                        {fechaArqueo ? fechaArqueo.toLocaleDateString('es-PA') : '-'}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">
                        {duracion > 0 ? `${duracion} día${duracion !== 1 ? 's' : ''}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl bg-surface-container-lowest shadow-card">
            <History className="w-12 h-12 text-outline-variant mx-auto mb-4" />
            <p className="text-on-surface-variant">No hay fallas registradas en el historial</p>
            <p className="text-sm text-outline mt-1">Las fallas aparecerán aquí cuando registres un motivo</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* En móvil el título va arriba y las pestañas debajo; desde lg quedan a la derecha */}
      <div className="flex flex-col gap-4 w-full lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black font-headline text-on-surface tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-amber-500" />
            Radar de Conectividad
          </h1>
          <p className="text-on-surface-variant mt-1">Monitoreo de impresoras y agentes KPAX.</p>
        </div>

        {/* Menú de secciones: grilla en móvil, fila a la derecha desde lg */}
        <MenuSecciones items={TABS} activo={activeTab} onChange={setActiveTab} ariaLabel="Secciones del radar" />
      </div>

      {renderContenido()}
    </div>
  );
};

export default MonitoreoConectividadView;
