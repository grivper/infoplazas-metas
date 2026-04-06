import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
 * pendiente: Sin iniciar - gris
 * en_progreso: En proceso - amber
 * completada: Finalizada - emerald
 */
const ESTADOS: Record<MesaRecord['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-3 h-3" /> },
  en_progreso: { label: 'En Progreso', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className="w-3 h-3" /> },
  completada: { label: 'Completada', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
};

// --- Componente Principal ---
const MesasView: React.FC = () => {
  const [mesas, setMesas] = useState<MesaRecord[]>([]);
  const [catalogo, setCatalogo] = useState<InfoplazaCatalogo[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<MesaRecord | null>(null);

  // Carga datos al montar
  useEffect(() => {
    getAllMesas().then(setMesas);
    getCatalogoInfoplazas().then(setCatalogo);
  }, []);

  // Abre el modal para nueva mesa
  const handleNewMesa = useCallback(() => {
    setEditing(null);
    setOpenDialog(true);
  }, []);

  // Abre el modal para editar
  const handleEditMesa = useCallback((m: MesaRecord) => {
    setEditing(m);
    setOpenDialog(true);
  }, []);

  // Guarda o actualiza una mesa
  const handleSave = useCallback(async (record: MesaRecord) => {
    await upsertMesa(record);
    setMesas(await getAllMesas());
    setOpenDialog(false);
    setEditing(null);
  }, []);

  // Elimina una mesa con manejo de errores
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMesa(id);
      setMesas(await getAllMesas());
    } catch (err) {
      console.error('Error al eliminar mesa:', err);
      alert('Error al eliminar la mesa. Intenta de nuevo.');
    }
  }, []);

  // Ordena mesas por infoplaza y número.
  // Usa useMemo para evitar recalcular en cada render y evitar mutación del estado.
  const mesasOrdenadas = useMemo(() => 
    [...mesas].sort((a, b) => a.infoplaza.localeCompare(b.infoplaza) || a.mesa - b.mesa), 
    [mesas]
  );

  // KPIs calculados
  const totalMesas = mesas.length;
  const infoplazasActivas = new Set(mesas.map(m => m.infoplaza)).size;
  const completadas = mesas.filter(m => m.estado === 'completada').length;
  const enProgreso = mesas.filter(m => m.estado === 'en_progreso').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mesas de Transformación</h1>
          <p className="text-slate-500 mt-1">Seguimiento de 21 Infoplazas • 3 Mesas × 10 Sesiones</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={handleNewMesa}>
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
        ].map(k => (
          <StatCard key={k.title} title={k.title} value={k.value} color={k.color} />
        ))}
      </div>

      {/* Modal de formulario (crear / editar) */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Mesa' : 'Nueva Mesa de Transformación'}</DialogTitle>
          </DialogHeader>
          <MesaForm 
            registro={editing || {}} 
            catalogo={catalogo}
            onSave={handleSave} 
            onCancel={() => { setOpenDialog(false); setEditing(null); }} 
          />
        </DialogContent>
      </Dialog>

      {/* Tabla de mesas */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Registro de Mesas</CardTitle>
          <CardDescription>{totalMesas} mesas registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Infoplaza', 'Región', 'Mesa', 'Sesión', 'Participantes', 'Dinamizador', 'Inicio', 'Fin', 'Graduación', 'Estado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mesasOrdenadas.map(m => {
                  const est = ESTADOS[m.estado];
                  return (
                    <tr key={m.mesa_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{m.infoplaza}</td>
                      <td className="px-4 py-3 text-slate-600">{m.region}</td>
                      <td className="px-4 py-3 text-slate-700">Mesa {m.mesa}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-indigo-600">{m.sesionActual}</span>
                        <span className="text-slate-400"> / 10</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{m.participantes}</td>
                      <td className="px-4 py-3 text-slate-600">{m.dinamizador || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{m.fechaInicio || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{m.fechaFin || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{m.fechaGraduacion || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`gap-1 ${est.color}`}>{est.icon} {est.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditMesa(m)}>
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.mesa_id)}>
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {totalMesas === 0 && (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-400">
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
