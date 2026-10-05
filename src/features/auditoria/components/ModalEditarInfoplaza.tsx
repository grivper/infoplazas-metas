import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Infoplaza } from '../services/infoplazasService';
import { updateInfoplaza } from '../services/infoplazaUpdateService';

interface ModalEditarInfoplazaProps {
  /** Infoplaza a editar; el modal se abre cuando hay una y se cierra cuando es undefined. */
  infoplaza?: Infoplaza;
  onClose: () => void;
  onSuccess: () => void;
}

/** Modal para corregir los datos de una infoplaza del catálogo. */
export const ModalEditarInfoplaza: React.FC<ModalEditarInfoplazaProps> = ({ infoplaza, onClose, onSuccess }) => (
  <Dialog open={!!infoplaza} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Editar Infoplaza</DialogTitle>
        <DialogDescription>Cambiar el código no afecta a los dinamizadores: se actualizan solos.</DialogDescription>
      </DialogHeader>
      {/* key: al elegir otra infoplaza el formulario se reinicia con sus datos */}
      {infoplaza && <FormularioEditar key={infoplaza.id} infoplaza={infoplaza} onClose={onClose} onSuccess={onSuccess} />}
    </DialogContent>
  </Dialog>
);

interface FormularioEditarProps {
  infoplaza: Infoplaza;
  onClose: () => void;
  onSuccess: () => void;
}

function FormularioEditar({ infoplaza, onClose, onSuccess }: FormularioEditarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState(infoplaza.codigo);
  const [nombre, setNombre] = useState(infoplaza.nombre);
  const [region, setRegion] = useState(infoplaza.region);
  const [distrito, setDistrito] = useState(infoplaza.distrito ?? '');
  const [corregimiento, setCorregimiento] = useState(infoplaza.corregimiento ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoplaza.id) return;
    setLoading(true);
    const result = await updateInfoplaza(infoplaza.id, { codigo, nombre, region, distrito, corregimiento });
    setLoading(false);
    if (result.success) {
      onClose();
      onSuccess();
    } else {
      setError(result.duplicado
        ? `El código "${codigo}" ya lo usa otra infoplaza. Si estás intercambiando códigos, usá uno temporal primero.`
        : 'No se pudo guardar. Intentá de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="edit-codigo">Código</Label>
        <Input id="edit-codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-nombre">Nombre</Label>
        <Input id="edit-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-region">Provincia</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger id="edit-region"><SelectValue placeholder="Selecciona una provincia..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Los Santos">Los Santos</SelectItem>
            <SelectItem value="Herrera">Herrera</SelectItem>
            <SelectItem value="Coclé">Coclé</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-distrito">Distrito</Label>
        <Input id="edit-distrito" value={distrito} onChange={(e) => setDistrito(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-corregimiento">Corregimiento</Label>
        <Input id="edit-corregimiento" value={corregimiento} onChange={(e) => setCorregimiento(e.target.value)} />
      </div>
      {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
      <DialogFooter className="pt-4">
        <Button type="submit" className="w-full" disabled={loading || !region}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
      </DialogFooter>
    </form>
  );
}
