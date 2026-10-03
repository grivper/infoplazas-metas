import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FiltroProvincia } from "@/components/FiltroProvincia";

interface BarraFiltrosRosterProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  provincia: string;
  onProvinciaChange: (valor: string) => void;
  provincias: string[];
  disabled: boolean;
}

/** Buscador de texto y filtro por provincia de la tabla de dinamizadores. */
export function BarraFiltrosRoster({
  busqueda,
  onBusquedaChange,
  provincia,
  onProvinciaChange,
  provincias,
  disabled,
}: BarraFiltrosRosterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline" />
        <Input
          value={busqueda}
          onChange={(event) => onBusquedaChange(event.target.value)}
          placeholder="Buscar por nombre, cédula o código"
          className="pl-9"
          aria-label="Buscar dinamizadores"
          disabled={disabled}
        />
      </div>
      <FiltroProvincia
        value={provincia}
        onChange={onProvinciaChange}
        provincias={provincias}
        disabled={disabled}
        className="sm:w-56"
      />
    </div>
  );
}
