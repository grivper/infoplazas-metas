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
import type { Confirmacion } from '../services/confirmacionesService';
import { ModalEditarRespuesta } from './ModalEditarRespuesta';

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

  const respondidas = useMemo(
    () => confirmaciones.filter((confirmacion) => confirmacion.confirmado_at !== null),
    [confirmaciones],
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
        <Contador titulo="Asisten" valor={contadores.asisten} />
        <Contador titulo="No asisten" valor={contadores.noAsisten} />
        <Contador titulo="Sin responder" valor={contadores.sinResponder} />
        <Contador titulo="Se hospedan" valor={contadores.seHospedan} />
        <Contador titulo="Cenan" valor={contadores.cenan} />
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
            ) : respondidas.map((confirmacion) => (
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
            ))}
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

function Contador({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
