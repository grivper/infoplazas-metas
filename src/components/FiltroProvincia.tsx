import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Valor del filtro que no restringe ninguna provincia. */
export const TODAS_LAS_PROVINCIAS = "todas";

interface FiltroProvinciaProps {
  value: string;
  onChange: (valor: string) => void;
  provincias: string[];
  disabled?: boolean;
  className?: string;
}

/** Desplegable "Todas las provincias" + una opción por provincia. */
export function FiltroProvincia({
  value,
  onChange,
  provincias,
  disabled = false,
  className,
}: FiltroProvinciaProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} aria-label="Filtrar por provincia">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODAS_LAS_PROVINCIAS}>
          Todas las provincias
        </SelectItem>
        {provincias.map((nombre) => (
          <SelectItem key={nombre} value={nombre}>
            {nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
