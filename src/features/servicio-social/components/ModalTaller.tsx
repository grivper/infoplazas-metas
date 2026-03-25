import React, { useState, useEffect, useMemo } from 'react';
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
import { createTaller } from '../services/talleresDb';
import { getReclutamientos, type Reclutamiento } from '../services/reclutamientoDb';
import { Combobox } from '@/components/ui/combobox';

interface ModalTallerProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * ModalTaller
 * Formulario para registrar la ejecución de un taller impartido por un estudiante.
 * Campos: Estudiante (Combobox con búsqueda), Cantidad de usuarios capacitados (Input number), Tema del taller (Input text).
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

  // Filtrar solo estudiantes activos
  const estudiantesActivos = useMemo(() => {
    return estudiantes.filter(e => e.estado === 'activo');
  }, [estudiantes]);

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

  // Formatea el nombre y cédula del estudiante para mostrar en el combobox
  const formatEstudiante = (r: Reclutamiento) => {
    const nombre = r.nombre_estudiante || 'Sin nombre';
    const cedula = r.cedula ? `(${r.cedula})` : '';
    return `${nombre} ${cedula}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setEstudianteId('');
      }
    }}>
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
            <Combobox 
              value={estudianteId} 
              onValueChange={setEstudianteId}
              placeholder="Buscar estudiante..."
            >
              {estudiantesActivos.map((r) => (
                <button key={r.id} value={r.id}>
                  {formatEstudiante(r)}
                </button>
              ))}
              {estudiantesActivos.length === 0 && (
                <button value="__empty__" disabled>
                  No hay estudiantes activos registrados.
                </button>
              )}
            </Combobox>
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
