import React from 'react';
import { Database, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface FilaMensual { nombre: string; meses: Record<number, number>; total: number; }

const MES_NOMBRE: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

/** Tabla con desglose mensual de registros por entidad (enlace o infoplaza). */
export const TablaMensual: React.FC<{ datos: FilaMensual[]; mesesCuat: number[]; label: string; col: string }> = ({ datos, mesesCuat, label, col }) => (
  <Card className="border shadow-md overflow-hidden">
    <CardHeader className="bg-surface-container-low/50 border-b">
      <CardTitle className="text-lg flex items-center gap-2">
        {col.includes('Enlace') ? <Database className="w-4 h-4 text-indigo-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
        {label}
      </CardTitle>
      <CardDescription>{datos.length} entidades con registros</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-on-surface-variant uppercase bg-surface-container-low/80 border-b border-border/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{col}</th>
              {mesesCuat.map((m, i) => <th key={m} className={`${i < mesesCuat.length - 1 ? 'hidden sm:table-cell ' : ''}px-2 py-3 text-center font-semibold`}>{MES_NOMBRE[m].substring(0, 3)}</th>)}
              <th className="px-3 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {datos.map(r => (
              <tr key={r.nombre} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-4 py-3 font-medium text-on-surface">{r.nombre}</td>
                {mesesCuat.map((m, i) => (
                  <td key={m} className={`${i < mesesCuat.length - 1 ? 'hidden sm:table-cell ' : ''}px-2 py-3 text-center ${r.meses[m] ? 'text-on-surface font-medium' : 'text-outline-variant'}`}>
                    {r.meses[m] || 0}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-extrabold text-indigo-700 bg-indigo-50/20">{r.total}</td>
              </tr>
            ))}
            {datos.length === 0 && (
              <tr><td colSpan={mesesCuat.length + 2} className="px-4 py-8 text-center text-outline italic">No hay registros para este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

