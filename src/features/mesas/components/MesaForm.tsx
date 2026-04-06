import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { generarMesaId, type MesaRecord, type InfoplazaCatalogo } from '../services/mesasDb';

interface MesaFormProps {
  registro: Partial<MesaRecord>;
  catalogo: InfoplazaCatalogo[];
  onSave: (r: MesaRecord) => void;
  onCancel: () => void;
}

/**
 * Formulario para crear o editar una mesa de transformación.
 * Maneja todos los campos: infoplaza, mesa, sesión, participantes, fechas, etc.
 */
export const MesaForm: React.FC<MesaFormProps> = ({ registro, catalogo, onSave, onCancel }) => {
  const defaultInfoplaza = catalogo[0] || { nombre: '', region: '' };
  
  const [form, setForm] = useState({
    infoplaza: '',
    region: '',
    mesa: 1,
    sesionActual: 1,
    participantes: 0,
    dinamizador: '',
    fechaInicio: '',
    fechaFin: '',
    fechaGraduacion: '',
    estado: 'pendiente' as MesaRecord['estado'],
  });

  // Inicializa el formulario con los valores del registro o valores por defecto
  useEffect(() => {
    setForm({
      infoplaza: registro.infoplaza || defaultInfoplaza.nombre,
      region: registro.region || defaultInfoplaza.region,
      mesa: registro.mesa || 1,
      sesionActual: registro.sesionActual || 1,
      participantes: registro.participantes || 0,
      dinamizador: registro.dinamizador || '',
      fechaInicio: registro.fechaInicio || '',
      fechaFin: registro.fechaFin || '',
      fechaGraduacion: registro.fechaGraduacion || '',
      estado: registro.estado || 'pendiente',
    });
  }, [registro, defaultInfoplaza]);

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
          {registro.mesa_id ? (
            <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
              {form.infoplaza} ({form.region})
            </div>
          ) : (
            <Combobox
              value={form.infoplaza}
              onValueChange={handleInfoplazaChange}
              placeholder="Seleccionar infoplaza..."
            >
              {catalogo.map(i => (
                <option key={i.id} value={i.nombre}>{i.nombre} ({i.region})</option>
              ))}
            </Combobox>
          )}
        </div>
        <div>
          <label className={labelCls}>Mesa #</label>
          {registro.mesa_id ? (
            <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
              Mesa {form.mesa}
            </div>
          ) : (
            <select className={inputCls} value={form.mesa} onChange={e => setForm(f => ({ ...f, mesa: +e.target.value }))}>
              {[1, 2, 3].map(n => <option key={n} value={n}>Mesa {n}</option>)}
            </select>
          )}
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
          <label className={labelCls}>Fecha Graduación</label>
          <input type="date" className={inputCls} value={form.fechaGraduacion} onChange={e => setForm(f => ({ ...f, fechaGraduacion: e.target.value }))} />
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
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">{registro.mesa_id ? 'Actualizar' : 'Crear Mesa'}</Button>
      </div>
    </form>
  );
};
