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
import { agruparPorProvincia } from '@/lib/provincias';
import type { Confirmacion } from '../services/confirmacionesService';
import { ModalEditarRespuesta } from './ModalEditarRespuesta';

interface RespuestasTabProps {
  confirmaciones: Confirmacion[];
  onActualizada: () => Promise<void>;
}

// Cupos máximos del encuentro; deben coincidir con los límites validados en la función SQL
// de la migración 20260624120000_encuentros_cupos_hospedaje_cena.
const CUPO_HOSPEDAJE = 52;
const CUPO_CENA = 62;

const formatFechaHora = (fecha: string): string => new Intl.DateTimeFormat('es-PA', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(fecha));

/** Pestaña con las respuestas ya recibidas: conteos y tabla editable. */
export function RespuestasTab({ confirmaciones, onActualizada }: RespuestasTabProps) {
  const [confirmacionEnEdicion, setConfirmacionEnEdicion] = useState<Confirmacion | null>(null);

  const respondidas = useMemo(
    () => confirmaciones.filter((confirmacion) => confirmacion.confirmado_at !== null),
    [confirmaciones],
  );

  // Agrupa las respuestas por la provincia de la infoplaza.
  const grupos = useMemo(
    () => agruparPorProvincia(respondidas, (confirmacion) => confirmacion.dinamizador.infoplaza?.region),
    [respondidas],
  );

  const contadores = useMemo(() => ({
    asisten: respondidas.filter((confirmacion) => confirmacion.asiste === true).length,
    noAsisten: respondidas.filter((confirmacion) => confirmacion.asiste === false).length,
    sinResponder: confirmaciones.length - respondidas.length,
    seHospedan: respondidas.filter((confirmacion) => confirmacion.se_hospeda === true).length,
    cenan: respondidas.filter((confirmacion) => confirmacion.cena === true).length,
  }), [confirmaciones, respondidas]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-5">
        <Contador titulo="Asisten" valor={`${contadores.asisten} / ${confirmaciones.length}`} />
        <Contador titulo="No asisten" valor={contadores.noAsisten} />
        <Contador titulo="Sin responder" valor={contadores.sinResponder} />
        <Contador titulo="Se hospedan" valor={`${contadores.seHospedan} / ${CUPO_HOSPEDAJE}`} alerta={contadores.seHospedan >= CUPO_HOSPEDAJE} />
        <Contador titulo="Cenan" valor={`${contadores.cenan} / ${CUPO_CENA}`} alerta={contadores.cenan >= CUPO_CENA} />
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
            {respondidas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-600">
                  Todavía no hay respuestas registradas.
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
