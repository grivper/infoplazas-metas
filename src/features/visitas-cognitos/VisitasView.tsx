import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDatosVisitas } from './services/meta30Db';
import type { DatosVistaVisitas } from './services/meta30Db';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList
} from 'recharts';

// --- Constantes ---
const UNIVERSO = 106;
const CUATRIMESTRES = {
  C1: ['Enero', 'Febrero', 'Marzo', 'Abril'],
  C2: ['Mayo', 'Junio', 'Julio', 'Agosto'],
  C3: ['Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

// --- Utilidad: Celda de incremento con color ---
const Inc: React.FC<{ v: number | null }> = ({ v }) => {
  if (v === null) return <span className="text-slate-300">—</span>;
  if (v > 0) return <span className="text-emerald-600 font-semibold">+{v}</span>;
  if (v < 0) return <span className="text-rose-600 font-semibold">{v}</span>;
  return <span className="text-slate-400">0.00</span>;
};

// --- Componente Principal ---
export const VisitasView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<DatosVistaVisitas | null>(null);
  const [añoActual] = useState(() => new Date().getFullYear());
  const SHEET_NAME = 'VisitasRegLS';

  // Cargar datos de Supabase al montar
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      const result = await getDatosVisitas(SHEET_NAME, añoActual);
      setDatos(result);
      setLoading(false);
    };
    cargarDatos();
  }, [añoActual]);

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Si no hay datos, usar valores por defecto
  const cumplimientoNacional = datos?.cumplimientoNacional ?? {};
  const visitasMock = datos?.visitasPorInfoplaza ?? {};

  const buildChartData = (meses: string[]) => {
    return meses.map((mes, i) => {
      const val = cumplimientoNacional[mes] || 0;
      const prev = i > 0 ? (cumplimientoNacional[meses[i - 1]] || 0) : 0;
      return { name: mes.substring(0, 3), infoplazasCumplieron: val, meta: UNIVERSO, incremento: i === 0 ? 0 : val - prev };
    });
  };

  // Genera las filas de la tabla panorámica para un cuatrimestre
  const buildTableRows = (meses: string[]) => {
    const ultimoMes = meses[meses.length - 1]; // Último mes del cuatrimestre para ordenar
    
    return Object.entries(visitasMock)
      .map(([_, ipData]) => {
        const cells = meses.map((mes, i) => {
          const val = ipData.meses[mes] ?? null;
          const prev = i > 0 ? (ipData.meses[meses[i - 1]] ?? null) : null;
          
          let incremento: number | null = null;
          if (i === 0) {
            // Primer mes del cuatrimestre: solo mostrar 0 si hay datos, si no "—"
            incremento = val !== null ? 0 : null;
          } else if (val !== null && prev !== null) {
            incremento = Number((val - prev).toFixed(2));
          } else {
            incremento = null;
          }
          
          return { mes, visitas: val, incremento };
        });
        return { name: ipData.nombre, cells, ultimoValor: ipData.meses[ultimoMes] ?? null };
      })
      .sort((a, b) => {
        // Ordenar por el último mes del cuatrimestre (mayor a menor)
        if (a.ultimoValor === null && b.ultimoValor === null) return 0;
        if (a.ultimoValor === null) return 1;
        if (b.ultimoValor === null) return -1;
        return b.ultimoValor - a.ultimoValor;
      });
  };

  // KPIs: distribución del mes actual o último mes con datos
  const buildKpis = () => {
    const {
      ipEnRiesgo = 0,
      ipSobre30 = 0,
      totalIP = 0,
      mesActual = ''
    } = datos || {};
    
    // Las que están entre 10% y 30% (ni en riesgo ni sobre 30)
    const ipEntre10y30 = totalIP - ipEnRiesgo - ipSobre30;
    // Las que no tienen datos este mes
    const ipSinDatos = UNIVERSO - totalIP;
    
    return [
      { title: 'Con Datos', value: totalIP, desc: 'Reportaron', color: 'bg-indigo-500' },
      { title: 'Sin Datos', value: ipSinDatos, desc: 'Sin reportar', color: 'bg-slate-400' },
      { title: 'En Riesgo', value: ipEnRiesgo, desc: '< 10%', color: 'bg-rose-500' },
      { title: '10-30%', value: ipEntre10y30, desc: 'Por mejorar', color: 'bg-amber-500' },
      { title: 'Sobre 30%', value: ipSobre30, desc: mesActual, color: 'bg-emerald-500' },
    ];
  };

  // Renderiza el contenido de un cuatrimestre
  const renderCuatrimestre = (meses: string[], _cuatKey: string) => {
    const chartData = buildChartData(meses);
    const rows = buildTableRows(meses);
    const kpis = buildKpis();
    const lastMonth = meses[meses.length - 1];

    return (
      <div className="space-y-8">
        {/* Título de KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Resumen de {datos?.mesActual || 'Mes'}</h2>
          <p className="text-sm text-slate-500">Distribución de Infoplazas según su rendimiento</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((k, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{k.title}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${k.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{k.value}</div>
                <p className="text-xs text-slate-400 mt-1">{k.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráfica de Barras */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Infoplazas sobre 30%</CardTitle>
            <CardDescription>Cantidad de Infoplazas que superaron el 30% de la meta por mes.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* CORRECCIÓN: Dimensiones fijas para evitar warnings de Recharts the width(-1) and height(-1) */}
            <div className="w-full h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis domain={[0, UNIVERSO]} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [value, String(name) === 'infoplazasCumplieron' ? 'Sobre 30%' : 'Universo']}
                  />
                  <ReferenceLine y={UNIVERSO} stroke="#94A3B8" strokeDasharray="3 3" />
                  <Bar dataKey="infoplazasCumplieron" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="incremento" position="top" fill="#334155" style={{ fontSize: 13, fontWeight: 700 }}
                      formatter={(v) => { const n = Number(v); return n === 0 ? '—' : n > 0 ? `+${n}` : `${n}`; }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabla Panorámica Horizontal */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Desglose por Infoplaza</CardTitle>
              <Badge variant="outline" className="bg-slate-50 text-slate-600">Cierre: {lastMonth}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="w-[220px] px-4 py-3 text-left font-medium">Infoplaza</th>
                    {meses.map(m => (
                      <React.Fragment key={m}>
                        <th className="px-2 py-3 text-center font-medium">{m.substring(0, 3)}</th>
                        <th className="px-2 py-3 text-center font-medium text-indigo-500">Inc.</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(row => (
                    <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 truncate">{row.name}</td>
                      {row.cells.map((c, i) => (
                        <React.Fragment key={i}>
                          <td className="px-2 py-3 text-center text-slate-700 font-medium">
                            {c.visitas === null ? '—' : `${c.visitas.toFixed(2)}%`}
                          </td>
                          <td className="px-2 py-3 text-center"><Inc v={c.incremento} /></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rendimiento Operativo (Meta 2)</h1>
          <p className="text-slate-500 mt-1">Análisis cuatrimestral — Año {añoActual}</p>
        </div>
      </div>

      {/* Tabs Cuatrimestrales */}
      <Tabs defaultValue="C1" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="C1" className="rounded-md text-sm">C1 (Ene–Abr)</TabsTrigger>
          <TabsTrigger value="C2" className="rounded-md text-sm">C2 (May–Ago)</TabsTrigger>
          <TabsTrigger value="C3" className="rounded-md text-sm">C3 (Sep–Dic)</TabsTrigger>
        </TabsList>
        {(Object.entries(CUATRIMESTRES) as [string, string[]][]).map(([key, meses]) => (
          <TabsContent key={key} value={key} className="mt-6">
            {renderCuatrimestre(meses, key)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default VisitasView;
