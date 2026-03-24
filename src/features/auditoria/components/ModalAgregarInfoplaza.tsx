import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createInfoplaza } from '../services/infoplazasService';

interface ModalAgregarInfoplazaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ModalAgregarInfoplaza: React.FC<ModalAgregarInfoplazaProps> = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createInfoplaza(codigo, nombre, region);
    setLoading(false);
    if (result.success) {
      setCodigo(''); setNombre(''); setRegion('');
      onOpenChange(false);
      onSuccess();
    } else {
      alert('Error al crear infoplaza. Verifica que el código no exista.');
    }
  };

  const autoGenerateCodigo = () => {
    const code = nombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setCodigo(code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Infoplaza</DialogTitle>
          <DialogDescription>Registra una nueva infoplaza en el catálogo maestro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <div className="flex gap-2">
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: 498-canaveral" required />
              <Button type="button" variant="outline" onClick={autoGenerateCodigo}>Auto</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cañaveral" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region"><SelectValue placeholder="Selecciona una región..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Los Santos">Los Santos</SelectItem>
                <SelectItem value="Herrera">Herrera</SelectItem>
                <SelectItem value="Coclé">Coclé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
