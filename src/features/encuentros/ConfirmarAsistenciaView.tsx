import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getConfirmacionPublica,
  responderConfirmacion,
  type ConfirmacionPublica,
} from './services/confirmacionPublicaService';
import { EncabezadoConfirmacion, ResultadoRespuesta, type Respuesta } from './components/ResultadoRespuesta';
import { OpcionSiNo } from './components/OpcionSiNo';
import { SeccionHospedajeCena } from './components/SeccionHospedajeCena';

/** Vista pública de autoconfirmación de asistencia, accesible sin sesión mediante /confirmar/:token. */
export function ConfirmarAsistenciaView() {
  const { token } = useParams<{ token: string }>();
  const [confirmacion, setConfirmacion] = useState<ConfirmacionPublica | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tokenInvalido, setTokenInvalido] = useState(false);
  const [exito, setExito] = useState(false);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<Respuesta | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!token) {
      setTokenInvalido(true);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError('');
    setTokenInvalido(false);

    try {
      const datos = await getConfirmacionPublica(token);
      if (!datos) {
        setTokenInvalido(true);
        setConfirmacion(null);
        return;
      }
      setConfirmacion(datos);
    } catch (loadError) {
      const mensaje = loadError instanceof Error
        ? loadError.message
        : 'No se pudo cargar la información de confirmación.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { void cargarDatos(); }, [cargarDatos]);

  // Cada rama temprana cubre un estado excluyente de la pantalla pública:
  // cargando, token inválido, error de carga, respuesta recién guardada,
  // respuesta ya registrada previamente, o el formulario inicial.
  if (cargando) {
    return (
      <PaginaCentrada>
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="size-6 animate-spin text-emerald-700" />
          <p className="text-sm font-medium">Cargando información...</p>
        </div>
      </PaginaCentrada>
    );
  }

  if (tokenInvalido) {
    return (
      <PaginaCentrada>
        <div className="rounded-2xl border border-destructive/25 bg-white p-6 text-center shadow-xl shadow-slate-950/5">
          <p className="text-sm text-destructive" role="alert">
            Este enlace de confirmación no es válido o ya no está disponible. Contactá al equipo organizador si creés que esto es un error.
          </p>
        </div>
      </PaginaCentrada>
    );
  }

  if (error && !confirmacion) {
    return (
      <PaginaCentrada>
        <div className="rounded-2xl border border-destructive/25 bg-white p-6 text-center shadow-xl shadow-slate-950/5">
          <p className="text-sm text-destructive" role="alert">No se pudo cargar la información: {error}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void cargarDatos()}>Reintentar</Button>
        </div>
      </PaginaCentrada>
    );
  }

  if (!confirmacion) return null;

  if (exito && ultimaRespuesta) {
    return (
      <PaginaCentrada>
        <ResultadoRespuesta
          confirmacion={confirmacion}
          respuesta={ultimaRespuesta}
          titulo={`¡Gracias, ${confirmacion.dinamizadorNombre}!`}
          nota="Guardamos tu respuesta."
          estado="recién guardada"
          pie="Si necesitás cambiar algo, contactá al organizador."
        />
      </PaginaCentrada>
    );
  }

  if (confirmacion.respondido) {
    return (
      <PaginaCentrada>
        <ResultadoRespuesta
          confirmacion={confirmacion}
          respuesta={{ asiste: Boolean(confirmacion.asiste), seHospeda: confirmacion.seHospeda, cena: confirmacion.cena }}
          titulo={`Hola, ${confirmacion.dinamizadorNombre}`}
          nota="Tu respuesta ya fue registrada."
          estado="registro previo"
          pie="Si necesitás cambiarla, contactá al organizador."
        />
      </PaginaCentrada>
    );
  }

  return (
    <PaginaCentrada>
      <FormularioConfirmacion
        token={token as string}
        confirmacion={confirmacion}
        onGuardado={(respuesta) => { setUltimaRespuesta(respuesta); setExito(true); }}
        onYaRespondido={() => void cargarDatos()}
      />
    </PaginaCentrada>
  );
}

function PaginaCentrada({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#f4f5ff] px-4 py-8 sm:px-6 md:py-10">
      <div className="pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-emerald-200/30 blur-3xl" />
      <main className="relative w-full max-w-3xl">{children}</main>
    </div>
  );
}

interface FormularioConfirmacionProps { token: string; confirmacion: ConfirmacionPublica; onGuardado: (respuesta: Respuesta) => void; onYaRespondido: () => void; }
/** Formulario de respuesta: asistencia obligatoria, hospedaje/cena solo si asiste. */
function FormularioConfirmacion({ token, confirmacion, onGuardado, onYaRespondido }: FormularioConfirmacionProps) {
  const [asiste, setAsiste] = useState<boolean | null>(confirmacion.asiste);
  const [seHospeda, setSeHospeda] = useState<boolean | null>(null);
  const [cena, setCena] = useState<boolean | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const hayCupoHospedaje = confirmacion.cuposHospedajeDisponibles > 0;
  const hayCupoCena = confirmacion.cuposCenaDisponibles > 0;
  const requiereRespuestaHospedaje = asiste === true && hayCupoHospedaje;
  const requiereRespuestaCena = asiste === true && hayCupoCena && (!hayCupoHospedaje || seHospeda === false);
  // Cada pregunta visible requiere una elección explícita antes de habilitar el envío.
  const respuestasVisiblesCompletas = (!requiereRespuestaHospedaje || seHospeda !== null)
    && (!requiereRespuestaCena || cena !== null);
  const puedeGuardar = asiste !== null && (asiste === false || respuestasVisiblesCompletas);

  const handleCambioHospedaje = (quiereHospedarse: boolean) => {
    setSeHospeda(quiereHospedarse);
    if (quiereHospedarse) setCena(true); else setCena(null);
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!puedeGuardar) return;
    setGuardando(true);
    setError('');
    const respuesta: Respuesta = {
      asiste,
      seHospeda: asiste && hayCupoHospedaje ? (seHospeda ?? false) : false,
      cena: asiste ? (seHospeda === true ? true : (hayCupoCena ? (cena ?? false) : false)) : false,
    };
    try {
      const guardadoOk = await responderConfirmacion(token, respuesta);
      if (!guardadoOk) { onYaRespondido(); return; }
      onGuardado(respuesta);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar tu respuesta. Intentá nuevamente.');
    } finally { setGuardando(false); }
  };

  return (
    <section className="space-y-6">
      <EncabezadoConfirmacion confirmacion={confirmacion} titulo={`Hola, ${confirmacion.dinamizadorNombre}`} />
      <form className="space-y-6" onSubmit={guardar}>
        <OpcionSiNo nombre="asiste" pregunta="¿Vas a asistir?" valor={asiste} onChange={setAsiste} />
        {asiste === true && (
          <SeccionHospedajeCena
            hayCupoHospedaje={hayCupoHospedaje}
            hayCupoCena={hayCupoCena}
            seHospeda={seHospeda}
            cena={cena}
            onCambioHospedaje={handleCambioHospedaje}
            onCambioCena={setCena}
          />
        )}
        {error && (
          <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <Button type="submit" disabled={guardando || !puedeGuardar} className="h-12 w-full bg-emerald-700 font-semibold shadow-sm hover:bg-emerald-800 focus-visible:ring-emerald-700">
            {guardando && <Loader2 className="animate-spin" />}{guardando ? 'Guardando...' : 'Guardar respuesta'}
          </Button>
        </div>
      </form>
    </section>
  );
}
