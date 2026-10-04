/**
 * Estilo de pestañas (Radix Tabs) con el mismo aspecto que el menú compartido MenuSecciones:
 * grilla de botones con el ícono arriba en móvil y fila de botones redondeados desde lg.
 * Las pestañas siguen siendo las de Radix; solo cambia la apariencia.
 * Pensado para 3 pestañas (grid-cols-3).
 */
export const LISTA_PESTANAS = 'grid h-auto w-full grid-cols-3 gap-2 bg-transparent p-0 lg:inline-flex lg:w-auto';
export const PESTANA = 'flex-col gap-1 whitespace-normal rounded-xl border border-border bg-surface-container-lowest px-2 py-3 text-center text-xs text-on-surface-variant sm:text-sm lg:flex-row lg:gap-2 lg:whitespace-nowrap lg:rounded-full lg:px-4 lg:py-2 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm';
