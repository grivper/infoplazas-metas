import { useMemo } from 'react';
import type { Confirmacion } from '../services/confirmacionesService';
import { LIMITE_CENA_EXTRA, LIMITE_HOSPEDAJE, totalCenasACobrar } from '../utils/cuposCena';
import { contarHospedadosPorSexo } from '../utils/hospedadosPorSexo';

interface ResumenRespuestasProps {
  confirmaciones: Confirmacion[];
  respondidas: Confirmacion[];
}

/**
 * Resumen de la pestaña Respuestas en tres tarjetas: asistencia, hospedaje y cenas.
 * Los conteos son globales: no dependen del filtro de provincia de la tabla.
 */
export function ResumenRespuestas({ confirmaciones, respondidas }: ResumenRespuestasProps) {
  const conteos = useMemo(() => {
    const seHospedan = respondidas.filter((confirmacion) => confirmacion.se_hospeda === true).length;
    // Cenas extra: solo cuentan las de quienes asisten pero NO se hospedan.
    // La cena de un hospedado es automática y no forma parte de este cupo de 10.
    const cenanExtra = respondidas.filter(
      (confirmacion) => confirmacion.se_hospeda === false && confirmacion.cena === true,
    ).length;
    return {
      asisten: respondidas.filter((confirmacion) => confirmacion.asiste === true).length,
      noAsisten: respondidas.filter((confirmacion) => confirmacion.asiste === false).length,
      sinResponder: confirmaciones.length - respondidas.length,
      seHospedan,
      cenanExtra,
      cenasACobrar: totalCenasACobrar(seHospedan, cenanExtra),
      porSexo: contarHospedadosPorSexo(respondidas),
    };
  }, [confirmaciones, respondidas]);

  return (
    <div className="space-y-4">
      {/* Cupos con tope: lo más importante, con barra de progreso */}
      <div className="grid gap-4 md:grid-cols-2">
        <Tarjeta titulo="Hospedaje">
          <Cupo titulo="Se hospedan" valor={conteos.seHospedan} limite={LIMITE_HOSPEDAJE} />
        </Tarjeta>
        <Tarjeta titulo="Cenas">
          <Cupo titulo="Cenas extra (no hospedados)" valor={conteos.cenanExtra} limite={LIMITE_CENA_EXTRA} />
        </Tarjeta>
      </div>

      {/* Conteos simples, sin tope */}
      <Tarjeta titulo="Resumen">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Dato titulo="Asisten" valor={conteos.asisten} total={confirmaciones.length} />
          <Dato titulo="No asisten" valor={conteos.noAsisten} />
          <Dato titulo="Sin responder" valor={conteos.sinResponder} />
          <Dato titulo="Mujeres hospedadas" valor={conteos.porSexo.mujeres} />
          <Dato titulo="Hombres hospedados" valor={conteos.porSexo.hombres} />
          <Dato titulo="Cenas a cobrar" valor={conteos.cenasACobrar} />
        </div>
        {conteos.porSexo.sinDato > 0 && (
          <p className="text-xs text-on-surface-variant">
            {conteos.porSexo.sinDato} hospedado(s) sin dato de sexo registrado.
          </p>
        )}
      </Tarjeta>
    </div>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-card">
      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{titulo}</h3>
      {children}
    </section>
  );
}

/** Un número con su etiqueta; `total` opcional se muestra como "/ total". */
function Dato({ titulo, valor, total }: { titulo: string; valor: number; total?: number }) {
  return (
    <div>
      <p className="text-2xl font-black text-on-surface">
        {valor}
        {total !== undefined && <span className="ml-1 text-sm font-medium text-outline">/ {total}</span>}
      </p>
      <p className="text-xs text-on-surface-variant">{titulo}</p>
    </div>
  );
}

/** Cupo con tope: muestra el avance y se pone ámbar al llegar al límite. */
function Cupo({ titulo, valor, limite }: { titulo: string; valor: number; limite: number }) {
  const completo = valor >= limite;
  const porcentaje = Math.min((valor / limite) * 100, 100);

  return (
    <div>
      <p className={`text-4xl font-black ${completo ? 'text-amber-900' : 'text-on-surface'}`}>
        {valor}
        <span className="ml-1 text-lg font-medium text-outline">/ {limite}</span>
      </p>
      <p className="text-xs text-on-surface-variant">
        {titulo}
        {completo && <span className="ml-1 font-semibold text-amber-900">· Cupo completo</span>}
      </p>
      <div
        role="progressbar"
        aria-label={titulo}
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-valuenow={Math.min(valor, limite)}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${completo ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
