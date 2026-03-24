import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/bento-card';
import { Inc } from './IncCell';

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
  enlace: string;
  dia: string;
}

interface EnlaceGroup {
  enlace: string;
  rows: TableRow[];
}

interface RenderCuatrimestreProps {
  meses: string[];
  chartData: ChartData[];
  rows: TableRow[];
  kpis: KpiItem[];
  lastMonth: string;
  UNIVERSO: number;
}

/**
 * Agrupa las filas por enlace para renderizar headers de sección.
 */
function groupByEnlace(rows: TableRow[]): EnlaceGroup[] {
  return rows.reduce<EnlaceGroup[]>((acc, row) => {
    const grupoExistente = acc.find(g => g.enlace === row.enlace);
    if (grupoExistente) {
      grupoExistente.rows.push(row);
    } else {
      acc.push({ enlace: row.enlace, rows: [row] });
    }
    return acc;
  }, []);
}

/**
 * Renderiza el contenido completo de un cuatrimestre: KPIs, gráfico y tabla.
 */
export function RenderCuatrimestre({ meses, chartData, rows, kpis, lastMonth, UNIVERSO }: RenderCuatrimestreProps) {
  const gruposEnlace = groupByEnlace(rows);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-800">Estado de {lastMonth}</h3>
        <p className="text-sm text-slate-500 mt-1">
          Distribución según porcentaje de cumplimiento sobre la meta ({UNIVERSO} visitas)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <StatCard 
            key={idx} 
            title={kpi.title} 
            value={kpi.value} 
            description={kpi.desc}
            color={kpi.color as 'slate' | 'indigo' | 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple'}
          />
        ))}
      </div>

      {/* Gráfico de Cumplimiento */}
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
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value, name) => {
                    const numVal = Number(value);
                    const strName = String(name);
                    if (strName === 'Cumplieron') return [`${numVal}`, 'Cumplieron'];
                    if (strName === 'Incremento') return [`${numVal > 0 ? '+' : ''}${numVal}`, 'Incremento'];
                    return [String(numVal), strName];
                  }}
                />
                <Legend />
                <ReferenceLine yAxisId="left" y={UNIVERSO} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: `Meta: ${UNIVERSO}`, position: 'right', fontSize: 12, fill: '#94a3b8' }} />
                <Bar yAxisId="left" dataKey="infoplazasCumplieron" name="Cumplieron" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="incremento" name="Incremento" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Detallada por Enlace */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Infoplaza</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {gruposEnlace.map((grupo) => (
              <div key={grupo.enlace} className="mb-4">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-indigo-900">{grupo.enlace}</h4>
                    <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                      {grupo.rows.length} infoplazas
                    </Badge>
                  </div>
                </div>
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
                    {grupo.rows.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-800">{row.name}</td>
                        {row.cells.map((cell, i) => (
                          <td key={i} className="px-4 py-2 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{cell.visitas ?? '—'}</span>
                              {cell.incremento !== null && <Inc v={cell.incremento} />}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
