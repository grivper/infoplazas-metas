import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { ModalIncidencia } from './ModalIncidencia';
import { IncidenciaDetalleModal } from './IncidenciaDetalleModal';
import { RemeLoader } from '@/components/ui/reme-loader';
import { getUrgenciaColor, getEstadoColor, getEstadoLabel, formatFecha } from './incidenciasUtils';
import { 
  getIncidencias, 
  getSeguimientosByIncidencia,
  createSeguimiento,
  updateIncidenciaEstado,
  type Incidencia, 
  type Seguimiento
} from '../services/incidenciasDb';

export const IncidenciasView: React.FC = () => {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para modal de detalle
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loadingSeguimientos, setLoadingSeguimientos] = useState(false);
  const [notaSeguimiento, setNotaSeguimiento] = useState('');
  const [accionSeguimiento, setAccionSeguimiento] = useState<'seguimiento' | 'resuelto' | 'escalado'>('seguimiento');
  const [guardando, setGuardando] = useState(false);

  // Cargar incidencias al montar
  useEffect(() => {
    const cargarIncidencias = async () => {
      setLoading(true);
      const data = await getIncidencias();
      setIncidencias(data);
      setLoading(false);
    };
    cargarIncidencias();
  }, []);

  // Función para recargar después de crear nueva incidencia
  const handleIncidenciaCreada = () => {
    getIncidencias().then(setIncidencias);
  };

  // Cargar seguimientos cuando se selecciona una incidencia
  const handleVerDetalle = async (incidencia: Incidencia) => {
    setIncidenciaSeleccionada(incidencia);
    setLoadingSeguimientos(true);
    setNotaSeguimiento('');
    setAccionSeguimiento('seguimiento');
    
    const segs = await getSeguimientosByIncidencia(incidencia.id);
    setSeguimientos(segs);
    setLoadingSeguimientos(false);
  };

  // Agregar seguimiento
  const handleAgregarSeguimiento = async () => {
    if (!incidenciaSeleccionada || !notaSeguimiento.trim()) return;
    
    setGuardando(true);
    
    // 1. Crear el seguimiento
    const result = await createSeguimiento(
      incidenciaSeleccionada.id,
      notaSeguimiento,
      accionSeguimiento
    );

    if (result.success) {
      // 2. Si la acción es resuelto o escalate, actualizar estado
      if (accionSeguimiento === 'resuelto') {
        await updateIncidenciaEstado(incidenciaSeleccionada.id, 'resuelto');
      } else if (accionSeguimiento === 'escalado') {
        await updateIncidenciaEstado(incidenciaSeleccionada.id, 'escalado');
      } else {
        // Si es solo seguimiento, pasar a en_seguimiento si estaba abierta
        if (incidenciaSeleccionada.estado_ticket === 'abierto') {
          await updateIncidenciaEstado(incidenciaSeleccionada.id, 'en_seguimiento');
        }
      }

      // Recargar datos
      const [incidenciasActualizadas, seguimientosActualizados] = await Promise.all([
        getIncidencias(),
        getSeguimientosByIncidencia(incidenciaSeleccionada.id)
      ]);
      
      setIncidencias(incidenciasActualizadas);
      setSeguimientos(seguimientosActualizados);
      
      // Actualizar incidencia seleccionada con nuevo estado
      const incidenciaActualizada = incidenciasActualizadas.find(i => i.id === incidenciaSeleccionada.id);
      if (incidenciaActualizada) {
        setIncidenciaSeleccionada(incidenciaActualizada);
      }
      
      setNotaSeguimiento('');
      setAccionSeguimiento('seguimiento');
    }
    
    setGuardando(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RemeLoader size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Incidencias</h1>
          <p className="text-slate-500 mt-1">Gestión de incidencias reportadas en las Infoplazas.</p>
        </div>
        <ModalIncidencia onSuccess={handleIncidenciaCreada}>
          <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white">
            <Plus className="w-4 h-4" />
            Nueva Incidencia
          </Button>
        </ModalIncidencia>
      </div>

      {/* Tabla de Incidencias */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Incidencias Reportadas ({incidencias.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {incidencias.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay incidencias registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Infoplaza</th>
                    <th className="px-6 py-3 font-medium">Categoría</th>
                    <th className="px-6 py-3 font-medium">Urgencia</th>
                    <th className="px-6 py-3 font-medium">Descripción</th>
                    <th className="px-6 py-3 font-medium text-center">Seguimientos</th>
                    <th className="px-6 py-3 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidencias.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-slate-500 text-xs">
                        {formatFecha(inc.created_at)}
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-800">
                        {inc.infoplaza_nombre}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant="outline" className="text-xs font-normal border-slate-200 capitalize">
                          {inc.categoria}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge className={`text-xs font-medium capitalize ${getUrgenciaColor(inc.urgencia)}`}>
                          {inc.urgencia}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-600 max-w-xs truncate" title={inc.descripcion}>
                        {inc.descripcion}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVerDetalle(inc)}
                            className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {(inc.seguimientos_count ?? 0) > 0 ? (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {(inc.seguimientos_count ?? 0)}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Badge className={`text-xs font-medium capitalize ${getEstadoColor(inc.estado_ticket)}`}>
                          {getEstadoLabel(inc.estado_ticket)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle de Incidencia */}
      <IncidenciaDetalleModal
        incidencia={incidenciaSeleccionada}
        open={!!incidenciaSeleccionada}
        onClose={() => setIncidenciaSeleccionada(null)}
        seguimientos={seguimientos}
        loadingSeguimientos={loadingSeguimientos}
        onAgregarSeguimiento={handleAgregarSeguimiento}
        notaSeguimiento={notaSeguimiento}
        onNotaChange={setNotaSeguimiento}
        accionSeguimiento={accionSeguimiento}
        onAccionChange={setAccionSeguimiento}
        guardando={guardando}
      />
    </div>
  );
};

export default IncidenciasView;
