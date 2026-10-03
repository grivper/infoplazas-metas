import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Página 404: se muestra dentro del layout cuando la ruta no existe.
 */
export const NotFoundView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl font-black text-primary font-headline">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 font-headline">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-md text-slate-500">
        La dirección que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
};
