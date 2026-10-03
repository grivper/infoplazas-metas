import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Columna de la tabla; `className` permite ocultarla en pantallas pequeñas. */
export interface ColumnaRoster {
  label: string;
  className?: string;
}

interface RosterTableProps {
  titulo: string;
  descripcion: string;
  columnas: ColumnaRoster[];
  vacio: string;
  /** Sin filas que mostrar: se muestra el mensaje `vacio`. */
  sinFilas: boolean;
  children: ReactNode;
}

export function RosterTable({
  titulo,
  descripcion,
  columnas,
  vacio,
  sinFilas,
  children,
}: RosterTableProps) {
  const cantidadColumnas = columnas.length + 1;

  return (
    <div className="rounded-md border border-border bg-surface-container-lowest">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold text-on-surface">{titulo}</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{descripcion}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columnas.map((columna) => (
              <TableHead key={columna.label} className={columna.className}>
                {columna.label}
              </TableHead>
            ))}
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sinFilas ? (
            <TableRow>
              <TableCell
                colSpan={cantidadColumnas}
                className="text-center text-on-surface-variant"
              >
                {vacio}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}
