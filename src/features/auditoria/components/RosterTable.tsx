import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RosterTableProps {
  titulo: string;
  descripcion: string;
  columnas: string[];
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
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">{titulo}</h3>
        <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columnas.map((columna) => (
              <TableHead key={columna}>{columna}</TableHead>
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
                className="text-center text-slate-600"
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
