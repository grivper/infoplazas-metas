import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FilaProvincia } from '@/components/FilaProvincia';
import { FiltroProvincia, TODAS_LAS_PROVINCIAS } from '@/components/FiltroProvincia';
import { agruparPorProvincia, obtenerProvincias } from '@/lib/provincias';
import type { Confirmacion } from '../services/confirmacionesService';
import { DescargarConfirmacionesButton } from './DescargarConfirmacionesButton';
import { ModalEditarRespuesta } from './ModalEditarRespuesta';
import { LIMITE_CENA_EXTRA, LIMITE_HOSPEDAJE, totalCenasACobrar } from '../utils/cuposCena';

interface RespuestasTabProps {
  confirmaciones: Confirmacion[];
  onActualizada: () => Promise<void>;
}

const formatFechaHora = (fecha: string): string => new Intl.DateTimeFormat('es-PA', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(fecha));

/** Pestaña con las respuestas ya recibidas: conteos y tabla editable. */
export function RespuestasTab({ confirmaciones, onActualizada }: RespuestasTabProps) {
  const [confirmacionEnEdicion, setConfirmacionEnEdicion] = useState<Confirmacion | null>(null);
  const [provincia, setProvincia] = useState(TODAS_LAS_PROVINCIAS);

  const respondidas = useMemo(
    () => confirmaciones.filter((confirmacion) => confirmacion.confirmado_at !== null),
    [confirmaciones],
  );

  const provincias = useMemo(
    () => obtenerProvincias(respondidas, (c) => c.dinamizador.infoplaza?.region),
    [respondidas],
  );

  // El filtro solo afecta a la tabla: los contadores y cupos siguen siendo globales.
  const visibles = useMemo(
    () => (provincia === TODAS_LAS_PROVINCIAS
      ? respondidas
      : respondidas.filter((c) => c.dinamizador.infoplaza?.region === provincia)),
    [respondidas, provincia],
  );

  // Agrupa las respuestas por la provincia de la infoplaza.
  const grupos = useMemo(
    () => agruparPorProvincia(visibles, (confirmacion) => confirmacion.dinamizador.infoplaza?.region),
    [visibles],
  );

  const contadores = useMemo(() => {
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
    };
  }, [confirmaciones, respondidas]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Contador titulo="Asisten" valor={`${contadores.asisten} / ${confirmaciones.length}`} />
        <Contador titulo="No asisten" valor={contadores.noAsisten} />
        <Contador titulo="Sin responder" valor={contadores.sinResponder} />
        <Contador titulo="Se hospedan" valor={`${contadores.seHospedan} / ${LIMITE_HOSPEDAJE}`} alerta={contadores.seHospedan >= LIMITE_HOSPEDAJE} />
        <Contador titulo="Cenas extra (no hospedados)" valor={`${contadores.cenanExtra} / ${LIMITE_CENA_EXTRA}`} alerta={contadores.cenanExtra >= LIMITE_CENA_EXTRA} />
        <Contador titulo="Cenas a cobrar" valor={contadores.cenasACobrar} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FiltroProvincia
          value={provincia}
          onChange={setProvincia}
          provincias={provincias}
          className="sm:w-56"
        />
        <DescargarConfirmacionesButton />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Infoplaza</TableHead>
              <TableHead>Dinamizador</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Asistencia</TableHead>
              <TableHead>Hospedaje</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Respondió</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-600">
                  {respondidas.length === 0
                    ? 'Todavía no hay respuestas registradas.'
                    : 'No hay respuestas en esta provincia.'}
                </TableCell>
              </TableRow>
            ) : grupos.flatMap(({ provincia, elementos }) => [
              <FilaProvincia
                key={`provincia-${provincia}`}
                provincia={provincia}
                cantidad={elementos.length}
                columnas={8}
              />,
              ...elementos.map((confirmacion) => (
              <TableRow key={confirmacion.id}>
                <TableCell className="font-medium">
                  {confirmacion.dinamizador.infoplaza?.nombre ?? 'Sin infoplaza'}
                </TableCell>
                <TableCell>{confirmacion.dinamizador.nombre}</TableCell>
                <TableCell>{confirmacion.dinamizador.celular ?? '—'}</TableCell>
                <TableCell>{confirmacion.asiste ? 'Sí' : 'No'}</TableCell>
                <TableCell>{confirmacion.asiste ? (confirmacion.se_hospeda ? 'Sí' : 'No') : '—'}</TableCell>
                <TableCell>{confirmacion.asiste ? (confirmacion.cena ? 'Sí' : 'No') : '—'}</TableCell>
                <TableCell>
                  {confirmacion.confirmado_at ? formatFechaHora(confirmacion.confirmado_at) : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmacionEnEdicion(confirmacion)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
              )),
            ])}
          </TableBody>
        </Table>
      </div>

      <ModalEditarRespuesta
        confirmacion={confirmacionEnEdicion}
        onCerrar={() => setConfirmacionEnEdicion(null)}
        onGuardado={onActualizada}
      />
    </div>
  );
}

function Contador({ titulo, valor, alerta = false }: { titulo: string; valor: number | string; alerta?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${alerta ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-600">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${alerta ? 'text-amber-900' : 'text-slate-900'}`}>{valor}</p>
    </div>
  );
}
