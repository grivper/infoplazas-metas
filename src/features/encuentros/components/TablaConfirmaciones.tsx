import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilaProvincia } from '@/components/FilaProvincia';
import { FiltroProvincia, TODAS_LAS_PROVINCIAS } from '@/components/FiltroProvincia';
import { agruparPorProvincia, obtenerProvincias } from '@/lib/provincias';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Confirmacion } from '../services/confirmacionesService';

/** Minúsculas y sin tildes, para que "nata" encuentre "Natá". */
const normalizar = (texto: string): string => texto
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

interface TablaConfirmacionesProps {
  titulo: string;
  confirmaciones: Confirmacion[];
  vacio: string;
  onRegistrar?: (confirmacion: Confirmacion) => void;
  /** Si se pasa, muestra el botón de WhatsApp por fila. */
  onEnviarWhatsapp?: (confirmacion: Confirmacion) => void;
  textoWhatsapp?: string;
}

export function TablaConfirmaciones({
  titulo,
  confirmaciones,
  vacio,
  onRegistrar,
  onEnviarWhatsapp,
  textoWhatsapp = 'Enviar WhatsApp',
}: TablaConfirmacionesProps) {
  const [busqueda, setBusqueda] = useState('');
  const [provincia, setProvincia] = useState(TODAS_LAS_PROVINCIAS);
  const conAcciones = Boolean(onRegistrar || onEnviarWhatsapp);

  const provincias = useMemo(
    () => obtenerProvincias(confirmaciones, (c) => c.dinamizador.infoplaza?.region),
    [confirmaciones],
  );

  // Filtra por provincia y luego por infoplaza, dinamizador o celular.
  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    const deProvincia = provincia === TODAS_LAS_PROVINCIAS
      ? confirmaciones
      : confirmaciones.filter(({ dinamizador }) => dinamizador.infoplaza?.region === provincia);
    if (!termino) return deProvincia;

    return deProvincia.filter(({ dinamizador }) => normalizar(
      `${dinamizador.infoplaza?.nombre ?? ''} ${dinamizador.nombre} ${dinamizador.celular ?? ''}`,
    ).includes(termino));
  }, [confirmaciones, busqueda, provincia]);

  // Agrupa por la provincia de la infoplaza, ya aplicado el filtro.
  const grupos = useMemo(
    () => agruparPorProvincia(visibles, (confirmacion) => confirmacion.dinamizador.infoplaza?.region),
    [visibles],
  );
  const columnas = conAcciones ? 4 : 3;

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold text-on-surface">{titulo}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {busqueda.trim() || provincia !== TODAS_LAS_PROVINCIAS
            ? `${visibles.length} de ${confirmaciones.length}`
            : `${confirmaciones.length} en total`}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por infoplaza, nombre o celular"
              aria-label={`Buscar en ${titulo}`}
              className="pl-8"
            />
          </div>
          <FiltroProvincia
            value={provincia}
            onChange={setProvincia}
            provincias={provincias}
            className="sm:w-44"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Infoplaza</TableHead>
            <TableHead className="hidden sm:table-cell">Dinamizador</TableHead>
            <TableHead className="hidden md:table-cell">Celular</TableHead>
            {conAcciones && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnas} className="text-center text-on-surface-variant">
                {confirmaciones.length === 0 ? vacio : 'Sin resultados para la búsqueda.'}
              </TableCell>
            </TableRow>
          ) : grupos.flatMap(({ provincia, elementos }) => [
            <FilaProvincia
              key={`provincia-${provincia}`}
              provincia={provincia}
              cantidad={elementos.length}
              columnas={columnas}
            />,
            ...elementos.map((confirmacion) => (
            <TableRow key={confirmacion.id}>
              <TableCell className="font-medium">{confirmacion.dinamizador.infoplaza?.nombre ?? 'Sin infoplaza'}</TableCell>
              <TableCell className="hidden sm:table-cell">{confirmacion.dinamizador.nombre}</TableCell>
              <TableCell className="hidden md:table-cell">{confirmacion.dinamizador.celular ?? '—'}</TableCell>
              {conAcciones && (
                <TableCell className="space-x-2 sm:whitespace-nowrap">
                  {onEnviarWhatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!confirmacion.dinamizador.celular}
                      onClick={() => onEnviarWhatsapp(confirmacion)}
                    >
                      {textoWhatsapp}
                    </Button>
                  )}
                  {onRegistrar && (
                    <Button variant="outline" size="sm" onClick={() => onRegistrar(confirmacion)}>
                      Registrar respuesta
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          )),
          ])}
        </TableBody>
      </Table>
    </div>
  );
}
