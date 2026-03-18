import { Wifi, WifiOff, Printer, Server, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { KpaxUnificado } from '../types/kpaxUnificado';

interface RadarDeviceCardProps {
  dispositivo: KpaxUnificado;
  infoplazaNombre?: string;
  onMotivoChange?: (numeroSerie: string, motivo: string) => Promise<void>;
}

const MOTIVOS_FALLA = [
  "Pendiente de Revisión",
  "Sin Internet (Proveedor)",
  "Falla Eléctrica (Gabinete)",
  "Cableado Dañado/Desconectado",
  "Equipo Apagado Manualmente",
  "Daño de Hardware (Tarjeta Red)",
  "Pérdida de IP/Configuración",
  "Infoplaza Cerrada",
  "Sin Dinamizador",
  "Kit de Mantenimiento",
  "Falta de Tintas"
];

/**
 * Tarjeta individual de dispositivo KPAX
 * Muestra estado, información de la impresora y del agente
 * Permite asignar motivo de falla cuando es crítico
 */
export const RadarDeviceCard: React.FC<RadarDeviceCardProps> = ({ 
  dispositivo, 
  infoplazaNombre,
  onMotivoChange 
}) => {
  const isCritico = dispositivo.estado === 'critico';
  
  // Verificar si el agente está caído
  const agenteCaido = dispositivo.inactividad_agente?.toLowerCase().includes('mes') ||
                       dispositivo.inactividad_agente?.toLowerCase().includes('semana');

  // Handler para cambiar motivo
  const handleMotivoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const motivo = e.target.value;
    if (!motivo || !onMotivoChange) return;
    
    try {
      await onMotivoChange(dispositivo.numero_serie, motivo);
    } catch (err) {
      console.error('Error actualizando motivo:', err);
      alert('No se pudo guardar el motivo');
    }
  };

  return (
    <div className={`
      border rounded-xl p-4 shadow-sm hover:shadow-md transition-all
      ${isCritico 
        ? 'border-rose-200 bg-rose-50/30' 
        : 'border-slate-200 bg-white'
      }
    `}>
      {/* Header: Estado + Nombre */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            p-1.5 rounded-md
            ${isCritico ? 'bg-rose-100' : 'bg-emerald-100'}
          `}>
            {isCritico 
              ? <WifiOff className="w-4 h-4 text-rose-600" />
              : <Wifi className="w-4 h-4 text-emerald-600" />
            }
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
              {infoplazaNombre || dispositivo.nombre_agente || dispositivo.ubicacion || 'Sin asignar'}
            </h3>
            <Badge 
              variant="outline" 
              className={`
                text-[10px] uppercase font-bold mt-1 border-none px-0
                ${isCritico ? 'text-rose-500' : 'text-emerald-500'}
              `}
            >
              {isCritico ? 'ALERTA DE DESCONEXIÓN' : 'ESTABLE'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info de la Impresora */}
      <div className="space-y-1 mb-3">
        <p className="text-xs text-slate-600 flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">{dispositivo.fabricante}</span>
          <span className="text-slate-400">{dispositivo.modelo}</span>
        </p>
        <p className="text-[11px] text-slate-400 font-mono">
          {dispositivo.ip || 'Sin IP'} • {dispositivo.numero_serie}
        </p>
      </div>

      {/* Info de Inactividad */}
      <div className="space-y-1.5">
        {/* Inactividad de la Impresora */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Impresora:
          </span>
          <span className={`
            text-xs font-semibold
            ${isCritico ? 'text-rose-600' : 'text-slate-600'}
          `}>
            {dispositivo.inactividad_impresora || 'Reciente'}
          </span>
        </div>

        {/* Inactividad del Agente */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Server className="w-3 h-3" />
            Agente:
          </span>
          <span className={`
            text-xs font-semibold
            ${agenteCaido ? 'text-rose-600' : 'text-slate-600'}
          `}>
            {dispositivo.inactividad_agente || 'OK'}
            {agenteCaido && ' ⚠️'}
          </span>
        </div>
      </div>

      {/* Hostname del Agente */}
      {dispositivo.hostname_agente && (
        <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
          Server: {dispositivo.hostname_agente}
        </p>
      )}

      {/* Motivo de Falla (si existe) - visible en KPAX y Reporte */}
      {isCritico && dispositivo.motivo_falla && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-500 mb-1">Motivo:</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
            {dispositivo.motivo_falla}
          </span>
        </div>
      )}

      {/* Selector de Motivo de Falla (solo en Reporte - cuando no tiene motivo) */}
      {isCritico && onMotivoChange && !dispositivo.motivo_falla && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <label className="text-[10px] text-slate-500 mb-1 block">
            Asignar motivo:
          </label>
          <select 
            value=""
            onChange={handleMotivoChange}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="">Seleccionar motivo...</option>
            {MOTIVOS_FALLA.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
