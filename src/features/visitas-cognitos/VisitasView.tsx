import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RemeLoader } from '@/components/ui/reme-loader';
import { RenderCuatrimestre, buildChartData, buildTableRows, buildKpis } from './components/VisitasChartUtils';
import { getDatosVisitas } from './services/meta30Db';
import type { DatosVistaVisitas } from './services/meta30Db';

const UNIVERSO = 106;
const CUATRIMESTRES = {
  C1: ['Enero', 'Febrero', 'Marzo', 'Abril'],
  C2: ['Mayo', 'Junio', 'Julio', 'Agosto'],
  C3: ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

export const VisitasView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<DatosVistaVisitas | null>(null);
  const [añoActual] = useState(() => new Date().getFullYear());
  const SHEET_NAME = 'VisitasRegLS';

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const result = await getDatosVisitas(SHEET_NAME, añoActual);
      setDatos(result);
      setLoading(false);
    };
    cargarDatos();
  }, [añoActual]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RemeLoader size={32} />
      </div>
    );
  }

  const cumplimientoNacional = datos?.cumplimientoNacional ?? {};
  const visitasMock = datos?.visitasPorInfoplaza ?? {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rendimiento Operativo (Meta 2)</h1>
          <p className="text-slate-500 mt-1">Análisis cuatrimestral — Año {añoActual}</p>
        </div>
      </div>

      <Tabs defaultValue="C1" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="C1" className="rounded-md text-sm">C1 (Ene–Abr)</TabsTrigger>
          <TabsTrigger value="C2" className="rounded-md text-sm">C2 (May–Ago)</TabsTrigger>
          <TabsTrigger value="C3" className="rounded-md text-sm">C3 (Sep–Dic)</TabsTrigger>
        </TabsList>
        {(Object.entries(CUATRIMESTRES) as [string, string[]][]).map(([key, meses]) => (
          <TabsContent key={key} value={key} className="mt-6">
            <RenderCuatrimestre
              meses={meses}
              chartData={buildChartData(meses, cumplimientoNacional)}
              rows={buildTableRows(meses, visitasMock)}
              kpis={buildKpis(datos)}
              lastMonth={meses[meses.length - 1]}
              UNIVERSO={UNIVERSO}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default VisitasView;
