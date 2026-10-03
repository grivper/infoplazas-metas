import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchSnapshots,
  fetchUltimoSnapshot,
  fetchSnapshotAnterior,
  guardarSnapshot,
  calcularPromedioAnual,
  type RadarMensualSnapshot,
} from '../services/radarSnapshotsDb';
import { EvolucionResumen } from './EvolucionResumen';
import { SnapshotsHistorialTable } from './SnapshotsHistorialTable';

// Tiempo en ms para ocultar mensaje de feedback
const FEEDBACK_DURATION_MS = 3000;

/** Mensaje de feedback: el tipo decide el color, no el texto. */
interface Feedback {
  tipo: 'exito' | 'error';
  texto: string;
}

/**
 * Vista de Evolución Mensual del Radar.
 * Mantiene el estado y los handlers; el resumen y la tabla viven en sus propios componentes.
 */
export const RadarEvolucionView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<RadarMensualSnapshot[]>([]);
  const [snapshotActual, setSnapshotActual] = useState<RadarMensualSnapshot | null>(null);
  const [snapshotAnterior, setSnapshotAnterior] = useState<RadarMensualSnapshot | null>(null);
  const [promedioAnual, setPromedioAnual] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Feedback | null>(null);

  // Cargar datos
  const cargarDatos = async () => {
    try {
      // El último snapshot se pide una sola vez: el anterior depende de su mes
      const ultimo = await fetchUltimoSnapshot();
      const [snapshotsData, promedio, anterior] = await Promise.all([
        fetchSnapshots(),
        calcularPromedioAnual(),
        ultimo ? fetchSnapshotAnterior(ultimo.mes) : null,
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
      setMensaje({ tipo: 'exito', texto: 'Snapshot guardado correctamente' });
      await cargarDatos();

      setTimeout(() => setMensaje(null), FEEDBACK_DURATION_MS);
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al guardar snapshot' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botón para guardar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-headline text-on-surface">Evolución Mensual</h2>
          <p className="text-sm text-on-surface-variant">Seguimiento de efectividad y comparativas</p>
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
          mensaje.tipo === 'error'
            ? 'bg-rose-100 text-rose-700'
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <EvolucionResumen actual={snapshotActual} anterior={snapshotAnterior} />

      {snapshots.length > 0 && (
        <SnapshotsHistorialTable snapshots={snapshots} promedioAnual={promedioAnual} />
      )}
    </div>
  );
};
