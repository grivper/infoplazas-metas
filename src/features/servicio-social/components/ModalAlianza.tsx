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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createAlianza, getAlianzas, type Alianza } from '../services/alianzasDb';

interface ModalAlianzaProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * ModalAlianza
 * Formulario para registrar una nueva reunión de alianza.
 * Campos: Universidad (Input text), Fecha (Input date), Acuerdos/Observaciones (Textarea).
 */
export const ModalAlianza: React.FC<ModalAlianzaProps> = ({ children, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alianzas, setAlianzas] = useState<Alianza[]>([]);
  
  // Form state
  const [universidad, setUniversidad] = useState('');
  const [fecha, setFecha] = useState('');
  const [acuerdos, setAcuerdos] = useState('');

  // Cargar alianzas existentes para autocompletar universidades
  useEffect(() => {
    const cargarAlianzas = async () => {
      const data = await getAlianzas();
      setAlianzas(data);
    };
    if (open) {
      cargarAlianzas();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createAlianza(
      universidad,
      fecha || null,
      acuerdos || null
    );

    setLoading(false);

    if (result.success) {
      // Reset form
      setUniversidad('');
      setFecha('');
      setAcuerdos('');
      setOpen(false);
      // Notify parent to refresh data
      onSuccess?.();
    } else {
      alert('Error al guardar la alianza. Por favor intenta de nuevo.');
    }
  };

  // Obtener lista única de universidades existentes
  const universidadesExistentes = [...new Set(alianzas.map(a => a.nombre_universidad))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Nueva Alianza</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Reunión de Alianza</DialogTitle>
          <DialogDescription>
            Ingresa los detalles de la reunión con la universidad para formalizar la intención.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="universidad">Universidad</Label>
            <Input
              id="universidad"
              value={universidad}
              onChange={(e) => setUniversidad(e.target.value)}
              placeholder="Ej: Universidad de Panamá"
              required
              list="universidades-existentes"
            />
            <datalist id="universidades-existentes">
              {universidadesExistentes.map((uni) => (
                <option key={uni} value={uni} />
              ))}
            </datalist>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de Reunión</Label>
            <Input 
              id="fecha" 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acuerdos">Acuerdos / Observaciones</Label>
            <Textarea
              id="acuerdos"
              value={acuerdos}
              onChange={(e) => setAcuerdos(e.target.value)}
              placeholder="Detalla los acuerdos alcanzados o puntos importantes de la reunión..."
              className="resize-none h-24"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Alianza'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
