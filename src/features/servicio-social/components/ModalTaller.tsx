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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTaller } from '../services/talleresDb';
import { getReclutamientos, type Reclutamiento } from '../services/reclutamientoDb';

interface ModalTallerProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * ModalTaller
 * Formulario para registrar la ejecución de un taller impartido por un estudiante.
 * Campos: Estudiante (Select), Cantidad de usuarios capacitados (Input number), Tema del taller (Input text).
 */
export const ModalTaller: React.FC<ModalTallerProps> = ({ children, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [estudiantes, setEstudiantes] = useState<Reclutamiento[]>([]);
  
  // Form state
  const [estudianteId, setEstudianteId] = useState<string>('');
  const [tema, setTema] = useState<string>('');
  const [capacitados, setCapacitados] = useState<string>('');
  const [fecha, setFecha] = useState<string>('');

  // Load data when modal opens
  useEffect(() => {
    const cargarDatos = async () => {
      if (!open) return;

      const data = await getReclutamientos();
      setEstudiantes(data);
    };

    cargarDatos();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createTaller(
      estudianteId || null,
      tema,
      parseInt(capacitados) || 0,
      fecha || null
    );

    setLoading(false);

    if (result.success) {
      // Reset form
      setEstudianteId('');
      setTema('');
      setCapacitados('');
      setFecha('');
      setOpen(false);
      onSuccess?.();
    } else {
      alert('Error al registrar el taller. Por favor intenta de nuevo.');
    }
  };

  // Format estudiante for display - shows name + cedula + university/infoplaza
  const formatEstudiante = (r: Reclutamiento) => {
    const nombre = r.nombre_estudiante || 'Sin nombre';
    const cedula = r.cedula ? `(${r.cedula})` : '';
    const universidad = r.nombre_universidad || '';
    const infoplaza = r.nombre_infoplaza || '';
    return `${nombre} ${cedula} - ${universidad || infoplaza}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Reportar Ejecución</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar Ejecución de Taller</DialogTitle>
          <DialogDescription>
            Ingresa los resultados del taller impartido por un estudiante de servicio social.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="estudiante">Estudiante que Imparte</Label>
            <Select value={estudianteId} onValueChange={setEstudianteId}>
              <SelectTrigger id="estudiante" aria-label="Seleccionar estudiante">
                <SelectValue placeholder="Seleccionar estudiante..." />
              </SelectTrigger>
              <SelectContent>
                {estudiantes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {formatEstudiante(r)}
                  </SelectItem>
                ))}
                {estudiantes.length === 0 && (
                  <div className="p-2 text-sm text-slate-500 text-center">
                    No hay estudiantes registrados. Inscribe uno primero.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tema">Tema del Taller</Label>
            <Input 
              id="tema" 
              type="text" 
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ej: Herramientas Ofimáticas Básicas" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacitados">Usuarios Capacitados</Label>
            <Input 
              id="capacitados" 
              type="number" 
              min="1" 
              value={capacitados}
              onChange={(e) => setCapacitados(e.target.value)}
              placeholder="Ej: 15" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha de Ejecución</Label>
            <Input 
              id="fecha" 
              type="date" 
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Taller'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
