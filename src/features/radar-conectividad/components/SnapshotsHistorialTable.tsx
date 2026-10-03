import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatMes, type RadarMensualSnapshot } from '../services/radarSnapshotsDb';

interface SnapshotsHistorialTableProps {
  snapshots: RadarMensualSnapshot[];
  promedioAnual: number;
}

/** Color del badge de efectividad según la tasa de disponibilidad. */
const claseEfectividad = (tasa: number): string => {
  if (tasa >= 95) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tasa >= 85) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

/**
 * Tabla con el historial de snapshots mensuales y el promedio anual.
 */
export const SnapshotsHistorialTable: React.FC<SnapshotsHistorialTableProps> = ({
  snapshots,
  promedioAnual,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-on-surface">Historial de Snapshots</h3>
        <p className="text-sm text-on-surface-variant">
          Promedio anual: <span className="font-semibold">{promedioAnual}%</span>
        </p>
      </div>
      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-surface-container-low">
                <th className="text-left py-3 px-4 font-semibold text-on-surface-variant">Mes</th>
                <th className="text-right py-3 px-4 font-semibold text-on-surface-variant">Total</th>
                <th className="text-right py-3 px-4 font-semibold text-on-surface-variant">Online</th>
                <th className="text-right py-3 px-4 font-semibold text-on-surface-variant">Crítico</th>
                <th className="text-right py-3 px-4 font-semibold text-on-surface-variant">Efectividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {snapshots.map((s) => (
                <tr key={s.id} className="hover:bg-surface-container-low">
                  <td className="py-3 px-4 font-medium text-on-surface">{formatMes(s.mes)}</td>
                  <td className="py-3 px-4 text-right text-on-surface-variant">{s.total_dispositivos}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-medium">{s.online}</td>
                  <td className="py-3 px-4 text-right text-rose-600 font-medium">{s.critico}</td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="outline" className={claseEfectividad(s.tasa_disponibilidad)}>
                      {s.tasa_disponibilidad}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
