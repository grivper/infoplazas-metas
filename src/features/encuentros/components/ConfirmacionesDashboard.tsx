import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  getConfirmacionesByEncuentro,
  type Confirmacion,
  type EstadoEnvio,
} from '../services/confirmacionesService';
import {
  getEncuentroByClave,
  updateMensajeTemplate,
  type Encuentro,
} from '../services/encuentrosService';
import { RespuestasTab } from './RespuestasTab';
import { ModalEditarRespuesta } from './ModalEditarRespuesta';

const ENCUENTRO_CLAVE = 'encuentro-regional-dinamizadores-2026';

const estados: Array<{ estado: EstadoEnvio; titulo: string; vacio: string; conAccion: boolean }> = [
  {
    estado: 'pendiente',
    titulo: 'Pendientes de envío',
    vacio: 'No hay confirmaciones pendientes de envío.',
    conAccion: false,
  },
  {
    estado: 'enviado',
    titulo: 'Enviados sin responder',
    vacio: 'No hay confirmaciones enviadas sin respuesta.',
    conAccion: true,
  },
];

const formatFecha = (fecha: string): string => new Intl.DateTimeFormat('es-PA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${fecha}T00:00:00Z`));

const formatRangoFechas = (encuentro: Encuentro): string => (
  `${formatFecha(encuentro.fecha_inicio)} al ${formatFecha(encuentro.fecha_fin)}`
);

export function ConfirmacionesDashboard() {
  const [encuentro, setEncuentro] = useState<Encuentro | null>(null);
  const [confirmaciones, setConfirmaciones] = useState<Confirmacion[]>([]);
  const [mensajeTemplate, setMensajeTemplate] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [confirmacionARegistrar, setConfirmacionARegistrar] = useState<Confirmacion | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const evento = await getEncuentroByClave(ENCUENTRO_CLAVE);
      if (!evento) {
        setEncuentro(null);
        setConfirmaciones([]);
        return;
      }

      const listaConfirmaciones = await getConfirmacionesByEncuentro(evento.id);
      setEncuentro(evento);
      setConfirmaciones(listaConfirmaciones);
      setMensajeTemplate(evento.mensaje_template ?? '');
    } catch (loadError) {
      const mensaje = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron cargar las confirmaciones.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Recarga solo las confirmaciones tras editar una respuesta. No muestra la
  // pantalla de carga (para no volver a la primera pestaña) ni pisa el mensaje
  // que se esté escribiendo.
  const recargarConfirmaciones = useCallback(async () => {
    if (!encuentro) return;
    setConfirmaciones(await getConfirmacionesByEncuentro(encuentro.id));
  }, [encuentro]);

  const confirmacionesPorEstado = useMemo(() => new Map(
    estados.map(({ estado }) => [
      estado,
      confirmaciones.filter((confirmacion) => confirmacion.estado_envio === estado),
    ]),
  ), [confirmaciones]);

  const guardarMensaje = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!encuentro) return;

    setGuardando(true);
    setError('');
    setGuardado(false);

    try {
      await updateMensajeTemplate(encuentro.id, mensajeTemplate);
      setEncuentro((actual) => actual && { ...actual, mensaje_template: mensajeTemplate });
      setGuardado(true);
    } catch (saveError) {
      const mensaje = saveError instanceof Error
        ? saveError.message
        : 'No se pudo guardar el mensaje. Intentá nuevamente.';
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <EstadoCarga texto="Cargando confirmaciones..." />;
  }

  if (error && !encuentro) {
    return <EstadoError error={error} onReintentar={cargarDatos} />;
  }

  if (!encuentro) {
    return (
      <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No se encontró el encuentro regional de dinamizadores 2026.
      </p>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="confirmaciones-title">
      <div>
        <h1 id="confirmaciones-title" className="text-2xl font-bold text-slate-900">{encuentro.nombre}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {formatRangoFechas(encuentro)} · {encuentro.sede}
        </p>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Tabs defaultValue="seguimiento">
        <TabsList aria-label="Secciones de confirmaciones">
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
          <TabsTrigger value="mensaje">Mensaje de confirmación</TabsTrigger>
        </TabsList>

        <TabsContent value="seguimiento" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {estados.map(({ estado, titulo, vacio, conAccion }) => (
              <TablaConfirmaciones
                key={estado}
                titulo={titulo}
                confirmaciones={confirmacionesPorEstado.get(estado) ?? []}
                vacio={vacio}
                onRegistrar={conAccion ? setConfirmacionARegistrar : undefined}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="respuestas" className="mt-6">
          <RespuestasTab confirmaciones={confirmaciones} onActualizada={recargarConfirmaciones} />
        </TabsContent>

        <TabsContent value="mensaje" className="mt-6">
          <form className="space-y-3 rounded-md border border-slate-200 bg-white p-4" onSubmit={guardarMensaje}>
            <div>
              <Label htmlFor="mensaje-template">Mensaje de confirmación</Label>
              <p id="mensaje-template-help" className="mt-1 text-sm text-slate-600">
                Usá {'{nombre}'} para el nombre del dinamizador y {'{link}'} para el enlace de confirmación.
              </p>
            </div>
            <Textarea
              id="mensaje-template"
              value={mensajeTemplate}
              onChange={(event) => {
                setMensajeTemplate(event.target.value);
                setGuardado(false);
              }}
              aria-describedby="mensaje-template-help"
              disabled={guardando}
              rows={6}
            />
            {guardado && <p className="text-sm text-emerald-700" role="status">Mensaje guardado correctamente.</p>}
            <Button type="submit" disabled={guardando}>
              {guardando && <Loader2 className="animate-spin" />}
              {guardando ? 'Guardando...' : 'Guardar mensaje'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <ModalEditarRespuesta
        confirmacion={confirmacionARegistrar}
        onCerrar={() => setConfirmacionARegistrar(null)}
        onGuardado={recargarConfirmaciones}
      />
    </section>
  );
}

interface TablaConfirmacionesProps {
  titulo: string;
  confirmaciones: Confirmacion[];
  vacio: string;
  onRegistrar?: (confirmacion: Confirmacion) => void;
}

function TablaConfirmaciones({
  titulo,
  confirmaciones,
  vacio,
  onRegistrar,
}: TablaConfirmacionesProps) {
  const columnas = onRegistrar ? 4 : 3;

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-1 text-sm text-slate-600">{confirmaciones.length} en total</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Infoplaza</TableHead>
            <TableHead>Dinamizador</TableHead>
            <TableHead>Celular</TableHead>
            {onRegistrar && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {confirmaciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnas} className="text-center text-slate-600">{vacio}</TableCell>
            </TableRow>
          ) : confirmaciones.map((confirmacion) => (
            <TableRow key={confirmacion.id}>
              <TableCell className="font-medium">{confirmacion.dinamizador.infoplaza?.nombre ?? 'Sin infoplaza'}</TableCell>
              <TableCell>{confirmacion.dinamizador.nombre}</TableCell>
              <TableCell>{confirmacion.dinamizador.celular ?? '—'}</TableCell>
              {onRegistrar && (
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onRegistrar(confirmacion)}>
                    Registrar respuesta
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EstadoCarga({ texto }: { texto: string }) {
  return <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">{texto}</p>;
}

function EstadoError({ error, onReintentar }: { error: string; onReintentar: () => Promise<void> }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6">
      <p className="text-sm text-destructive" role="alert">No se pudieron cargar los datos: {error}</p>
      <Button className="mt-4" variant="outline" size="sm" onClick={() => void onReintentar()}>
        Reintentar
      </Button>
    </div>
  );
}
