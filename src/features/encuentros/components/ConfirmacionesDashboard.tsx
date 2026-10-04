import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ClipboardCheck, ListChecks, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LISTA_PESTANAS, PESTANA } from '@/components/estiloPestanas';
import { Textarea } from '@/components/ui/textarea';
import {
  getConfirmacionesByEncuentro,
  marcarConfirmacionEnviada,
  type Confirmacion,
  type EstadoEnvio,
} from '../services/confirmacionesService';
import {
  ENCUENTRO_CLAVE,
  getEncuentroByClave,
  updateMensajeTemplate,
  type Encuentro,
} from '../services/encuentrosService';
import { TablaConfirmaciones } from './TablaConfirmaciones';
import { buildWhatsappUrl } from '../utils/whatsapp';
import { RespuestasTab } from './RespuestasTab';
import { ModalEditarRespuesta } from './ModalEditarRespuesta';

const estados: Array<{ estado: EstadoEnvio; titulo: string; vacio: string; conAccion: boolean; whatsapp: string | null }> = [
  {
    estado: 'pendiente',
    titulo: 'Pendientes de envío',
    vacio: 'No hay confirmaciones pendientes de envío.',
    conAccion: false,
    whatsapp: 'Enviar WhatsApp',
  },
  {
    estado: 'enviado',
    titulo: 'Enviados sin responder',
    vacio: 'No hay confirmaciones enviadas sin respuesta.',
    conAccion: true,
    whatsapp: 'Reenviar WhatsApp',
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

  // Abre WhatsApp con el mensaje personalizado y marca la confirmación como
  // enviada. La ventana se abre primero (dentro del clic) para que el
  // navegador no la bloquee como popup.
  const enviarWhatsapp = async (confirmacion: Confirmacion) => {
    const url = buildWhatsappUrl(confirmacion, mensajeTemplate);
    if (!url) {
      setError('Esta confirmación no tiene un celular válido.');
      return;
    }

    setError('');
    window.open(url, '_blank', 'noopener,noreferrer');

    try {
      await marcarConfirmacionEnviada(confirmacion.id);
      await recargarConfirmaciones();
    } catch (sendError) {
      const mensaje = sendError instanceof Error
        ? sendError.message
        : 'No se pudo marcar la confirmación como enviada.';
      setError(mensaje);
    }
  };

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
      <p className="rounded-xl bg-surface-container-lowest shadow-card p-6 text-sm text-on-surface-variant">
        No se encontró el Encuentro Regional de Dinamizadores 2026.
      </p>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="confirmaciones-title">
      <div>
        <h1 id="confirmaciones-title" className="text-3xl font-black font-headline tracking-tight text-on-surface">{encuentro.nombre}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {formatRangoFechas(encuentro)} · {encuentro.sede}
        </p>
      </div>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

      <Tabs defaultValue="seguimiento">
        <TabsList aria-label="Secciones de confirmaciones" className={LISTA_PESTANAS}>
          <TabsTrigger value="seguimiento" className={PESTANA}>
            <ListChecks className="h-5 w-5 lg:h-4 lg:w-4" />
            Seguimiento
          </TabsTrigger>
          <TabsTrigger value="respuestas" className={PESTANA}>
            <ClipboardCheck className="h-5 w-5 lg:h-4 lg:w-4" />
            Respuestas
          </TabsTrigger>
          <TabsTrigger value="mensaje" className={PESTANA}>
            <MessageSquare className="h-5 w-5 lg:h-4 lg:w-4" />
            <span className="sm:hidden">Mensaje</span>
            <span className="hidden sm:inline">Mensaje de confirmación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seguimiento" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {estados.map(({ estado, titulo, vacio, conAccion, whatsapp }) => (
              <TablaConfirmaciones
                key={estado}
                titulo={titulo}
                confirmaciones={confirmacionesPorEstado.get(estado) ?? []}
                vacio={vacio}
                onRegistrar={conAccion ? setConfirmacionARegistrar : undefined}
                onEnviarWhatsapp={enviarWhatsapp}
                textoWhatsapp={whatsapp ?? undefined}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="respuestas" className="mt-6">
          <RespuestasTab confirmaciones={confirmaciones} onActualizada={recargarConfirmaciones} />
        </TabsContent>

        <TabsContent value="mensaje" className="mt-6">
          <form className="space-y-3 rounded-xl bg-surface-container-lowest shadow-card p-4" onSubmit={guardarMensaje}>
            <div>
              <Label htmlFor="mensaje-template">Mensaje de confirmación</Label>
              <p id="mensaje-template-help" className="mt-1 text-sm text-on-surface-variant">
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
            {guardado && <p className="text-sm text-tertiary" role="status">Mensaje guardado correctamente.</p>}
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

function EstadoCarga({ texto }: { texto: string }) {
  return <p className="rounded-xl bg-surface-container-lowest shadow-card p-6 text-sm text-on-surface-variant">{texto}</p>;
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
