import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const conAcciones = Boolean(onRegistrar || onEnviarWhatsapp);

  // Filtra por infoplaza, dinamizador o celular.
  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    if (!termino) return confirmaciones;

    return confirmaciones.filter(({ dinamizador }) => normalizar(
      `${dinamizador.infoplaza?.nombre ?? ''} ${dinamizador.nombre} ${dinamizador.celular ?? ''}`,
    ).includes(termino));
  }, [confirmaciones, busqueda]);

  const columnas = conAcciones ? 4 : 3;

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {busqueda.trim()
            ? `${visibles.length} de ${confirmaciones.length}`
            : `${confirmaciones.length} en total`}
        </p>
        <div className="relative mt-3">
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
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Infoplaza</TableHead>
            <TableHead>Dinamizador</TableHead>
            <TableHead>Celular</TableHead>
            {conAcciones && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnas} className="text-center text-slate-600">
                {confirmaciones.length === 0 ? vacio : 'Sin resultados para la búsqueda.'}
              </TableCell>
            </TableRow>
          ) : visibles.map((confirmacion) => (
            <TableRow key={confirmacion.id}>
              <TableCell className="font-medium">{confirmacion.dinamizador.infoplaza?.nombre ?? 'Sin infoplaza'}</TableCell>
              <TableCell>{confirmacion.dinamizador.nombre}</TableCell>
              <TableCell>{confirmacion.dinamizador.celular ?? '—'}</TableCell>
              {conAcciones && (
                <TableCell className="space-x-2 whitespace-nowrap">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
