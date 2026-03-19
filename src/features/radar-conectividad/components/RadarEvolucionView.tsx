import React, { useState, useEffect } from 'react';
import { Save, Calendar, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchSnapshots,
  fetchUltimoSnapshot,
  fetchSnapshotAnterior,
  guardarSnapshot,
  calcularPromedioAnual,
  formatMes,
  type RadarMensualSnapshot,
} from '../services/radarSnapshotsDb';

// Tiempo en ms para ocultar mensaje de feedback
const FEEDBACK_DURATION_MS = 3000;

/**
 * Vista de Evolución Mensual del Radar
 */
export const RadarEvolucionView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<RadarMensualSnapshot[]>([]);
  const [snapshotActual, setSnapshotActual] = useState<RadarMensualSnapshot | null>(null);
  const [snapshotAnterior, setSnapshotAnterior] = useState<RadarMensualSnapshot | null>(null);
  const [promedioAnual, setPromedioAnual] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Cargar datos
  const cargarDatos = async () => {
    try {
      const [snapshotsData, ultimo, promedio, anterior] = await Promise.all([
        fetchSnapshots(),
        fetchUltimoSnapshot(),
        calcularPromedioAnual(),
        // Snapshot anterior se carga en paralelo
        fetchUltimoSnapshot().then(u => u ? fetchSnapshotAnterior(u.mes) : null)
      ]);

      setSnapshots(snapshotsData);
      setSnapshotActual(ultimo);
      setPromedioAnual(promedio);
      setSnapshotAnterior(anterior);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Guardar snapshot actual
  const handleGuardarSnapshot = async () => {
    setGuardando(true);
    setMensaje(null);

    try {
      await guardarSnapshot();
      setMensaje('Snapshot guardado correctamente');
      await cargarDatos();
      
      setTimeout(() => setMensaje(null), FEEDBACK_DURATION_MS);
    } catch (e) {
      setMensaje('Error al guardar snapshot');
    } finally {
      setGuardando(false);
    }
  };

  // Calcular diferencia con mes anterior
  const getDiferencia = (actual: number, anterior: number | null | undefined) => {
    if (anterior === null || anterior === undefined) return null;
    return actual - anterior;
  };

  return (
    <div className="space-y-6">
      {/* Header con botón para guardar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Evolución Mensual</h2>
          <p className="text-sm text-slate-500">Seguimiento de efectividad y comparativas</p>
        </div>
        <Button
          size="sm"
          onClick={handleGuardarSnapshot}
          disabled={guardando}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando...' : 'Guardar Snapshot'}
        </Button>
      </div>

      {/* Mensaje de confirmación */}
      {mensaje && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          mensaje.includes('Error') 
            ? 'bg-rose-100 text-rose-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {mensaje}
        </div>
      )}

      {/* Resumen del último mes */}
      {snapshotActual ? (
        <div className="grid grid-cols-4 gap-4">
          {/* Mes */}
          <Card className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="h-1 bg-slate-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold flex items-center">
                <Calendar className="w-4 h-4 text-slate-500 mr-2" />
                Mes
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatMes(snapshotActual.mes)}</p>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="h-1 bg-indigo-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold flex items-center">
                <Users className="w-4 h-4 text-indigo-500 mr-2" />
                Total Dispositivos
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{snapshotActual.total_dispositivos}</p>
              {getDiferencia(snapshotActual.total_dispositivos, snapshotAnterior?.total_dispositivos) !== null && (
                <p className="text-xs text-slate-400 mt-1">
                  ({getDiferencia(snapshotActual.total_dispositivos, snapshotAnterior?.total_dispositivos)! > 0 ? '+' : ''}
                  {getDiferencia(snapshotActual.total_dispositivos, snapshotAnterior?.total_dispositivos)} vs mes anterior)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activos */}
          <Card className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                Activos
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{snapshotActual.online}</p>
              {getDiferencia(snapshotActual.online, snapshotAnterior?.online) !== null && (
                <p className={`text-xs mt-1 ${
                  getDiferencia(snapshotActual.online, snapshotAnterior?.online)! > 0 
                    ? 'text-emerald-500' 
                    : 'text-rose-500'
                }`}>
                  ({getDiferencia(snapshotActual.online, snapshotAnterior?.online)! > 0 ? '+' : ''}
                  {getDiferencia(snapshotActual.online, snapshotAnterior?.online)} vs mes anterior)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Inactivos */}
          <Card className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="h-1 bg-rose-500" />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" />
                Inactivos
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{snapshotActual.critico}</p>
              {getDiferencia(snapshotActual.critico, snapshotAnterior?.critico) !== null && (
                <p className={`text-xs mt-1 ${
                  getDiferencia(snapshotActual.critico, snapshotAnterior?.critico)! < 0 
                    ? 'text-emerald-500' 
                    : 'text-rose-500'
                }`}>
                  ({getDiferencia(snapshotActual.critico, snapshotAnterior?.critico)! > 0 ? '+' : ''}
                  {getDiferencia(snapshotActual.critico, snapshotAnterior?.critico)} vs mes anterior)
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="py-8 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">No hay snapshots registrados</p>
            <p className="text-sm text-slate-400 mt-1">
              Guarda el primer snapshot para comenzar el seguimiento
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de historial */}
      {snapshots.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">Historial de Snapshots</h3>
            <p className="text-sm text-slate-500">
              Promedio anual: <span className="font-semibold">{promedioAnual}%</span>
            </p>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Mes</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Online</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Crítico</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-600">Efectividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snapshots.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {formatMes(s.mes)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{s.total_dispositivos}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-medium">{s.online}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-medium">{s.critico}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge
                          variant="outline"
                          className={
                            s.tasa_disponibilidad >= 95
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.tasa_disponibilidad >= 85
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }
                        >
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
      )}
    </div>
  );
};
