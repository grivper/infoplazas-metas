import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  updateRespuestaConfirmacion,
  type Confirmacion,
} from '../services/confirmacionesService';

interface ModalEditarRespuestaProps {
  confirmacion: Confirmacion | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}

/** Edita la respuesta registrada de un dinamizador (asistencia, hospedaje y cena). */
export function ModalEditarRespuesta({
  confirmacion,
  onCerrar,
  onGuardado,
}: ModalEditarRespuestaProps) {
  const [asiste, setAsiste] = useState<boolean | null>(null);
  const [seHospeda, setSeHospeda] = useState(false);
  const [cena, setCena] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (confirmacion) {
      setAsiste(confirmacion.asiste);
      setSeHospeda(confirmacion.se_hospeda ?? false);
      setCena(confirmacion.cena ?? false);
      setError('');
    }
  }, [confirmacion]);

  const esRegistroNuevo = confirmacion?.confirmado_at === null;

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmacion || asiste === null) return;

    setGuardando(true);
    setError('');

    try {
      // El servicio aplica las reglas: sin asistencia no hay hospedaje/cena y el hospedaje incluye cena.
      await updateRespuestaConfirmacion(confirmacion.id, { asiste, seHospeda, cena });
      await onGuardado();
      onCerrar();
    } catch (saveError) {
      const mensaje = saveError instanceof Error
        ? saveError.message
        : 'No se pudo guardar la respuesta. Intentá nuevamente.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={confirmacion !== null}
      onOpenChange={(open) => !open && !guardando && onCerrar()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esRegistroNuevo ? 'Registrar respuesta' : 'Editar respuesta'}</DialogTitle>
          <DialogDescription>
            {esRegistroNuevo ? 'Registrar respuesta por el dinamizador' : 'Editar la respuesta del dinamizador'}
            {' · '}
            {confirmacion?.dinamizador.nombre} · {confirmacion?.dinamizador.infoplaza?.nombre ?? 'Sin infoplaza'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={guardar}>
          <OpcionSiNo
            nombre="asiste"
            pregunta="¿Va a asistir?"
            valor={asiste}
            onChange={setAsiste}
            disabled={guardando}
          />

          {asiste && (
            <>
              <OpcionSiNo
                nombre="hospedaje"
                pregunta="¿Se va a hospedar?"
                valor={seHospeda}
                onChange={(val) => {
                  setSeHospeda(val);
                  if (val) setCena(true);
                }}
                disabled={guardando}
              />
              {seHospeda ? (
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  <span className="font-semibold">Cena:</span> Incluida automáticamente con el hospedaje.
                </div>
              ) : (
                <OpcionSiNo
                  nombre="cena"
                  pregunta="¿Va a cenar?"
                  valor={cena}
                  onChange={setCena}
                  disabled={guardando}
                />
              )}
            </>
          )}

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || asiste === null}>
              {guardando && <Loader2 className="animate-spin" />}
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface OpcionSiNoProps {
  nombre: string;
  pregunta: string;
  valor: boolean | null;
  onChange: (valor: boolean) => void;
  disabled: boolean;
}

/** Pregunta Sí/No accesible mediante fieldset + inputs radio. */
function OpcionSiNo({ nombre, pregunta, valor, onChange, disabled }: OpcionSiNoProps) {
  const opciones: Array<{ sufijo: string; etiqueta: string; marcado: boolean; valor: boolean }> = [
    { sufijo: 'si', etiqueta: 'Sí', marcado: valor === true, valor: true },
    { sufijo: 'no', etiqueta: 'No', marcado: valor === false, valor: false },
  ];

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-medium text-slate-900">{pregunta}</legend>
      <div className="mt-2 flex gap-4">
        {opciones.map(({ sufijo, etiqueta, marcado, valor: opcionValor }) => (
          <div key={sufijo} className="flex items-center gap-2">
            <input
              id={`modal-${nombre}-${sufijo}`}
              type="radio"
              name={`modal-${nombre}`}
              checked={marcado}
              onChange={() => onChange(opcionValor)}
              className="size-4"
            />
            <Label htmlFor={`modal-${nombre}-${sufijo}`}>{etiqueta}</Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
