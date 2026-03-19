import React, { useState, useEffect } from 'react';
import { Activity, History, Server, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  fetchHistorialFallas,
  type HistorialFalla
} from './services/radarSupabaseDb';
import { RadarKpaxView } from './components/RadarKpaxView';
import { ReporteView } from './components/ReporteView';
import { RadarEvolucionView } from './components/RadarEvolucionView';

const MonitoreoConectividadView: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialFalla[]>([]);
  const [activeTab, setActiveTab] = useState<'kpax' | 'agentes' | 'historial' | 'evolucion'>('kpax');

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
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white">
            <div className="h-1 bg-indigo-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold">Total Fallas Registradas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{historial.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <div className="h-1 bg-rose-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold">Fallas Activas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{historial.filter(h => h.activo).length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold">Fallas Resueltas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{historial.filter(h => !h.activo).length}</p>
            </CardContent>
          </Card>
        </div>

        {historial.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha Registro</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Agente</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Infoplaza</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Motivo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Fecha Arreglo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((h, idx) => {
                  const fechaRegistro = h.fecha_registro ? new Date(h.fecha_registro) : null;
                  const fechaArqueo = h.fecha_arqueo ? new Date(h.fecha_arqueo) : null;
                  const duracion = fechaRegistro && fechaArqueo 
                    ? Math.round((fechaArqueo.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24))
                    : fechaRegistro 
                      ? Math.round((new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                  return (
                    <tr key={h.id || idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        {fechaRegistro ? fechaRegistro.toLocaleDateString('es-PA') : '-'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{h.agente_id}</td>
                      <td className="px-4 py-3 text-slate-600">{h.infoplaza || '-'}</td>
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
                      <td className="px-4 py-3 text-slate-600">
                        {fechaArqueo ? fechaArqueo.toLocaleDateString('es-PA') : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {duracion > 0 ? `${duracion} día${duracion !== 1 ? 's' : ''}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No hay fallas registradas en el historial</p>
            <p className="text-sm text-slate-400 mt-1">Las fallas aparecerán aquí cuando registres un motivo</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-row justify-between items-start w-full gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-amber-500" />
            Radar de Conectividad
          </h1>
          <p className="text-slate-500 mt-1">Monitoreo de impresoras y agentes KPAX.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('kpax')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'kpax' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            KPAX
          </button>
          <button
            onClick={() => setActiveTab('agentes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'agentes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 inline mr-2" />
            Reporte
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'historial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Historial
          </button>
          <button
            onClick={() => setActiveTab('evolucion')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'evolucion' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Evolución
          </button>
        </div>
      </div>

      {renderContenido()}
    </div>
  );
};

export default MonitoreoConectividadView;
