import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Confirmacion } from '../services/confirmacionesService';

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
  const conAcciones = Boolean(onRegistrar || onEnviarWhatsapp);
  const columnas = conAcciones ? 4 : 3;

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-1 text-sm text-slate-600">{confirmaciones.length} en total</p>
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
          {confirmaciones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnas} className="text-center text-slate-600">{vacio}</TableCell>
            </TableRow>
          ) : confirmaciones.map((confirmacion) => (
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
