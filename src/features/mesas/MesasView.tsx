import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/bento-card';
import {
  getAllMesas, upsertMesa, deleteMesa, generarMesaId, getCatalogoInfoplazas,
  type MesaRecord, type InfoplazaCatalogo,
} from './services/mesasDb';

// --- Constantes ---
const ESTADOS: Record<MesaRecord['estado'], { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600', icon: <Clock className="w-3 h-3" /> },
  en_progreso: { label: 'En Progreso', color: 'bg-amber-100 text-amber-700', icon: <AlertCircle className="w-3 h-3" /> },
  completada: { label: 'Completada', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
};

// --- Componente: Formulario de Mesa (inline) ---
const MesaForm: React.FC<{
  registro: Partial<MesaRecord>;
  catalogo: InfoplazaCatalogo[];
  onSave: (r: MesaRecord) => void;
  onCancel: () => void;
}> = ({ registro, catalogo, onSave, onCancel }) => {
  const defaultInfoplaza = catalogo[0] || { nombre: '', region: '' };
  
  const [form, setForm] = useState({
    infoplaza: registro.infoplaza || defaultInfoplaza.nombre,
    region: registro.region || defaultInfoplaza.region,
    mesa: registro.mesa || 1,
    sesionActual: registro.sesionActual || 1,
    participantes: registro.participantes || 0,
    dinamizador: registro.dinamizador || '',
    fechaInicio: registro.fechaInicio || '',
    fechaFin: registro.fechaFin || '',
    estado: registro.estado || 'pendiente' as MesaRecord['estado'],
  });

  // Sincroniza la región al cambiar infoplaza
  const handleInfoplazaChange = (nombre: string) => {
    const info = catalogo.find(i => i.nombre === nombre);
    setForm(f => ({ ...f, infoplaza: nombre, region: info?.region || '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mesa_id = registro.mesa_id || generarMesaId(form.infoplaza, form.mesa);
    onSave({ ...form, mesa_id } as MesaRecord);
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Infoplaza</label>
          <select className={inputCls} value={form.infoplaza} onChange={e => handleInfoplazaChange(e.target.value)} disabled={!!registro.mesa_id}>
            {catalogo.map(i => <option key={i.id} value={i.nombre}>{i.nombre} ({i.region})</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Mesa #</label>
          <select className={inputCls} value={form.mesa} onChange={e => setForm(f => ({ ...f, mesa: +e.target.value }))} disabled={!!registro.mesa_id}>
            {[1, 2, 3].map(n => <option key={n} value={n}>Mesa {n}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Sesión Actual (1-10)</label>
          <input type="number" min={1} max={10} className={inputCls} value={form.sesionActual} onChange={e => setForm(f => ({ ...f, sesionActual: +e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Participantes</label>
          <input type="number" min={0} className={inputCls} value={form.participantes} onChange={e => setForm(f => ({ ...f, participantes: +e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Dinamizador</label>
          <input type="text" className={inputCls} value={form.dinamizador} onChange={e => setForm(f => ({ ...f, dinamizador: e.target.value }))} placeholder="Nombre" />
        </div>
        <div>
          <label className={labelCls}>Fecha Inicio</label>
          <input type="date" className={inputCls} value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Fecha Fin</label>
          <input type="date" className={inputCls} value={form.fechaFin} onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select className={inputCls} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as MesaRecord['estado'] }))}>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="completada">Completada</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">{registro.id ? 'Actualizar' : 'Crear Mesa'}</Button>
      </div>
    </form>
  );
};

// --- Componente Principal ---
const MesasView: React.FC = () => {
  const [mesas, setMesas] = useState<MesaRecord[]>([]);
  const [catalogo, setCatalogo] = useState<InfoplazaCatalogo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MesaRecord | null>(null);

  // Carga datos al montar
  useEffect(() => {
    getAllMesas().then(setMesas);
    getCatalogoInfoplazas().then(setCatalogo);
  }, []);

  // Guarda o actualiza una mesa
  const handleSave = useCallback(async (record: MesaRecord) => {
    await upsertMesa(record);
    setMesas(await getAllMesas());
    setShowForm(false);
    setEditing(null);
  }, []);

  // Elimina una mesa
  const handleDelete = useCallback(async (id: string) => {
    await deleteMesa(id);
    setMesas(await getAllMesas());
  }, []);

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
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => { setEditing(null); setShowForm(true); }}>
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

      {/* Formulario (crear / editar) */}
      {(showForm || editing) && (
        <MesaForm 
          registro={editing || {}} 
          catalogo={catalogo}
          onSave={handleSave} 
          onCancel={() => { setShowForm(false); setEditing(null); }} 
        />
      )}

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
                  {['Infoplaza', 'Región', 'Mesa', 'Sesión', 'Participantes', 'Dinamizador', 'Inicio', 'Estado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mesas.sort((a, b) => a.infoplaza.localeCompare(b.infoplaza) || a.mesa - b.mesa).map(m => {
                  const est = ESTADOS[m.estado];
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
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
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={`gap-1 ${est.color}`}>{est.icon} {est.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setShowForm(false); }}>
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
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
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
