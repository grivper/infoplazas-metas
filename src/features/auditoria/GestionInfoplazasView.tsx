import React, { useState, useEffect } from 'react';
import { MapPin, Route, Plus, ToggleLeft, ToggleRight, Trash2, Edit3, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/bento-card';
import { getAllInfoplazas, getInfoplazasAbiertas, toggleEstadoInfoplaza, type Infoplaza } from './services/infoplazasService';
import { getItinerarioEnlaces, deleteItinerarioEnlace, type ItinerarioEnlace } from './services/itinerarioService';
import { truncateCatalogoInfoplazas } from './services/catalogoService';
import { ModalAgregarInfoplaza } from './components/ModalAgregarInfoplaza';
import { ModalEditarRuta } from './components/ModalEditarRuta';
import { RutaUploader } from './components/RutaUploader';
import { CatalogoUploader } from './components/CatalogoUploader';

type TabType = 'catalogo' | 'rutas';
type FiltroEstado = 'todas' | 'abiertas' | 'cerradas';

/**
 * Vista de gestión de infoplazas y rutas del sistema de auditoría.
 * Muestra dos pestañas: Catálogo (infoplazas) y Rutas (itinerario).
 * Permite agregar, editar, togglear estado y eliminar registros.
 */
export const GestionInfoplazasView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('catalogo');
  const [loading, setLoading] = useState(true);
  const [infoplazas, setInfoplazas] = useState<Infoplaza[]>([]);
  const [rutas, setRutas] = useState<ItinerarioEnlace[]>([]);
  const [infoplazasAbiertas, setInfoplazasAbiertas] = useState<Infoplaza[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [modalRutaOpen, setModalRutaOpen] = useState(false);
  const [modalLimpiarOpen, setModalLimpiarOpen] = useState(false);
  const [confirmLimpiar, setConfirmLimpiar] = useState('');
  const [rutaEditando, setRutaEditando] = useState<ItinerarioEnlace | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      // Requests en serie para evitar conflictos de lock con Supabase
      const ips = await getAllInfoplazas();
      const ipsAbiertas = await getInfoplazasAbiertas();
      const rutasData = await getItinerarioEnlaces();
      setInfoplazas(ips);
      setInfoplazasAbiertas(ipsAbiertas);
      setRutas(rutasData);
    } catch (e) { console.error('Error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (ip: Infoplaza) => {
    if (!ip.id || !confirm(`¿${ip.cerrada ? 'Reabrir' : 'Cerrar'} "${ip.nombre}"?`)) return;
    const r = await toggleEstadoInfoplaza(ip.id, !ip.cerrada);
    if (r.success) loadData();
  };

  const handleEliminarRuta = async (r: ItinerarioEnlace) => {
    if (!confirm(`¿Eliminar ruta de ${r.enlace_nombre}?`)) return;
    const res = await deleteItinerarioEnlace(r.id);
    if (res.success) loadData();
  };

  const filtradas = infoplazas
    .filter(ip => {
      if (filtroEstado === 'abiertas' && ip.cerrada) return false;
      if (filtroEstado === 'cerradas' && !ip.cerrada) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return ip.nombre.toLowerCase().includes(t) || ip.codigo.toLowerCase().includes(t);
      }
      return true;
    })
    .sort((a, b) => {
      const numA = parseInt(a.codigo.split('-')[0], 10) || 0;
      const numB = parseInt(b.codigo.split('-')[0], 10) || 0;
      return numA - numB;
    });

  const stats = { total: infoplazas.length, abiertas: infoplazas.filter(i => !i.cerrada).length, cerradas: infoplazas.filter(i => i.cerrada).length };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Gestión de Infoplazas</h1><p className="text-slate-500">Catálogo y rutas de enlaces</p></div>
      </div>
      <Dialog open={modalLimpiarOpen} onOpenChange={(open) => { setModalLimpiarOpen(open); if (!open) setConfirmLimpiar(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600"><Trash2 className="w-5 h-5" />Confirmar eliminación</DialogTitle>
            <DialogDescription>¿Estás seguro de que querés eliminar TODOS los registros del catálogo? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800"><strong>{infoplazas.length}</strong> registros serán eliminados permanentemente.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Escribí <code className="bg-slate-100 px-1 rounded">ELIMINAR</code> para confirmar:</label>
              <Input value={confirmLimpiar} onChange={e => setConfirmLimpiar(e.target.value)} placeholder="ELIMINAR" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalLimpiarOpen(false); setConfirmLimpiar(''); }}>Cancelar</Button>
            <Button variant="destructive" disabled={confirmLimpiar !== 'ELIMINAR'} onClick={async () => { await truncateCatalogoInfoplazas(); loadData(); setModalLimpiarOpen(false); setConfirmLimpiar(''); }}>Eliminar todo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total" value={stats.total} color="slate" />
        <StatCard title="Abiertas" value={stats.abiertas} color="emerald" />
        <StatCard title="Cerradas" value={stats.cerradas} color="rose" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('catalogo')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'catalogo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><MapPin className="w-4 h-4 inline mr-2" />Catálogo</button>
        <button onClick={() => setActiveTab('rutas')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'rutas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Route className="w-4 h-4 inline mr-2" />Rutas</button>
      </div>

      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar..." className="pl-9 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v as FiltroEstado)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="abiertas">Abiertas</SelectItem><SelectItem value="cerradas">Cerradas</SelectItem></SelectContent></Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CatalogoUploader onProcessComplete={loadData} badgeCount={infoplazas.length} />
              <Dialog open={modalAgregarOpen} onOpenChange={setModalAgregarOpen}><DialogTrigger asChild><Button className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"><Plus className="w-4 h-4 mr-2" />Agregar</Button></DialogTrigger><ModalAgregarInfoplaza open={modalAgregarOpen} onOpenChange={setModalAgregarOpen} onSuccess={loadData} /></Dialog>
              <Button variant="outline" className="border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100" onClick={() => setModalLimpiarOpen(true)} disabled={infoplazas.length === 0}><Trash2 className="w-4 h-4 mr-2" />Limpiar</Button>
            </div>
          </div>
          
          {/* Agrupar por estado: Abiertas primero, luego Cerradas */}
          {(() => {
            const abiertas = filtradas.filter(ip => !ip.cerrada);
            const cerradas = filtradas.filter(ip => ip.cerrada);
            
            return (
              <>
                {/* Grupo Abiertas */}
                {abiertas.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-emerald-100 px-4 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-emerald-800">Infoplazas Abiertas</h3>
                      <p className="text-xs text-emerald-600">{abiertas.length} {abiertas.length === 1 ? 'infoplaza' : 'infoplazas'}</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-50">
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Nombre</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Región</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Estado</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Fecha Cierre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {abiertas.map(ip => (
                          <TableRow key={ip.id} className="hover:bg-indigo-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-b-0">
                            <TableCell className="py-3 px-4 font-medium text-sm text-slate-800 group-hover:text-indigo-800">{ip.nombre}</TableCell>
                            <TableCell className="py-3 px-4 text-sm text-slate-500 group-hover:text-slate-700">{ip.region}</TableCell>
                            <TableCell className="py-3 px-4">
                              <button onClick={() => handleToggle(ip)} className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                                <ToggleRight className="w-5 h-5" />Abierta
                              </button>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-sm text-slate-500">{ip.fecha_cierre || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Grupo Cerradas */}
                {cerradas.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-rose-100 px-4 py-3 border-b border-slate-200">
                      <h3 className="font-semibold text-rose-800">Infoplazas Cerradas</h3>
                      <p className="text-xs text-rose-600">{cerradas.length} {cerradas.length === 1 ? 'infoplaza' : 'infoplazas'}</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-slate-50">
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Nombre</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Región</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Estado</TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Fecha Cierre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cerradas.map(ip => (
                          <TableRow key={ip.id} className="hover:bg-indigo-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-b-0">
                            <TableCell className="py-3 px-4 font-medium text-sm text-slate-800 group-hover:text-indigo-800">{ip.nombre}</TableCell>
                            <TableCell className="py-3 px-4 text-sm text-slate-500 group-hover:text-slate-700">{ip.region}</TableCell>
                            <TableCell className="py-3 px-4">
                              <button onClick={() => handleToggle(ip)} className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:text-rose-700">
                                <ToggleLeft className="w-5 h-5" />Cerrada
                              </button>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-sm text-slate-500">{ip.fecha_cierre || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {filtradas.length === 0 && (
                  <div className="text-center py-12 text-slate-500">No hay infoplazas que mostrar</div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'rutas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Rutas por Enlace</h2>
            <div className="flex flex-wrap items-center gap-3">
              <RutaUploader onProcessComplete={loadData} badgeCount={rutas.length} />
              <Button onClick={() => { setRutaEditando(undefined); setModalRutaOpen(true); }}><Plus className="w-4 h-4 mr-2" />Agregar Ruta</Button>
            </div>
          </div>
          {Object.entries(
            rutas.reduce((acc, ruta) => {
              const enlace = ruta.enlace_nombre || 'Sin enlace';
              if (!acc[enlace]) acc[enlace] = [];
              acc[enlace].push(ruta);
              return acc;
            }, {} as Record<string, ItinerarioEnlace[]>)
          ).sort(([a], [b]) => a.localeCompare(b)).map(([enlace, rutasEnlace]) => {
            const rutasOrdenadas = [...rutasEnlace].sort((a, b) => {
              const numA = parseInt((a.dia_ruta || '').replace(/\D/g, '') || '0', 10) || 0;
              const numB = parseInt((b.dia_ruta || '').replace(/\D/g, '') || '0', 10) || 0;
              return numA - numB;
            });
            return (
            <div key={enlace} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-700">{enlace}</h3>
                <p className="text-xs text-slate-500">{rutasEnlace.length} {rutasEnlace.length === 1 ? 'infoplaza' : 'infoplazas'}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-50">
                    <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Día Semana</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Día Ruta</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4">Infoplaza</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 uppercase tracking-wider py-3 px-4 w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rutasOrdenadas.map(r => (
                    <TableRow key={r.id} className="hover:bg-indigo-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-b-0">
                      <TableCell className="py-3 px-4 text-sm text-slate-500">{r.dia_semana || '-'}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-slate-500">{r.dia_ruta || '-'}</TableCell>
                      <TableCell className="py-3 px-4"><Badge variant="secondary">{r.infoplaza_nombre}</Badge></TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setRutaEditando(r); setModalRutaOpen(true); }}><Edit3 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEliminarRuta(r)}><Trash2 className="w-4 h-4 text-rose-400" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
          })}
          {rutas.length === 0 && (
            <div className="text-center py-12 text-slate-500">No hay rutas cargadas. Subí un CSV o agregá manualmente.</div>
          )}
        </div>
      )}

      <ModalEditarRuta open={modalRutaOpen} onOpenChange={setModalRutaOpen} ruta={rutaEditando} infoplazas={infoplazasAbiertas} onSuccess={loadData} />
    </div>
  );
};

export default GestionInfoplazasView;
