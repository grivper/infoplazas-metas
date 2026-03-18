import React from 'react';

/**
 * Componente para mostrar el incremento de visitas con color.
 * Verde: positivo, Rojo: negativo, Gris: neutro.
 */
export const Inc: React.FC<{ v: number | null }> = ({ v }) => {
  if (v === null) return <span className="text-slate-300">—</span>;
  if (v > 0) return <span className="text-emerald-600 font-semibold">+{v}</span>;
  if (v < 0) return <span className="text-rose-600 font-semibold">{v}</span>;
  return <span className="text-slate-400">0.00</span>;
};
