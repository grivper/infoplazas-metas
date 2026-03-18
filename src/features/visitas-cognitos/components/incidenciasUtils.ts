export const getUrgenciaColor = (urgencia: string) => {
  switch (urgencia) {
    case 'alta': return 'bg-rose-100 text-rose-700 hover:bg-rose-100';
    case 'media': return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
    case 'baja': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'abierto': return 'bg-rose-100 text-rose-700';
    case 'en_seguimiento': return 'bg-amber-100 text-amber-700';
    case 'resuelto': return 'bg-emerald-100 text-emerald-700';
    case 'escalado': return 'bg-indigo-100 text-indigo-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'abierto': return 'Abierto';
    case 'en_seguimiento': return 'En seguimiento';
    case 'resuelto': return 'Resuelto';
    case 'escalado': return 'Escalado';
    default: return estado;
  }
};

export const getAccionLabel = (accion: string) => {
  switch (accion) {
    case 'seguimiento': return 'Seguimiento';
    case 'resuelto': return 'Marcar resuelto';
    case 'escalado': return 'Escalar a supervisor';
    default: return accion;
  }
};

export const formatFecha = (fecha?: string) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
