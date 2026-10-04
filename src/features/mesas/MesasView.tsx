import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/bento-card';
import { MesaForm } from './components/MesaForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAllMesas, upsertMesa, deleteMesa, getCatalogoInfoplazas,
  type MesaRecord, type InfoplazaCatalogo,
} from './services/mesasDb';

/**
 * Mapeo de estados de mesa con label, color e icono para UI.
 */
const ESTADOS: Record<MesaRecord['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:       { label: 'Pendiente',       color: 'bg-surface-container text-on-surface-variant',         icon: <Clock className="w-3 h-3" /> },
  en_progreso:     { label: 'En Progreso',     color: 'bg-amber-100 text-amber-700',         icon: <AlertCircle className="w-3 h-3" /> },
  completada:      { label: 'Completada',      color: 'bg-emerald-100 text-emerald-700',     icon: <CheckCircle2 className="w-3 h-3" /> },
  por_graduacion:  { label: 'Por Graduación',  color: 'bg-purple-100 text-purple-700',       icon: <GraduationCap className="w-3 h-3" /> },
  por_certificado: { label: 'Por Certificado', color: 'bg-sky-100 text-sky-700',             icon: <Award className="w-3 h-3" /> },
};

/** Orden de provincias para agrupación visual consistente */
const ORDEN_REGIONES = ['Coclé', 'Herrera', 'Los Santos'];

// --- Subcomponente: Fila de tabla ---
const MesaRow: React.FC<{
  m: MesaRecord;
  onEdit: (m: MesaRecord) => void;
  onDelete: (id: string) => void;
}> = ({ m, onEdit, onDelete }) => {
  const est = ESTADOS[m.estado];
  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors">
      <td className="px-4 py-3 font-medium text-on-surface">{m.infoplaza}</td>
      <td className="px-4 py-3 text-on-surface">Mesa {m.mesa}</td>
      <td className="hidden md:table-cell px-4 py-3">
        <span className="font-bold text-indigo-600">{m.sesionActual}</span>
        <span className="text-outline"> / 10</span>
      </td>
      <td className="hidden sm:table-cell px-4 py-3 text-on-surface">{m.participantes}</td>
      <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">{m.dinamizador || '—'}</td>
      <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant">{m.email || '—'}</td>
      <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">{m.fechaInicio || '—'}</td>
      <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">{m.fechaFin || '—'}</td>
      <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant">{m.fechaGraduacion || '—'}</td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className={`gap-1 ${est.color}`}>{est.icon} {est.label}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(m)}>
            <Edit2 className="w-3.5 h-3.5 text-on-surface-variant" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(m.mesa_id)}>
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// --- Componente Principal ---
const MesasView: React.FC = () => {
  const [mesas, setMesas] = useState<MesaRecord[]>([]);
  const [catalogo, setCatalogo] = useState<InfoplazaCatalogo[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<MesaRecord | null>(null);

  useEffect(() => {
    getAllMesas().then(setMesas);
    getCatalogoInfoplazas().then(setCatalogo);
  }, []);

  const handleNewMesa = useCallback(() => { setEditing(null); setOpenDialog(true); }, []);
  const handleEditMesa = useCallback((m: MesaRecord) => { setEditing(m); setOpenDialog(true); }, []);
  const handleSave = useCallback(async (record: MesaRecord) => {
    await upsertMesa(record);
    setMesas(await getAllMesas());
    setOpenDialog(false);
    setEditing(null);
  }, []);
  const handleDelete = useCallback(async (id: string) => {
    try { await deleteMesa(id); setMesas(await getAllMesas()); }
    catch { alert('Error al eliminar la mesa. Intenta de nuevo.'); }
  }, []);

  // Agrupar por región respetando el orden definido
  const agrupadas = useMemo(() => {
    const grupos: Record<string, MesaRecord[]> = {};
    ORDEN_REGIONES.forEach(r => { grupos[r] = []; });
    
    // Ordenar dentro de cada provincia: infoplaza ASC, mesa ASC
    const ordenadas = [...mesas].sort((a, b) => a.infoplaza.localeCompare(b.infoplaza) || a.mesa - b.mesa);
    ordenadas.forEach(m => {
      const region = ORDEN_REGIONES.includes(m.region) ? m.region : 'Otra';
      if (!grupos[region]) grupos[region] = [];
      grupos[region].push(m);
    });
    return grupos;
  }, [mesas]);

  // KPIs
  const totalMesas = mesas.length;
  const infoplazasActivas = new Set(mesas.map(m => m.infoplaza)).size;
  const completadas = mesas.filter(m => m.estado === 'completada').length;
  const enProgreso = mesas.filter(m => m.estado === 'en_progreso').length;

  // Headers (sin Región porque va como agrupador)
  // `oculta` esconde la columna en pantallas pequeñas (misma clase que usa su celda en MesaRow)
  const headers = [
    { label: 'Infoplaza' },
    { label: 'Mesa' },
    { label: 'Sesión', oculta: 'hidden md:table-cell' },
    { label: 'Participantes', oculta: 'hidden sm:table-cell' },
    { label: 'Dinamizador', oculta: 'hidden md:table-cell' },
    { label: 'Email', oculta: 'hidden lg:table-cell' },
    { label: 'Inicio', oculta: 'hidden md:table-cell' },
    { label: 'Fin', oculta: 'hidden md:table-cell' },
    { label: 'Graduación', oculta: 'hidden lg:table-cell' },
    { label: 'Estado' },
    { label: '' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Mesas de Transformación</h1>
          <p className="text-on-surface-variant mt-1">Seguimiento de 21 Infoplazas • 3 Mesas × 10 Sesiones</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleNewMesa}>
          <Plus className="w-4 h-4" /> Nueva Mesa
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Infoplazas Activas', value: `${infoplazasActivas} / 21`, color: 'indigo' as const },
          { title: 'Total Mesas', value: totalMesas, color: 'violet' as const },
          { title: 'En Progreso', value: enProgreso, color: 'amber' as const },
          { title: 'Completadas', value: completadas, color: 'emerald' as const },
        ].map(k => <StatCard key={k.title} title={k.title} value={k.value} color={k.color} />)}
      </div>

      {/* Modal de formulario */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Mesa' : 'Nueva Mesa de Transformación'}</DialogTitle>
          </DialogHeader>
          <MesaForm
            key={catalogo.length} // remonta el formulario si el catálogo llega con el diálogo ya abierto
            registro={editing || {}}
            catalogo={catalogo}
            onSave={handleSave} 
            onCancel={() => { setOpenDialog(false); setEditing(null); }} 
          />
        </DialogContent>
      </Dialog>

      {/* Tabla agrupada por provincia */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Registro de Mesas</CardTitle>
          <CardDescription>{totalMesas} mesas registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low border-b border-border/50">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className={`${h.oculta ?? ''} px-4 py-3 text-left font-medium`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ORDEN_REGIONES.map(region => {
                  const items = agrupadas[region];
                  if (!items || items.length === 0) return null;
                  return (
                    <React.Fragment key={region}>
                      {/* Fila agrupadora: cabecera de provincia */}
                      <tr className="bg-indigo-50/60">
                        <td colSpan={headers.length} className="px-4 py-2">
                          <span className="font-bold text-indigo-800 text-sm">
                            📍 {region}
                          </span>
                          <span className="ml-2 text-indigo-500 text-xs">
                            ({items.length} mesa{items.length !== 1 ? 's' : ''})
                          </span>
                        </td>
                      </tr>
                      {items.map(m => (
                        <MesaRow key={m.mesa_id} m={m} onEdit={handleEditMesa} onDelete={handleDelete} />
                      ))}
                    </React.Fragment>
                  );
                })}
                {totalMesas === 0 && (
                  <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-outline">
                    No hay mesas registradas. Presiona "Nueva Mesa" para comenzar.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MesasView;
