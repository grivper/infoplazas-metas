import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getConfirmacionPublica,
  responderConfirmacion,
  type ConfirmacionPublica,
} from './services/confirmacionPublicaService';

type Respuesta = { asiste: boolean; seHospeda: boolean; cena: boolean };

const formatFecha = (fecha: string): string => new Intl.DateTimeFormat('es-PA', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${fecha}T00:00:00Z`));

const formatRangoFechas = (c: ConfirmacionPublica): string => `${formatFecha(c.fechaInicio)} al ${formatFecha(c.fechaFin)}`;

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

  if (cargando) {
    return (
      <PaginaCentrada>
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="size-6 animate-spin" />
          <p>Cargando información...</p>
        </div>
      </PaginaCentrada>
    );
  }

  if (tokenInvalido) {
    return (
      <PaginaCentrada>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            Este enlace de confirmación no es válido o ya no está disponible.
            Contactá al equipo organizador si creés que esto es un error.
          </p>
        </div>
      </PaginaCentrada>
    );
  }

  if (error && !confirmacion) {
    return (
      <PaginaCentrada>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive" role="alert">No se pudo cargar la información: {error}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void cargarDatos()}>
            Reintentar
          </Button>
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
        onGuardado={(respuesta) => {
          setUltimaRespuesta(respuesta);
          setExito(true);
        }}
        onYaRespondido={() => void cargarDatos()}
      />
    </PaginaCentrada>
  );
}

function PaginaCentrada({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 flex items-start justify-center sm:items-center">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/** Encabezado común con el saludo, el nombre del encuentro y sus fechas. */
function EncabezadoConfirmacion({ confirmacion }: { confirmacion: ConfirmacionPublica }) {
  return (
    <>
      <p className="mt-1 text-sm text-slate-600">
        Te esperamos en <span className="font-medium">{confirmacion.encuentroNombre}</span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {formatRangoFechas(confirmacion)} · {confirmacion.sede}
      </p>
    </>
  );
}

/** Resumen de solo lectura: resultado exitoso o respuesta ya registrada antes. */
function ResultadoRespuesta({ confirmacion, respuesta, titulo, nota, pie }: {
  confirmacion: ConfirmacionPublica;
  respuesta: Respuesta;
  titulo: string;
  nota: string;
  pie: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
      <EncabezadoConfirmacion confirmacion={confirmacion} />

      <p className="mt-4 rounded-md bg-slate-100 p-3 text-sm text-slate-700" role="status">{nota}</p>

      <ul className="mt-4 space-y-1 text-sm text-slate-700">
        <li>Asistencia: {respuesta.asiste ? 'Sí' : 'No'}</li>
        {respuesta.asiste && (
          <>
            <li>Hospedaje: {respuesta.seHospeda ? 'Sí' : 'No'}</li>
            <li>Cena: {respuesta.cena ? 'Sí' : 'No'}</li>
          </>
        )}
      </ul>

      <p className="mt-4 text-sm text-slate-600">{pie}</p>
    </div>
  );
}
interface FormularioConfirmacionProps {
  token: string;
  confirmacion: ConfirmacionPublica;
  onGuardado: (respuesta: Respuesta) => void;
  onYaRespondido: () => void;
}
/** Formulario de respuesta: asistencia obligatoria, hospedaje/cena solo si asiste. */
function FormularioConfirmacion({
  token, confirmacion, onGuardado, onYaRespondido,
}: FormularioConfirmacionProps) {
  const [asiste, setAsiste] = useState<boolean | null>(confirmacion.asiste);
  const [seHospeda, setSeHospeda] = useState<boolean>(confirmacion.seHospeda);
  const [cena, setCena] = useState<boolean>(confirmacion.cena);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (asiste === null) return;

    setGuardando(true);
    setError('');

    const respuesta: Respuesta = {
      asiste,
      seHospeda: asiste ? seHospeda : false,
      cena: asiste ? cena : false,
    };

    try {
      const guardadoOk = await responderConfirmacion(token, respuesta);
      if (!guardadoOk) {
        onYaRespondido();
        return;
      }
      onGuardado(respuesta);
    } catch (saveError) {
      const mensaje = saveError instanceof Error
        ? saveError.message
        : 'No se pudo guardar tu respuesta. Intentá nuevamente.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-bold text-slate-900">Hola, {confirmacion.dinamizadorNombre}</h1>
      <EncabezadoConfirmacion confirmacion={confirmacion} />

      <form className="mt-6 space-y-6" onSubmit={guardar}>
        <OpcionSiNo nombre="asiste" pregunta="¿Vas a asistir?" valor={asiste} onChange={setAsiste} />

        {asiste && (
          <>
            <OpcionSiNo nombre="hospedaje" pregunta="¿Te vas a hospedar?" valor={seHospeda} onChange={setSeHospeda} />
            <OpcionSiNo nombre="cena" pregunta="¿Vas a cenar?" valor={cena} onChange={setCena} />
          </>
        )}

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

        <Button type="submit" disabled={guardando || asiste === null} className="w-full">
          {guardando && <Loader2 className="animate-spin" />}
          {guardando ? 'Guardando...' : 'Guardar respuesta'}
        </Button>
      </form>
    </div>
  );
}

interface OpcionSiNoProps {
  nombre: string;
  pregunta: string;
  valor: boolean | null;
  onChange: (valor: boolean) => void;
}
/** Pregunta Sí/No accesible mediante fieldset + inputs radio. */
function OpcionSiNo({ nombre, pregunta, valor, onChange }: OpcionSiNoProps) {
  const opciones: Array<{ sufijo: string; etiqueta: string; marcado: boolean; valor: boolean }> = [
    { sufijo: 'si', etiqueta: 'Sí', marcado: valor === true, valor: true },
    { sufijo: 'no', etiqueta: 'No', marcado: valor === false, valor: false },
  ];

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-900">{pregunta}</legend>
      <div className="mt-2 flex gap-4">
        {opciones.map(({ sufijo, etiqueta, marcado, valor: opcionValor }) => (
          <div key={sufijo} className="flex items-center gap-2">
            <input
              id={`${nombre}-${sufijo}`}
              type="radio"
              name={nombre}
              checked={marcado}
              onChange={() => onChange(opcionValor)}
              className="size-4"
            />
            <Label htmlFor={`${nombre}-${sufijo}`}>{etiqueta}</Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
