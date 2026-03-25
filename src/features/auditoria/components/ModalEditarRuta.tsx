import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createItinerarioEnlace, updateItinerarioEnlace, type ItinerarioEnlace } from '../services/itinerarioService';
import type { Infoplaza } from '../services/infoplazasService';

/**
 * Props del componente ModalEditarRuta.
 * @param open - Controla la visibilidad del modal
 * @param onOpenChange - Callback al cerrar/abrir el modal
 * @param ruta - Ruta a editar (undefined para crear nueva)
 * @param infoplazas - Lista de infoplazas disponibles
 * @param onSuccess - Callback llamado tras guardar exitosamente
 */
interface ModalEditarRutaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruta?: ItinerarioEnlace;
  infoplazas: Infoplaza[];
  onSuccess: () => void;
}

export const ModalEditarRuta: React.FC<ModalEditarRutaProps> = ({ open, onOpenChange, ruta, infoplazas, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlace, setEnlace] = useState('');
  const [infoplazaId, setInfoplazaId] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [diaRuta, setDiaRuta] = useState('');

  // Sincroniza el estado del formulario con los datos de la ruta seleccionada.
  // Se ejecuta cada vez que cambia la ruta o se abre/cierra el modal.
  useEffect(() => {
    if (ruta) {
      setEnlace(ruta.enlace_nombre);
      setInfoplazaId(ruta.infoplaza_id);
      setDiaSemana(ruta.dia_semana || '');
      setDiaRuta(ruta.dia_ruta || '');
    } else {
      setEnlace(''); setInfoplazaId(''); setDiaSemana(''); setDiaRuta('');
    }
    setError(null); // Limpiar errores al abrir/cerrar
  }, [ruta, open]);

  // Maneja el envío del formulario.
  // Determina si es creación o actualización según si existe ruta,
  // luego llama al servicio correspondiente y maneja el resultado.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let result: { success: boolean; error?: Error };
    if (ruta) {
      const updateResult = await updateItinerarioEnlace(ruta.id, { enlace_nombre: enlace, infoplaza_id: infoplazaId, dia_semana: diaSemana || null, dia_ruta: diaRuta || null });
      result = { success: updateResult.success, error: updateResult.success ? undefined : updateResult.error };
    } else {
      result = await createItinerarioEnlace(enlace, infoplazaId, diaRuta, diaSemana);
    }
    setLoading(false);
    if (result.success) {
      setEnlace(''); setInfoplazaId(''); setDiaSemana(''); setDiaRuta('');
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.error?.message || 'Error al guardar ruta.');
    }
  };

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const diasRuta = Array.from({ length: 20 }, (_, i) => `Día ${i + 1}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ruta ? 'Editar Ruta' : 'Agregar Ruta'}</DialogTitle>
          <DialogDescription>Asigna una infoplaza a un enlace.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="enlace">Enlace</Label>
            <Input id="enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="Ej: Rogelio" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="infoplaza">Infoplaza</Label>
            <Select value={infoplazaId} onValueChange={setInfoplazaId}>
              <SelectTrigger id="infoplaza"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
              <SelectContent>
                {infoplazas.map((ip) => (<SelectItem key={ip.id} value={ip.id!}>{ip.nombre}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Día Semana</Label>
              <Select value={diaSemana} onValueChange={setDiaSemana}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {diasSemana.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número Día</Label>
              <Select value={diaRuta} onValueChange={setDiaRuta}>
                <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>
                  {diasRuta.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Guardando...' : ruta ? 'Actualizar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
