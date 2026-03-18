import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getInfoplazas, createIncidencia } from '../services/incidenciasDb';

interface ModalIncidenciaProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export const ModalIncidencia: React.FC<ModalIncidenciaProps> = ({ children, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [infoplazas, setInfoplazas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar infoplazas al abrir el modal
  useEffect(() => {
    if (open) {
      getInfoplazas().then(setInfoplazas);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const infoplazaId = formData.get('infoplaza') as string;
    const categoria = formData.get('categoria') as string;
    const urgencia = formData.get('urgencia') as 'alta' | 'media' | 'baja';
    const descripcion = formData.get('descripcion') as string;

    const result = await createIncidencia(infoplazaId, categoria, urgencia, descripcion);

    setLoading(false);

    if (result.success) {
      setOpen(false);
      onSuccess?.();
    } else {
      alert('Error al crear incidencia: ' + result.error?.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva Incidencia</DialogTitle>
            <DialogDescription>
              Registra un nuevo daño, alerta o reporte operativo en una Infoplaza.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            {/* Campo: Infoplaza */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="infoplaza" className="text-right">
                Infoplaza
              </Label>
              <div className="col-span-3">
                <Select name="infoplaza" required>
                  <SelectTrigger id="infoplaza">
                    <SelectValue placeholder="Seleccione una Infoplaza..." />
                  </SelectTrigger>
                  <SelectContent>
                    {infoplazas.map(ip => (
                      <SelectItem key={ip.id} value={ip.id}>
                        {ip.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo: Categoría */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoria" className="text-right">
                Categoría
              </Label>
              <div className="col-span-3">
                <Select name="categoria" required>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Seleccione una categoría..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infraestructura">Infraestructura</SelectItem>
                    <SelectItem value="conectividad">Conectividad</SelectItem>
                    <SelectItem value="dinamizador">Dinamizador</SelectItem>
                    <SelectItem value="promocion">Promoción</SelectItem>
                    <SelectItem value="equipo">Equipo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo: nivel de Urgencia */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="urgencia" className="text-right">
                Urgencia
              </Label>
              <div className="col-span-3">
                <Select name="urgencia" required>
                  <SelectTrigger id="urgencia">
                    <SelectValue placeholder="Seleccione la urgencia..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Campo: Descripción */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="descripcion" className="text-right mt-2">
                Descripción
              </Label>
              <Textarea 
                name="descripcion" 
                id="descripcion"
                className="col-span-3 min-h-[100px]" 
                placeholder="Describa el problema detalladamente..."
                required
              />
            </div>
            
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Incidencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalIncidencia;
