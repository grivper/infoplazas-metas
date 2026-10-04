import { ToggleLeft, ToggleRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Infoplaza } from '../services/infoplazasService';

interface InfoplazasCatalogTableProps {
  infoplazas: Infoplaza[];
  onToggle: (infoplaza: Infoplaza) => void;
}

const tableHeadClassName = 'text-xs font-bold text-on-surface-variant uppercase tracking-wider py-3 px-4';

/** Renders catalog entries grouped by their open or closed status. */
export function InfoplazasCatalogTable({ infoplazas, onToggle }: InfoplazasCatalogTableProps) {
  const abiertas = infoplazas.filter((infoplaza) => !infoplaza.cerrada);
  const cerradas = infoplazas.filter((infoplaza) => infoplaza.cerrada);

  if (infoplazas.length === 0) {
    return <div className="text-center py-12 text-on-surface-variant">No hay infoplazas que mostrar</div>;
  }

  return (
    <>
      {abiertas.length > 0 && <CatalogGroup infoplazas={abiertas} abierta onToggle={onToggle} />}
      {cerradas.length > 0 && <CatalogGroup infoplazas={cerradas} abierta={false} onToggle={onToggle} />}
    </>
  );
}

interface CatalogGroupProps {
  infoplazas: Infoplaza[];
  abierta: boolean;
  onToggle: (infoplaza: Infoplaza) => void;
}

function CatalogGroup({ infoplazas, abierta, onToggle }: CatalogGroupProps) {
  const status = abierta
    ? {
        title: 'Infoplazas Abiertas',
        header: 'bg-emerald-100',
        titleColor: 'text-emerald-800',
        countColor: 'text-emerald-600',
        buttonColor: 'text-emerald-600 hover:text-emerald-700',
      }
    : {
        title: 'Infoplazas Cerradas',
        header: 'bg-rose-100',
        titleColor: 'text-rose-800',
        countColor: 'text-rose-600',
        buttonColor: 'text-rose-600 hover:text-rose-700',
      };

  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest shadow-sm overflow-hidden">
      <div className={`${status.header} px-4 py-3 border-b border-border`}>
        <h3 className={`font-semibold ${status.titleColor}`}>{status.title}</h3>
        <p className={`text-xs ${status.countColor}`}>
          {infoplazas.length} {infoplazas.length === 1 ? 'infoplaza' : 'infoplazas'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-surface-container-low">
              <TableHead className={tableHeadClassName}>Nombre</TableHead>
              <TableHead className={`hidden sm:table-cell ${tableHeadClassName}`}>Provincia</TableHead>
              <TableHead className={`hidden md:table-cell ${tableHeadClassName}`}>Distrito</TableHead>
              <TableHead className={`hidden lg:table-cell ${tableHeadClassName}`}>Corregimiento</TableHead>
              <TableHead className={tableHeadClassName}>Estado</TableHead>
              <TableHead className={`hidden md:table-cell ${tableHeadClassName}`}>Fecha Cierre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {infoplazas.map((infoplaza) => (
              <TableRow key={infoplaza.id} className="hover:bg-primary/10 transition-colors cursor-pointer group border-b border-border/50 last:border-b-0">
                <TableCell className="py-3 px-4 font-medium text-sm text-on-surface group-hover:text-primary">{infoplaza.nombre}</TableCell>
                <TableCell className="hidden sm:table-cell py-3 px-4 text-sm text-on-surface-variant group-hover:text-on-surface">{infoplaza.region}</TableCell>
                <TableCell className="hidden md:table-cell py-3 px-4 text-sm text-on-surface-variant">{infoplaza.distrito || 'Sin distrito'}</TableCell>
                <TableCell className="hidden lg:table-cell py-3 px-4 text-sm text-on-surface-variant">{infoplaza.corregimiento || 'Sin corregimiento'}</TableCell>
                <TableCell className="py-3 px-4">
                  <button onClick={() => onToggle(infoplaza)} className={`flex items-center gap-1 text-sm font-medium ${status.buttonColor}`}>
                    {abierta ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {abierta ? 'Abierta' : 'Cerrada'}
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell py-3 px-4 text-sm text-on-surface-variant">{infoplaza.fecha_cierre || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
