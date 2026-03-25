"use client";

/**
 * Combobox con búsqueda integrada.
 * Props:
 * - value: valor seleccionado
 * - onValueChange: callback al seleccionar
 * - placeholder: texto cuando no hay selección
 * - children: elementos con prop 'value' (usan fragments o buttons)
 * - className: estilos adicionales
 */
import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export function Combobox({
  value,
  onValueChange,
  placeholder = "Seleccionar...",
  children,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  // Extraer items del children - filtrar elementos válidos con value
  const childArray = React.Children.toArray(children);
  const items = childArray.filter((child): child is React.ReactElement<{ value: string; children: React.ReactNode }> => {
    if (!React.isValidElement(child)) return false;
    const props = child.props as { value?: unknown; children?: unknown };
    return typeof props.value === 'string';
  });

  // Filtrar por búsqueda
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const label = String(item.props.children).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  // Encontrar el valor seleccionado
  const selectedItem = items.find((item) => item.props.value === value);

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-slate-400 ring-offset-2"
        )}
      >
        <span className={selectedItem ? "text-slate-900" : "text-slate-400"}>
          {selectedItem ? selectedItem.props.children : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredItems.length === 0 ? (
              <div className="p-2 text-sm text-slate-500 text-center">
                No hay resultados
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.props.value}
                  type="button"
                  onClick={() => {
                    onValueChange(item.props.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center rounded-sm px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer",
                    value === item.props.value && "bg-slate-100 text-slate-900"
                  )}
                >
                  <span className="flex-1 text-left">{item.props.children}</span>
                  {value === item.props.value && (
                    <Check className="h-4 w-4 text-slate-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}