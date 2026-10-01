import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDinamizador,
  updateDinamizador,
} from "../services/dinamizadoresService";
import type {
  Dinamizador,
  DinamizadorEstatus,
  DinamizadorInput,
  InfoplazaCatalogo,
} from "../services/dinamizadoresService";

interface ModalDinamizadorProps {
  abierto: boolean;
  dinamizador: Dinamizador | null;
  infoplazaPreseleccionada: string | null;
  infoplazas: InfoplazaCatalogo[];
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}

const initialForm: DinamizadorInput = {
  infoplaza_codigo: "",
  nombre: "",
  cedula: "",
  celular: "",
  email: "",
  sexo: "",
  talla: "",
  estatus: "Activo",
};

const toForm = (
  dinamizador: Dinamizador | null,
  infoplazaPreseleccionada: string | null,
): DinamizadorInput => {
  if (!dinamizador) {
    return { ...initialForm, infoplaza_codigo: infoplazaPreseleccionada ?? "" };
  }

  return {
    infoplaza_codigo: dinamizador.infoplaza_codigo,
    nombre: dinamizador.nombre,
    cedula: dinamizador.cedula ?? "",
    celular: dinamizador.celular ?? "",
    email: dinamizador.email ?? "",
    sexo: dinamizador.sexo ?? "",
    talla: dinamizador.talla ?? "",
    estatus: dinamizador.estatus,
  };
};

export function ModalDinamizador({
  abierto,
  dinamizador,
  infoplazaPreseleccionada,
  infoplazas,
  onCerrar,
  onGuardado,
}: ModalDinamizadorProps) {
  const [form, setForm] = useState<DinamizadorInput>(initialForm);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setForm(toForm(dinamizador, infoplazaPreseleccionada));
      setError("");
    }
  }, [abierto, dinamizador, infoplazaPreseleccionada]);

  const actualizarCampo = <K extends keyof DinamizadorInput>(
    campo: K,
    valor: DinamizadorInput[K],
  ) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const manejarEnvio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.infoplaza_codigo || !form.nombre.trim()) {
      setError("Seleccioná una infoplaza e ingresá el nombre del dinamizador.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      if (dinamizador) await updateDinamizador(dinamizador.id, form);
      else await createDinamizador(form);
      await onGuardado();
      onCerrar();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudieron guardar los cambios. Intentá nuevamente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={(open) => !open && !guardando && onCerrar()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {dinamizador ? "Editar dinamizador" : "Agregar dinamizador"}
          </DialogTitle>
          <DialogDescription>
            Completá los datos del dinamizador y su infoplaza asignada.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={manejarEnvio}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="infoplaza">Infoplaza *</Label>
              <Select
                value={form.infoplaza_codigo}
                onValueChange={(value) =>
                  actualizarCampo("infoplaza_codigo", value)
                }
                disabled={guardando || infoplazas.length === 0}
              >
                <SelectTrigger id="infoplaza">
                  <SelectValue placeholder="Seleccioná una infoplaza" />
                </SelectTrigger>
                <SelectContent>
                  {infoplazas.map((infoplaza) => (
                    <SelectItem key={infoplaza.codigo} value={infoplaza.codigo}>
                      {infoplaza.nombre} ({infoplaza.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {infoplazas.length === 0 && (
                <p className="text-sm text-destructive">
                  No hay infoplazas disponibles para seleccionar.
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(event) =>
                  actualizarCampo("nombre", event.target.value)
                }
                disabled={guardando}
                required
              />
            </div>
            <CampoTexto
              etiqueta="Cédula"
              id="cedula"
              value={form.cedula}
              disabled={guardando}
              onChange={(value) => actualizarCampo("cedula", value)}
            />
            <CampoTexto
              etiqueta="Celular"
              id="celular"
              value={form.celular}
              disabled={guardando}
              onChange={(value) => actualizarCampo("celular", value)}
            />
            <CampoTexto
              etiqueta="Correo electrónico"
              id="email"
              type="email"
              value={form.email}
              disabled={guardando}
              onChange={(value) => actualizarCampo("email", value)}
            />
            <CampoTexto
              etiqueta="Sexo"
              id="sexo"
              value={form.sexo}
              disabled={guardando}
              onChange={(value) => actualizarCampo("sexo", value)}
            />
            <CampoTexto
              etiqueta="Talla"
              id="talla"
              value={form.talla}
              disabled={guardando}
              onChange={(value) => actualizarCampo("talla", value)}
            />
            <div className="space-y-2">
              <Label htmlFor="estatus">Estatus</Label>
              <Select
                value={form.estatus}
                onValueChange={(value) =>
                  actualizarCampo("estatus", value as DinamizadorEstatus)
                }
                disabled={guardando}
              >
                <SelectTrigger id="estatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando || infoplazas.length === 0}
            >
              {guardando && <Loader2 className="animate-spin" />}
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CampoTextoProps {
  etiqueta: string;
  id: string;
  value: string;
  type?: "email" | "text";
  disabled: boolean;
  onChange: (value: string) => void;
}

function CampoTexto({
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
