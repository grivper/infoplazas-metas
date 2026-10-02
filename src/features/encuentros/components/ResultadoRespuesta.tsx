import { BedDouble, CalendarDays, CheckCircle2, CircleCheck, Info, MapPin, ReceiptText, UserCheck, Utensils } from 'lucide-react';
import type { ConfirmacionPublica } from '../services/confirmacionPublicaService';

export type Respuesta = { asiste: boolean; seHospeda: boolean; cena: boolean };

const formatFecha = (fecha: string): string => new Intl.DateTimeFormat('es-PA', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${fecha}T00:00:00Z`));

const formatRangoFechas = (c: ConfirmacionPublica): string => `${formatFecha(c.fechaInicio)} al ${formatFecha(c.fechaFin)}`;

/** Encabezado ejecutivo común con saludo, encuentro y metadatos. */
export function EncabezadoConfirmacion({ confirmacion, titulo }: { confirmacion: ConfirmacionPublica; titulo: string }) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-sky-100 via-teal-50 to-emerald-50 px-5 py-6 text-slate-900 shadow-sm sm:px-7 sm:py-8">
      <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-sky-200/45 blur-3xl" />
      <div className="relative">
        <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">Confirmación de asistencia</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
        <p className="mt-2 text-base leading-6 text-slate-600">Te esperamos en el <span className="font-semibold text-slate-800">{confirmacion.encuentroNombre}</span></p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm"><CalendarDays className="size-3.5 text-emerald-700" aria-hidden="true" />{formatRangoFechas(confirmacion)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm"><MapPin className="size-3.5 text-emerald-700" aria-hidden="true" />{confirmacion.sede}</span>
        </div>
      </div>
    </header>
  );
}

interface ResultadoRespuestaProps {
  confirmacion: ConfirmacionPublica;
  respuesta: Respuesta;
  titulo: string;
  nota: string;
  estado: 'recién guardada' | 'registro previo';
  pie: string;
}

/** Resumen de solo lectura: distingue una respuesta recién guardada de un registro previo. */
export function ResultadoRespuesta({ confirmacion, respuesta, titulo, nota, estado, pie }: ResultadoRespuestaProps) {
  const esRegistroNuevo = estado === 'recién guardada';
  const selecciones = [
    { etiqueta: 'Asistencia', valor: respuesta.asiste, icono: UserCheck },
    ...(respuesta.asiste
      ? [
        { etiqueta: 'Hospedaje', valor: respuesta.seHospeda, icono: BedDouble },
        { etiqueta: 'Cena', valor: respuesta.cena, icono: Utensils },
      ]
      : []),
  ];

  return (
    <section className="space-y-6">
      <EncabezadoConfirmacion confirmacion={confirmacion} titulo={titulo} />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            {esRegistroNuevo ? 'Respuesta recién guardada' : 'Respuesta registrada'}
          </span>
        </div>
        <p className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-medium text-emerald-950" role="status">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
          {nota}
        </p>
      </div>
      <section aria-labelledby="resumen-seleccion" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 id="resumen-seleccion" className="text-base font-bold uppercase tracking-wider text-slate-800">Resumen de tu selección</h2>
          <ReceiptText className="size-4 text-slate-500" aria-hidden="true" />
        </div>
        <ul className="mt-3 space-y-2.5">
          {selecciones.map(({ etiqueta, valor, icono: Icono }) => (
            <li key={etiqueta} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="flex items-center gap-3 font-semibold text-slate-800">
                <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                {etiqueta}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${valor ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                <span aria-hidden="true">{valor ? '✓' : '—'}</span>
                {valor ? 'Sí' : 'No'}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <aside className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 text-base leading-6 text-slate-700">
        <Info className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-slate-900">Contacto</h2>
          <p>{pie}</p>
        </div>
      </aside>
    </section>
  );
}
