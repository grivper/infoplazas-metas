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
  estado: 'abierta' | 'cerrada' | 'sin_asignar';
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
 * Estructura: 
 * - Cada enlace muestra solo las ABIERTAS
 * - Grupo "Sin asignar" (sin enlace, no cerradas)
 * - Grupo "Cerradas" al final
 */
function groupByEnlace(rows: TableRow[]): EnlaceGroup[] {
  // Separar las filas por estado
  const abiertas = rows.filter(r => r.estado === 'abierta');
  const sinAsignar = rows.filter(r => r.estado === 'sin_asignar');
  const cerradas = rows.filter(r => r.estado === 'cerrada');
  
  // Agrupar las ABIERTAS por enlace
  const gruposAbiertas = abiertas.reduce<EnlaceGroup[]>((acc, row) => {
    const grupoExistente = acc.find(g => g.enlace === row.enlace);
    if (grupoExistente) {
      grupoExistente.rows.push(row);
    } else {
      acc.push({ enlace: row.enlace, rows: [row] });
    }
    return acc;
  }, []);
  
  // Ordenar grupos de abiertas alfabéticamente
  gruposAbiertas.sort((a, b) => a.enlace.localeCompare(b.enlace));
  
  // Agregar grupo "Sin asignar" si hay
  if (sinAsignar.length > 0) {
    gruposAbiertas.push({ enlace: 'Sin asignar', rows: sinAsignar });
  }
  
  // Agregar grupo "Cerradas" si hay
  if (cerradas.length > 0) {
    gruposAbiertas.push({ enlace: 'Cerradas', rows: cerradas });
  }
  
  return gruposAbiertas;
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
          <div className="h-[300px] min-h-0">
            <ResponsiveContainer width="100%" height="100%" debounce={300}>
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
            {gruposEnlace.map((grupo) => {
              const esCerradas = grupo.enlace === 'Cerradas';
              const esSinAsignar = grupo.enlace === 'Sin asignar';
              const bgColor = esCerradas ? 'bg-rose-50' : esSinAsignar ? 'bg-amber-50' : 'bg-indigo-50';
              const borderColor = esCerradas ? 'border-rose-100' : esSinAsignar ? 'border-amber-100' : 'border-indigo-100';
              const textColor = esCerradas ? 'text-rose-900' : esSinAsignar ? 'text-amber-900' : 'text-indigo-900';
              const badgeColor = esCerradas ? 'text-rose-700 border-rose-200' : esSinAsignar ? 'text-amber-700 border-amber-200' : 'text-indigo-700 border-indigo-200';
              
              return (
              <div key={grupo.enlace} className="mb-4">
                <div className={`${bgColor} px-4 py-2 border-b ${borderColor}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-semibold ${textColor}`}>{grupo.enlace}</h4>
                    <Badge variant="outline" className={`bg-white ${badgeColor}`}>
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
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
