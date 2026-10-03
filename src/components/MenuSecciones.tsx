import React from 'react';

export interface ItemMenu<Id extends string> {
  id: Id;
  label: string;
  /** Texto corto para móvil; si no se indica, se usa `label` */
  labelCorto?: string;
  icon: React.ElementType;
}

interface MenuSeccionesProps<Id extends string> {
  items: ItemMenu<Id>[];
  activo: Id;
  onChange: (id: Id) => void;
  ariaLabel: string;
}

/**
 * Menú de secciones de una pantalla.
 * En móvil es una grilla de botones con el ícono arriba (3 o 4 secciones siempre visibles,
 * sin scroll); desde lg pasa a una fila de botones redondeados.
 */
export function MenuSecciones<Id extends string>({
  items,
  activo,
  onChange,
  ariaLabel,
}: MenuSeccionesProps<Id>) {
  // Con 3 secciones van en una sola fila; con 4 (u otra cantidad) en dos columnas
  const columnas = items.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div role="tablist" aria-label={ariaLabel} className={`grid ${columnas} gap-2 w-full lg:flex lg:w-auto`}>
      {items.map(({ id, label, labelCorto, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activo === id}
          onClick={() => onChange(id)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-all sm:text-sm lg:shrink-0 lg:flex-row lg:gap-2 lg:whitespace-nowrap lg:rounded-full lg:px-4 lg:py-2 ${
            activo === id
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-surface-container-lowest text-on-surface-variant border-border hover:bg-surface-container-low hover:text-on-surface'
          }`}
        >
          <Icon className="w-5 h-5 lg:w-4 lg:h-4" />
          {labelCorto ? (
            <>
              <span className="sm:hidden">{labelCorto}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : (
            label
          )}
        </button>
      ))}
    </div>
  );
}
