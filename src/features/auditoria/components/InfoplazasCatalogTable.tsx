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

const tableHeadClassName = 'text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4';

/** Renders catalog entries grouped by their open or closed status. */
export function InfoplazasCatalogTable({ infoplazas, onToggle }: InfoplazasCatalogTableProps) {
  const abiertas = infoplazas.filter((infoplaza) => !infoplaza.cerrada);
  const cerradas = infoplazas.filter((infoplaza) => infoplaza.cerrada);

  if (infoplazas.length === 0) {
    return <div className="text-center py-12 text-slate-500">No hay infoplazas que mostrar</div>;
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className={`${status.header} px-4 py-3 border-b border-slate-200`}>
        <h3 className={`font-semibold ${status.titleColor}`}>{status.title}</h3>
        <p className={`text-xs ${status.countColor}`}>
          {infoplazas.length} {infoplazas.length === 1 ? 'infoplaza' : 'infoplazas'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[850px]">
          <TableHeader>
            <TableRow className="hover:bg-slate-50">
              <TableHead className={tableHeadClassName}>Nombre</TableHead>
              <TableHead className={tableHeadClassName}>Provincia</TableHead>
              <TableHead className={tableHeadClassName}>Distrito</TableHead>
              <TableHead className={tableHeadClassName}>Corregimiento</TableHead>
              <TableHead className={tableHeadClassName}>Estado</TableHead>
              <TableHead className={tableHeadClassName}>Fecha Cierre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {infoplazas.map((infoplaza) => (
              <TableRow key={infoplaza.id} className="hover:bg-indigo-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-b-0">
                <TableCell className="py-3 px-4 font-medium text-sm text-slate-800 group-hover:text-indigo-800">{infoplaza.nombre}</TableCell>
                <TableCell className="py-3 px-4 text-sm text-slate-500 group-hover:text-slate-700">{infoplaza.region}</TableCell>
                <TableCell className="py-3 px-4 text-sm text-slate-500">{infoplaza.distrito || 'Sin distrito'}</TableCell>
                <TableCell className="py-3 px-4 text-sm text-slate-500">{infoplaza.corregimiento || 'Sin corregimiento'}</TableCell>
                <TableCell className="py-3 px-4">
                  <button onClick={() => onToggle(infoplaza)} className={`flex items-center gap-1 text-sm font-medium ${status.buttonColor}`}>
                    {abierta ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {abierta ? 'Abierta' : 'Cerrada'}
                  </button>
                </TableCell>
                <TableCell className="py-3 px-4 text-sm text-slate-500">{infoplaza.fecha_cierre || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
