import React from 'react';
import { Calendar, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/ui/bento-card';
import { formatMes, type RadarMensualSnapshot } from '../services/radarSnapshotsDb';

interface EvolucionResumenProps {
  actual: RadarMensualSnapshot | null;
  anterior: RadarMensualSnapshot | null;
}

/**
 * Texto de comparación con el mes anterior, por ejemplo "(+3 vs mes anterior)".
 * Devuelve undefined si no hay mes anterior con el que comparar.
 */
const formatDiferencia = (
  actual: number,
  anterior: number | null | undefined,
): string | undefined => {
  if (anterior === null || anterior === undefined) return undefined;
  const diferencia = actual - anterior;
  return `(${diferencia > 0 ? '+' : ''}${diferencia} vs mes anterior)`;
};

/**
 * Resumen del último mes registrado: tarjetas con la comparación contra el mes anterior.
 */
export const EvolucionResumen: React.FC<EvolucionResumenProps> = ({ actual, anterior }) => {
  if (!actual) {
    return (
      <div className="rounded-xl bg-surface-container-lowest shadow-card py-8 text-center">
        <Calendar className="w-8 h-8 text-outline-variant mx-auto mb-2" />
        <p className="text-on-surface-variant font-medium">No hay snapshots registrados</p>
        <p className="text-sm text-outline mt-1">
          Guarda el primer snapshot para comenzar el seguimiento
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Mes"
        value={formatMes(actual.mes)}
        icon={<Calendar className="w-4 h-4" />}
        color="slate"
      />
      <StatCard
        title="Total Dispositivos"
        value={actual.total_dispositivos}
        description={formatDiferencia(actual.total_dispositivos, anterior?.total_dispositivos)}
        icon={<Users className="w-4 h-4" />}
        color="indigo"
      />
      <StatCard
        title="Activos"
        value={actual.online}
        description={formatDiferencia(actual.online, anterior?.online)}
        icon={<TrendingUp className="w-4 h-4" />}
        color="emerald"
      />
      <StatCard
        title="Inactivos"
        value={actual.critico}
        description={formatDiferencia(actual.critico, anterior?.critico)}
        icon={<AlertTriangle className="w-4 h-4" />}
        color="rose"
      />
    </div>
  );
};
