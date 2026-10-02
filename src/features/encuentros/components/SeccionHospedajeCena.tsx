import { Aviso } from './Aviso';
import { OpcionSiNo } from './OpcionSiNo';

const AVISO_HORARIO_CENA = (
  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 shadow-sm">
    🕐 La cena será de 7:00 p. m. a 8:00 p. m.
  </p>
);

const AVISO_CENA_INCLUIDA = (
  <Aviso tipo="exito">
    <span className="font-semibold">✅ Cena:</span> Incluida automáticamente con tu hospedaje.
  </Aviso>
);

interface SeccionHospedajeCenaProps {
  hayCupoHospedaje: boolean;
  hayCupoCena: boolean;
  seHospeda: boolean | null;
  cena: boolean | null;
  onCambioHospedaje: (quiereHospedarse: boolean) => void;
  onCambioCena: (quiereCenar: boolean) => void;
}

/**
 * Sección de hospedaje y cena del formulario de confirmación.
 * El contenido depende de la disponibilidad de cupos (4 combinaciones) y de las
 * elecciones previas del usuario.
 */
export function SeccionHospedajeCena({
  hayCupoHospedaje,
  hayCupoCena,
  seHospeda,
  cena,
  onCambioHospedaje,
  onCambioCena,
}: SeccionHospedajeCenaProps) {
  // CASO 4: ni hospedaje ni cena tienen cupo -> un solo mensaje combinado.
  if (!hayCupoHospedaje && !hayCupoCena) {
    return (
      <Aviso tipo="advertencia">
        <p className="font-medium">😔 Lamentablemente los cupos de hospedaje y cena ya fueron completados.</p>
        <p className="mt-1">¡Igual puedes asistir al evento viajando desde tu Infoplaza!</p>
        <p className="mt-1 text-xs">No hay hospedaje ni cena disponibles para esta modalidad.</p>
      </Aviso>
    );
  }

  // CASO 2: sin cupo de hospedaje, pero sí de cena -> mensaje de hospedaje + pregunta de cena.
  if (!hayCupoHospedaje && hayCupoCena) {
    return (
      <>
        <Aviso tipo="advertencia">
          <p className="font-medium">😔 Lamentablemente los cupos de hospedaje ya fueron completados.</p>
          <p className="mt-1">¡Pero puedes asistir al evento viajando desde tu Infoplaza!</p>
        </Aviso>
        {AVISO_HORARIO_CENA}
        <OpcionSiNo nombre="cena" pregunta="¿Vas a cenar?" valor={cena} onChange={onCambioCena} />
      </>
    );
  }

  // CASO 3: sí hay cupo de hospedaje, pero no de cena -> pregunta de hospedaje y,
  // si no se hospeda, aviso de que tampoco hay cena disponible.
  if (hayCupoHospedaje && !hayCupoCena) {
    return (
      <>
        <OpcionSiNo nombre="hospedaje" pregunta="¿Te vas a hospedar?" valor={seHospeda} onChange={onCambioHospedaje} />
        {seHospeda === true && AVISO_CENA_INCLUIDA}
        {seHospeda === false && (
          <Aviso tipo="advertencia">
            <p className="font-medium">😔 Los cupos de cena ya fueron completados.</p>
            <p className="mt-1">Puedes confirmar tu asistencia y viajar desde tu Infoplaza.</p>
            <p className="mt-1 text-xs">No hay cena disponible para esta modalidad.</p>
          </Aviso>
        )}
      </>
    );
  }

  // CASO 1: ambos tienen cupo -> flujo normal con ambas preguntas.
  return (
    <>
      <OpcionSiNo nombre="hospedaje" pregunta="¿Te vas a hospedar?" valor={seHospeda} onChange={onCambioHospedaje} />
      {seHospeda === true && AVISO_CENA_INCLUIDA}
      {seHospeda === false && (
        <>
          {AVISO_HORARIO_CENA}
          <OpcionSiNo nombre="cena" pregunta="¿Vas a cenar?" valor={cena} onChange={onCambioCena} />
        </>
      )}
    </>
  );
}
