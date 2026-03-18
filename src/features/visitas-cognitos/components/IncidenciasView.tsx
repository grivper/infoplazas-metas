import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, MessageSquare, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { ModalIncidencia } from './ModalIncidencia';
import { 
  getIncidencias, 
  getSeguimientosByIncidencia,
  createSeguimiento,
  updateIncidenciaEstado,
  type Incidencia, 
  type Seguimiento
} from '../services/incidenciasDb';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  // Colores por urgencia
  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'bg-rose-100 text-rose-700 hover:bg-rose-100';
      case 'media': return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
      case 'baja': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Colores por estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-rose-100 text-rose-700';
      case 'en_seguimiento': return 'bg-amber-100 text-amber-700';
      case 'resuelto': return 'bg-emerald-100 text-emerald-700';
      case 'escalado': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Labels de estado
  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'Abierto';
      case 'en_seguimiento': return 'En seguimiento';
      case 'resuelto': return 'Resuelto';
      case 'escalado': return 'Escalado';
      default: return estado;
    }
  };

  // Labels de acción
  const getAccionLabel = (accion: string) => {
    switch (accion) {
      case 'seguimiento': return 'Seguimiento';
      case 'resuelto': return 'Marcar resuelto';
      case 'escalado': return 'Escalar a supervisor';
      default: return accion;
    }
  };

  // Formatear fecha
  const formatFecha = (fecha?: string) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
                      <td className="px-6 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleVerDetalle(inc)}
                          className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Badge className={`ml-2 text-xs font-medium capitalize ${getEstadoColor(inc.estado_ticket)}`}>
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
      <Dialog open={!!incidenciaSeleccionada} onOpenChange={(open) => !open && setIncidenciaSeleccionada(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {incidenciaSeleccionada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Detalle de Incidencia
                  <Badge className={`text-xs font-medium capitalize ${getEstadoColor(incidenciaSeleccionada.estado_ticket)}`}>
                    {getEstadoLabel(incidenciaSeleccionada.estado_ticket)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Info de la incidencia */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Infoplaza:</span>
                    <span className="text-sm font-medium">{incidenciaSeleccionada.infoplaza_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Categoría:</span>
                    <span className="text-sm font-medium capitalize">{incidenciaSeleccionada.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Urgencia:</span>
                    <Badge className={`text-xs font-medium capitalize ${getUrgenciaColor(incidenciaSeleccionada.urgencia)}`}>
                      {incidenciaSeleccionada.urgencia}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Fecha:</span>
                    <span className="text-sm font-medium">{formatFecha(incidenciaSeleccionada.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Descripción:</span>
                    <p className="text-sm mt-1 p-2 bg-white rounded border">{incidenciaSeleccionada.descripcion}</p>
                  </div>
                </div>

                {/* Historial de seguimientos */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Historial de Seguimientos
                  </h4>
                  {loadingSeguimientos ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  ) : seguimientos.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">No hay seguimientos registrados.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {seguimientos.map((seg) => (
                        <div key={seg.id} className="bg-white border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <Badge className={`text-xs ${seg.accion === 'resuelto' ? 'bg-emerald-100 text-emerald-700' : seg.accion === 'escalado' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                              {getAccionLabel(seg.accion)}
                            </Badge>
                            <span className="text-xs text-slate-400">{formatFecha(seg.created_at)}</span>
                          </div>
                          <p className="text-sm text-slate-700">{seg.nota}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulario de seguimiento */}
                {incidenciaSeleccionada.estado_ticket !== 'resuelto' && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Agregar Seguimiento</h4>
                    <Textarea
                      value={notaSeguimiento}
                      onChange={(e) => setNotaSeguimiento(e.target.value)}
                      placeholder="Describe qué hiciste, qué esperas, qué acciones realizaste..."
                      className="mb-2 min-h-[80px]"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={accionSeguimiento === 'seguimiento' ? 'default' : 'outline'}
                        onClick={() => setAccionSeguimiento('seguimiento')}
                        className={accionSeguimiento === 'seguimiento' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Seguimiento
                      </Button>
                      <Button
                        size="sm"
                        variant={accionSeguimiento === 'resuelto' ? 'default' : 'outline'}
                        onClick={() => setAccionSeguimiento('resuelto')}
                        className={accionSeguimiento === 'resuelto' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resuelto
                      </Button>
                      <Button
                        size="sm"
                        variant={accionSeguimiento === 'escalado' ? 'default' : 'outline'}
                        onClick={() => setAccionSeguimiento('escalado')}
                        className={accionSeguimiento === 'escalado' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Escalar
                      </Button>
                      <Button
                        size="sm"
                        className="ml-auto bg-slate-900 hover:bg-slate-800"
                        onClick={handleAgregarSeguimiento}
                        disabled={!notaSeguimiento.trim() || guardando}
                      >
                        {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidenciasView;
