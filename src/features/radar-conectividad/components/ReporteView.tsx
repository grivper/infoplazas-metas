import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/bento-card';
import { RadarDeviceCard } from './RadarDeviceCard';
import { fetchReporteDispositivos, updateMotivoFalla } from '../services/kpaxUnificadoDb';
import { RemeLoader } from '@/components/ui/reme-loader';
import type { KpaxUnificado } from '../types/kpaxUnificado';

/**
 * Vista de Reporte: Solo críticos sin motivo de falla
 * Muestra dispositivos que necesitan atención inmediata
 */
export const ReporteView: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<KpaxUnificado[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar reporte
  const loadReporte = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReporteDispositivos();
      setDispositivos(data);
    } catch (e) {
      console.error('[Reporte] Error cargando:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReporte();
  }, [loadReporte]);

  // Handler para actualizar motivo
  const handleMotivoChange = async (numeroSerie: string, motivo: string) => {
    try {
      await updateMotivoFalla(numeroSerie, motivo);
      await loadReporte(); // Recargar para actualizar la lista
    } catch (err) {
      console.error('[Reporte] Error guardando motivo:', err);
      throw err;
    }
  };

  // KPIs
  const totalCriticos = dispositivos.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RemeLoader size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          title="Pendientes de Atención" 
          value={totalCriticos} 
          icon={<AlertTriangle className="w-4 h-4" />}
          color="rose" 
        />
        <StatCard 
          title="Sin Motivo Registrado" 
          value={totalCriticos} 
          description="Requieren clasificación"
          icon={<FileText className="w-4 h-4" />}
          color="amber" 
        />
        <StatCard 
          title="Listos para Gestionar" 
          value={0} 
          description="Con motivo asignado"
          icon={<CheckCircle className="w-4 h-4" />}
          color="emerald" 
        />
      </div>

      {/* Lista de dispositivos pendientes */}
      {dispositivos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">¡No hay pendientes!</p>
          <p className="text-sm text-slate-400 mt-1">
            Todos los dispositivos críticos tienen motivo registrado
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
            <p className="text-sm text-rose-700 font-medium">
              ⚠️ {dispositivos.length} dispositivo{dispositivos.length !== 1 ? 's' : ''} sin motivo de falla
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {dispositivos.map(disp => (
              <RadarDeviceCard
                key={disp.numero_serie}
                dispositivo={disp}
                infoplazaNombre={disp.catalogo_infoplazas?.nombre ?? 'Sin infoplaza'}
                onMotivoChange={handleMotivoChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
