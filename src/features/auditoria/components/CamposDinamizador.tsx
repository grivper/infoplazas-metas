import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Valor interno para "sin dato": Radix no admite un SelectItem con value "". */
const SIN_ESPECIFICAR = "__sin_especificar__";

interface CampoTextoProps {
  etiqueta: string;
  id: string;
  value: string;
  type?: "email" | "text";
  disabled: boolean;
  onChange: (value: string) => void;
}

export function CampoTexto({
  etiqueta,
  id,
  value,
  type = "text",
  disabled,
  onChange,
}: CampoTextoProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

interface CampoSelectProps {
  etiqueta: string;
  id: string;
  value: string;
  opciones: readonly string[];
  disabled: boolean;
  onChange: (value: string) => void;
}

/**
 * Desplegable de un campo opcional. Si el valor guardado no está en la lista
 * (datos cargados antes del desplegable), se agrega como opción extra para no
 * perderlo ni mostrar el campo vacío al editar.
 */
export function CampoSelect({
  etiqueta,
  id,
  value,
  opciones,
  disabled,
  onChange,
}: CampoSelectProps) {
  const opcionesVisibles =
    value && !opciones.includes(value) ? [...opciones, value] : opciones;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Select
        value={value || SIN_ESPECIFICAR}
        onValueChange={(nuevo) =>
          onChange(nuevo === SIN_ESPECIFICAR ? "" : nuevo)
        }
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SIN_ESPECIFICAR}>Sin especificar</SelectItem>
          {opcionesVisibles.map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
