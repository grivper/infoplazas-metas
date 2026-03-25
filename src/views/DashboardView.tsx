import React, { useState, useEffect, useMemo } from 'react';
import { RemeLoader } from '@/components/ui/reme-loader';
import { getDatosDashboard } from '@/services/dashboard';
import { descargarExcelMetas } from '@/services/informe/excel';
import type { MetaItem } from '@/components/MetaCard';
import { Meta1Card, Meta2Card, Meta3Card, Meta4Card, Meta5Card } from './dashboard';
import { Download } from 'lucide-react';

/**
 * DashboardView - Vista principal del dashboard con métricas de las 5 metas
 */
export const DashboardView: React.FC = () => {
  const [metas, setMetas] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Handler para exportar Excel
  const handleExportExcel = async () => {
    try {
      setExportandoExcel(true);
      await descargarExcelMetas();
    } catch {
      console.error('Error exportando Excel');
    } finally {
      setExportandoExcel(false);
    }
  };

  useEffect(() => {
    const cargarMetas = async () => {
      try {
        setLoading(true);
        const datos = await getDatosDashboard();
        setMetas(datos);
      } catch (err) {
        // En producción usar sistema de toast en vez de console
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    cargarMetas();
  }, []);

  // Memoizar búsqueda de metas para evitar búsquedas en cada render
  const metasMap = useMemo(() => ({
    meta1: metas.find(m => m.id === 'meta-1'),
    meta2: metas.find(m => m.id === 'meta-2'),
    meta3: metas.find(m => m.id === 'meta-3'),
    meta4: metas.find(m => m.id === 'meta-4'),
    meta5: metas.find(m => m.id === 'meta-5'),
  }), [metas]);

  const { meta1, meta2, meta3, meta4, meta5 } = metasMap;

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
        {/* Botón para exportar Excel */}
        <button 
          className="flex items-center gap-2 px-4 py-2 border border-[#b4005d] text-[#b4005d] bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
          onClick={handleExportExcel}
          disabled={exportandoExcel}
        >
          <Download className="w-4 h-4" />
          {exportandoExcel ? 'Exportando...' : 'Descargar Excel'}
        </button>
      </div>

      {/* Fila 1: Servicio Social + Cumplimiento 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Servicio Social */}
        {meta1 && <Meta1Card meta={meta1} />}

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
        {meta3 && <Meta3Card meta={meta3} />}

        {/* Card 5: KPAX */}
        {meta5 && <Meta5Card meta={meta5} />}
      </div>
    </div>
  );
};

export default DashboardView;
