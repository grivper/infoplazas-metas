import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReclutamientoForm, type EstudianteData } from './ReclutamientoForm';

interface ModalReclutamientoProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  estudiante?: EstudianteData | null; // Para modo edición
}

/**
 * ModalReclutamiento
 * Contiene el diálogo para registrar un estudiante individual de servicio social.
 * El formulario se desmonta al cerrar para que cada apertura inicialice sus datos.
 */
export const ModalReclutamiento: React.FC<ModalReclutamientoProps> = ({ children, onSuccess, estudiante }) => {
  const [open, setOpen] = useState(false);
  const [prevEstudiante, setPrevEstudiante] = useState(estudiante);
  const isEditing = !!estudiante;

  // Abre el modal si cambia el estudiante seleccionado para edición.
  if (estudiante !== prevEstudiante) {
    setPrevEstudiante(estudiante);
    if (estudiante) {
      setOpen(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline">Inscribir Estudiantes</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Estudiante' : 'Inscribir Estudiante'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los datos del estudiante de servicio social.'
              : 'Registra los datos del estudiante que realizará servicio social.'}
          </DialogDescription>
        </DialogHeader>
        <ReclutamientoForm
          key={estudiante?.id ?? 'nuevo'}
          estudiante={estudiante}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};
