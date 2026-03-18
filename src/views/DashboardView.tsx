import React, { useState, useEffect } from 'react';
import { MetaCard, type MetaItem } from '@/components/MetaCard';
import { getDatosDashboard } from '@/services/dashboardDb';
import { RemeLoader } from '@/components/ui/reme-loader';

/**
 * Vista de Dashboard Principal: Portal Gerencial de Metas
 * Muestra el progreso de las 5 metas con datos reales de Supabase.
 */
export const DashboardView: React.FC = () => {
  const [metas, setMetas] = useState<MetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarMetas = async () => {
      try {
        setLoading(true);
        const datos = await getDatosDashboard();
        setMetas(datos);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarMetas();
  }, []);

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RemeLoader size={32} />
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Encabezado con Saludo */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Panel de Control Gerencial
        </h1>
        <p className="text-slate-500 text-lg">
          Resumen del progreso de las 5 metas de Infoplazas
        </p>
      </div>

      {/* Grid de las 5 Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metas.map((meta) => (
          <MetaCard key={meta.id} meta={meta} />
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
