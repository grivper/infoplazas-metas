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
import { ResumenRespuestas } from './ResumenRespuestas';

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

  return (
    <div className="space-y-4">
      <ResumenRespuestas confirmaciones={confirmaciones} respondidas={respondidas} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FiltroProvincia
          value={provincia}
          onChange={setProvincia}
          provincias={provincias}
          className="sm:w-56"
        />
        <DescargarConfirmacionesButton />
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Infoplaza</TableHead>
              <TableHead className="hidden sm:table-cell">Dinamizador</TableHead>
              <TableHead className="hidden md:table-cell">Celular</TableHead>
              <TableHead>Asistencia</TableHead>
              <TableHead className="hidden md:table-cell">Hospedaje</TableHead>
              <TableHead className="hidden md:table-cell">Cena</TableHead>
              <TableHead className="hidden sm:table-cell">Respondió</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-on-surface-variant">
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
                <TableCell className="hidden sm:table-cell">{confirmacion.dinamizador.nombre}</TableCell>
                <TableCell className="hidden md:table-cell">{confirmacion.dinamizador.celular ?? '—'}</TableCell>
                <TableCell>{confirmacion.asiste ? 'Sí' : 'No'}</TableCell>
                <TableCell className="hidden md:table-cell">{confirmacion.asiste ? (confirmacion.se_hospeda ? 'Sí' : 'No') : '—'}</TableCell>
                <TableCell className="hidden md:table-cell">{confirmacion.asiste ? (confirmacion.cena ? 'Sí' : 'No') : '—'}</TableCell>
                <TableCell className="hidden sm:table-cell">
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
