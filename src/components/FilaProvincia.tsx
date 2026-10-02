import { TableCell, TableRow } from "@/components/ui/table";

/** Fila separadora con el nombre de la provincia y su cantidad de filas. */
export function FilaProvincia({
  provincia,
  cantidad,
  columnas,
}: {
  provincia: string;
  cantidad: number;
  /** Cantidad total de columnas de la tabla, incluida la de acciones. */
  columnas: number;
}) {
  return (
    <TableRow className="bg-slate-50 hover:bg-slate-50">
      <TableCell
        colSpan={columnas}
        className="py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
      >
        {provincia} · {cantidad}
      </TableCell>
    </TableRow>
  );
}
