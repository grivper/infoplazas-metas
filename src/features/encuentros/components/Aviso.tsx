import type { ReactNode } from 'react';

interface AvisoProps { children: ReactNode; tipo: 'exito' | 'advertencia'; }

/** Caja de aviso reutilizable (éxito en verde esmeralda, advertencia en ámbar). */
export function Aviso({ children, tipo }: AvisoProps) {
  const estilos = tipo === 'exito'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : 'border-amber-200 bg-amber-50 text-amber-900';
  return <div className={`rounded-2xl border bg-white p-4 text-base shadow-sm ${estilos}`}>{children}</div>;
}
