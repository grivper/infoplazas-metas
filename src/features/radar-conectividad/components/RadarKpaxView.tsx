import React, { useState, useEffect, useCallback } from 'react';
import { RadarKpis } from './RadarKpis';
import { RadarDeviceCard } from './RadarDeviceCard';
import { RadarUpload } from './RadarUpload';
import { fetchKpaxUnificadoFromSupabase, syncKpaxUnificadoToSupabase } from '../services/kpaxUnificadoDb';
import { parseArchivo68, parseCsvText } from '../services/kpaxUnificadoParser';
import { fetchAllInfoplazas } from '../../auditoria/services/infoplazasService';
import type { KpaxUnificado } from '../types/kpaxUnificado';
import type { Infoplaza } from '../../auditoria/services/infoplazasService';
import type { RadarKpaxKpis } from '../types/kpaxUnificado';

/**
 * Vista principal del Radar KPAX Unificado
 * Muestra dispositivos con estado combinado de impresora + agente
 */
export const RadarKpaxView: React.FC = () => {
  const [dispositivos, setDispositivos] = useState<KpaxUnificado[]>([]);
  const [catalogo, setCatalogo] = useState<Infoplaza[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos desde Supabase
  const loadData = useCallback(async () => {
    try {
      const [dbData, dbCatalogo] = await Promise.all([
        fetchKpaxUnificadoFromSupabase(),
        fetchAllInfoplazas()
      ]);
      setDispositivos(dbData);
      setCatalogo(dbCatalogo);
    } catch (e) {
      console.error('[Radar KPAX] Error cargando datos:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler de upload CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // Leer archivo
      const buffer = await file.arrayBuffer();
      const csvText = parseCsvText(buffer);

      // Parsear
      const parsed = parseArchivo68(csvText, catalogo);
      
      if (parsed.length === 0) {
        alert('No se encontraron dispositivos en el archivo');
        setLoading(false);
        return;
      }

      // Sincronizar a Supabase
      const result = await syncKpaxUnificadoToSupabase(parsed);

      // Recargar datos
      await loadData();

      let msg = `${result.syncCount} dispositivos procesados correctamente`;
      if (result.resolvedCount > 0) {
        msg += `\n${result.resolvedCount} movidos al historial (resueltos/desaparecidos)`;
      }
      if (result.deletedCount > 0) {
        msg += `\n${result.deletedCount} eliminados de la vista activa`;
      }
      alert(msg);
    } catch (err) {
      console.error('[Radar KPAX] Error procesando CSV:', err);
      alert('No se pudo procesar el archivo CSV');
    } finally {
      setLoading(false);
      // Limpiar el input para permitir re-subir el mismo archivo
      e.target.value = '';
    }
  };

  // Calcular KPIs
  const kpis: RadarKpaxKpis = {
    total: dispositivos.length,
    online: dispositivos.filter(d => d.estado === 'online').length,
    critico: dispositivos.filter(d => d.estado === 'critico').length,
    agentesCaidos: dispositivos.filter(d => {
      const inact = d.inactividad_agente?.toLowerCase() || '';
      return inact.includes('mes') || inact.includes('semana');
    }).length
  };

  // Separar críticos y online
  const criticos = dispositivos.filter(d => d.estado === 'critico');
  const online = dispositivos.filter(d => d.estado === 'online');

  // Función para obtener nombre de infoplaza
  const getInfoplazaNombre = (infoplazaId: string | null): string | undefined => {
    if (!infoplazaId) return undefined;
    const ip = catalogo.find(i => i.id === infoplazaId);
    return ip?.nombre;
  };

  return (
    <div className="space-y-6">
      {/* KPIs - ocupan todo el ancho */}
      <RadarKpis kpis={kpis} />

      {/* Upload - siempre visible */}
      <RadarUpload 
        onUpload={handleFileUpload}
        loading={loading}
        deviceCount={dispositivos.length}
      />

      {/* Lista de Dispositivos */}
      {dispositivos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No hay dispositivos cargados</p>
          <p className="text-sm text-slate-400 mt-1">
            Subí el archivo CSV de KPAX para comenzar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Críticos */}
          {criticos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-rose-600">
                  Críticos ({criticos.length})
                </h2>
                <div className="h-px flex-1 bg-rose-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {criticos.map(disp => (
                  <RadarDeviceCard
                    key={disp.numero_serie}
                    dispositivo={disp}
                    infoplazaNombre={getInfoplazaNombre(disp.infoplaza_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Online */}
          {online.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-emerald-600">
                  En Línea ({online.length})
                </h2>
                <div className="h-px flex-1 bg-emerald-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {online.map(disp => (
                  <RadarDeviceCard
                    key={disp.numero_serie}
                    dispositivo={disp}
                    infoplazaNombre={getInfoplazaNombre(disp.infoplaza_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
