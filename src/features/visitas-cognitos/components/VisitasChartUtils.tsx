import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';

const UNIVERSO = 106;

interface ChartData {
  name: string;
  infoplazasCumplieron: number;
  meta: number;
  incremento: number;
}

interface KpiItem {
  title: string;
  value: number;
  desc: string;
  color: string;
}

interface TableRow {
  name: string;
  cells: { mes: string; visitas: number | null; incremento: number | null }[];
  ultimoValor: number | null;
}

interface RenderCuatrimestreProps {
  meses: string[];
  chartData: ChartData[];
  rows: TableRow[];
  kpis: KpiItem[];
  lastMonth: string;
  UNIVERSO: number;
}

export function RenderCuatrimestre({ meses, chartData, rows, kpis, lastMonth, UNIVERSO }: RenderCuatrimestreProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-800">Estado de {lastMonth}</h3>
        <p className="text-sm text-slate-500 mt-1">Distribución según porcentaje de cumplimiento sobre la meta ({UNIVERSO} visitas)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{kpi.title}</CardTitle>
              <div className={`w-2 h-2 rounded-full ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-slate-400 mt-1">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cumplimiento por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value) => [`${value} visitas`, 'Cumplieron']}
                />
                <ReferenceLine y={UNIVERSO} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: `Meta: ${UNIVERSO}`, position: 'right', fontSize: 12, fill: '#94a3b8' }} />
                <Bar dataKey="infoplazasCumplieron" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="infoplazasCumplieron" position="top" fontSize={11} fill="#64748b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Infoplaza</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Infoplaza</th>
                  {meses.map((mes) => (
                    <th key={mes} className="px-4 py-3 font-medium text-center">{mes.substring(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                    {row.cells.map((cell: { visitas: number | null; incremento: number | null }, i: number) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{cell.visitas ?? '—'}</span>
                          {cell.incremento !== null && (
                            <Inc v={cell.incremento} />
                          )}
                        </div>
                      </td>
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
}

const Inc: React.FC<{ v: number | null }> = ({ v }) => {
  if (v === null) return <span className="text-slate-300">—</span>;
  if (v > 0) return <span className="text-emerald-600 font-semibold">+{v}</span>;
  if (v < 0) return <span className="text-rose-600 font-semibold">{v}</span>;
  return <span className="text-slate-400">0.00</span>;
};

export { Inc };

export function buildChartData(meses: string[], cumplimientoNacional: Record<string, number>): ChartData[] {
  return meses.map((mes, i) => {
    const val = cumplimientoNacional[mes] || 0;
    const prev = i > 0 ? (cumplimientoNacional[meses[i - 1]] || 0) : 0;
    return { name: mes.substring(0, 3), infoplazasCumplieron: val, meta: UNIVERSO, incremento: i === 0 ? 0 : val - prev };
  });
}

export function buildTableRows(meses: string[], visitasMock: Record<string, { meses: Record<string, number | null>; nombre: string }>): TableRow[] {
  const ultimoMes = meses[meses.length - 1];
  
  return Object.entries(visitasMock)
    .map(([_, ipData]) => {
      const cells = meses.map((mes, i) => {
        const val = ipData.meses[mes] ?? null;
        const prev = i > 0 ? (ipData.meses[meses[i - 1]] ?? null) : null;
        
        let incremento: number | null = null;
        if (i === 0) {
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
      if (a.ultimoValor === null && b.ultimoValor === null) return 0;
      if (a.ultimoValor === null) return 1;
      if (b.ultimoValor === null) return -1;
      return b.ultimoValor - a.ultimoValor;
    });
}

export function buildKpis(datos: { ipEnRiesgo?: number; ipSobre30?: number; totalIP?: number; mesActual?: string } | null): KpiItem[] {
  const { ipEnRiesgo = 0, ipSobre30 = 0, totalIP = 0, mesActual = '' } = datos || {};
  const ipEntre10y30 = UNIVERSO - ipEnRiesgo - ipSobre30;
  const ipSinDatos = UNIVERSO - totalIP;
  
  return [
    { title: 'Con Datos', value: totalIP, desc: 'Reportaron', color: 'bg-indigo-500' },
    { title: 'Sin Datos', value: ipSinDatos, desc: 'Sin reportar', color: 'bg-slate-400' },
    { title: 'En Riesgo', value: ipEnRiesgo, desc: '< 10%', color: 'bg-rose-500' },
    { title: '10-30%', value: ipEntre10y30, desc: 'Por mejorar', color: 'bg-amber-500' },
    { title: 'Sobre 30%', value: ipSobre30, desc: mesActual, color: 'bg-emerald-500' },
  ];
}
