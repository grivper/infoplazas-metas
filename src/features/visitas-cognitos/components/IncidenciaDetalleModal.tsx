import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { RemeLoader } from '@/components/ui/reme-loader';
import { getUrgenciaColor, getEstadoColor, getEstadoLabel, getAccionLabel, formatFecha } from './incidenciasUtils';
import type { Incidencia, Seguimiento } from '../services/incidenciasDb';

interface IncidenciaDetalleModalProps {
  incidencia: Incidencia | null;
  open: boolean;
  onClose: () => void;
  seguimientos: Seguimiento[];
  loadingSeguimientos: boolean;
  onAgregarSeguimiento: () => Promise<void>;
  notaSeguimiento: string;
  onNotaChange: (value: string) => void;
  accionSeguimiento: 'seguimiento' | 'resuelto' | 'escalado';
  onAccionChange: (value: 'seguimiento' | 'resuelto' | 'escalado') => void;
  guardando: boolean;
}

export function IncidenciaDetalleModal({
  incidencia,
  open,
  onClose,
  seguimientos,
  loadingSeguimientos,
  onAgregarSeguimiento,
  notaSeguimiento,
  onNotaChange,
  accionSeguimiento,
  onAccionChange,
  guardando,
}: IncidenciaDetalleModalProps) {
  if (!incidencia) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalle de Incidencia
            <Badge className={`text-xs font-medium capitalize ${getEstadoColor(incidencia.estado_ticket)}`}>
              {getEstadoLabel(incidencia.estado_ticket)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Infoplaza:</span>
              <span className="text-sm font-medium">{incidencia.infoplaza_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Categoría:</span>
              <span className="text-sm font-medium capitalize">{incidencia.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Urgencia:</span>
              <Badge className={`text-xs font-medium capitalize ${getUrgenciaColor(incidencia.urgencia)}`}>
                {incidencia.urgencia}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Fecha:</span>
              <span className="text-sm font-medium">{formatFecha(incidencia.created_at)}</span>
            </div>
            <div>
              <span className="text-sm text-slate-500">Descripción:</span>
              <p className="text-sm mt-1 p-2 bg-white rounded border">{incidencia.descripcion}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Historial de Seguimientos
            </h4>
            {loadingSeguimientos ? (
              <div className="flex justify-center py-4">
                <RemeLoader size={24} />
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

          {incidencia.estado_ticket !== 'resuelto' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Agregar Seguimiento</h4>
              <Textarea
                value={notaSeguimiento}
                onChange={(e) => onNotaChange(e.target.value)}
                placeholder="Describe qué hiciste, qué esperas, qué acciones realizaste..."
                className="mb-2 min-h-[80px]"
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={accionSeguimiento === 'seguimiento' ? 'default' : 'outline'}
                  onClick={() => onAccionChange('seguimiento')}
                  className={accionSeguimiento === 'seguimiento' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Seguimiento
                </Button>
                <Button
                  size="sm"
                  variant={accionSeguimiento === 'resuelto' ? 'default' : 'outline'}
                  onClick={() => onAccionChange('resuelto')}
                  className={accionSeguimiento === 'resuelto' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Resuelto
                </Button>
                <Button
                  size="sm"
                  variant={accionSeguimiento === 'escalado' ? 'default' : 'outline'}
                  onClick={() => onAccionChange('escalado')}
                  className={accionSeguimiento === 'escalado' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Escalar
                </Button>
                <Button
                  size="sm"
                  className="ml-auto bg-slate-900 hover:bg-slate-800"
                  onClick={onAgregarSeguimiento}
                  disabled={!notaSeguimiento.trim() || guardando}
                >
                  {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
