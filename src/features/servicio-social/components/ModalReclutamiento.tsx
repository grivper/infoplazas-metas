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
import { supabase } from '@/lib/supabase';
import { createReclutamiento, updateEstudiante } from '../services/reclutamientoDb';
import { getAlianzas, type Alianza } from '../services/alianzasDb';

interface Infoplaza {
  id: string;
  nombre: string;
  codigo?: string;
}

interface EstudianteData {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  universidad_id: string | null;
  carrera: string;
  anio_cursa: string;
  infoplaza_id: string | null;
}

interface ModalReclutamientoProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  estudiante?: EstudianteData | null; // Para modo edición
}

/**
 * ModalReclutamiento
 * Formulario para registrar un estudiante individual de servicio social.
 * Modo edición: cuando se pasa el prop 'estudiante', se editable.
 * Campos: Universidad de origen (Select), Estudiante (Input), Carrera (Input), Año (Select), Infoplaza (Select), Período (Input).
 */
export const ModalReclutamiento: React.FC<ModalReclutamientoProps> = ({ children, onSuccess, estudiante }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEditing = !!estudiante;

  // Effect para abrir el modal automáticamente cuando se pasa un estudiante para editar
  useEffect(() => {
    if (estudiante) {
      setOpen(true);
    }
  }, [estudiante]);

  // Effect para resetear el form cuando se cierra el modal
  // IMPORTANTE: Si no-reseteamos, al abrir para crear nuevo estudiantes,
  // podrían verse los datos del anterior estudiante editado
  useEffect(() => {
    if (!open) {
      // Reset form solo cuando se cierra y NO estamos editando
      if (!isEditing) {
        setUniversidadId('');
        setInfoplazaId('');
        setNombreEstudiante('');
        setCedula('');
        setCarrera('');
        setAnioCursa('');
      }
    }
  }, [open, isEditing]);

  // Data for selects
  const [universidades, setUniversidades] = useState<Alianza[]>([]);
  const [infoplazas, setInfoplazas] = useState<Infoplaza[]>([]);
  
  // Form state - almacenar datos del formulario
  const [universidadId, setUniversidadId] = useState<string>('');      // ID de la universidad seleccionada
  const [infoplazaId, setInfoplazaId] = useState<string>('');         // ID de la infoplaza asignada
  const [nombreEstudiante, setNombreEstudiante] = useState<string>('');  // Nombre completo del estudiante
  const [cedula, setCedula] = useState<string>('');                   // Número de identificación
  const [carrera, setCarrera] = useState<string>('');                 // Carrera que estudia
  const [anioCursa, setAnioCursa] = useState<string>('');             // Año académico (1-5)

  // Load data when modal opens
  useEffect(() => {
    const cargarDatos = async () => {
      if (!open) return;

      // Load universidades from alianzas
      const [unis, infos] = await Promise.all([
        getAlianzas(),
        supabase.from('catalogo_infoplazas').select('id, nombre, codigo').or('cerrada.is.null,cerrada.eq.false').order('nombre')
      ]);

      setUniversidades(unis);
      if (infos.data) {
        setInfoplazas(infos.data);
      }

      // Si estamos en modo edición, cargar datos del estudiante
      if (estudiante) {
        setUniversidadId(estudiante.universidad_id || '');
        setInfoplazaId(estudiante.infoplaza_id || '');
        setNombreEstudiante(estudiante.nombre_estudiante);
        setCedula(estudiante.cedula);
        setCarrera(estudiante.carrera);
        setAnioCursa(estudiante.anio_cursa);
      }
    };

    cargarDatos();
  }, [open, estudiante]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result: { success: boolean; error?: Error };

    if (isEditing) {
      // Modo edición: actualizar estudiante
      result = await updateEstudiante(estudiante.id, {
        nombre_estudiante: nombreEstudiante,
        cedula: cedula,
        universidad_id: universidadId || null,
        carrera: carrera,
        anio_cursa: anioCursa,
        infoplaza_id: infoplazaId || null,
      });
    } else {
      // Modo creación: nuevo estudiante
      result = await createReclutamiento(
        universidadId || null,
        infoplazaId || null,
        nombreEstudiante,
        cedula,
        carrera,
        anioCursa
      );
    }

    setLoading(false);

    if (result.success) {
      // Reset form
      setUniversidadId('');
      setInfoplazaId('');
      setNombreEstudiante('');
      setCedula('');
      setCarrera('');
      setAnioCursa('');
      setOpen(false);
      onSuccess?.();
    } else {
      alert('Error al registrar estudiante. Por favor intenta de nuevo.');
    }
  };

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
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_estudiante">Nombre del Estudiante</Label>
            <Input 
              id="nombre_estudiante" 
              type="text" 
              value={nombreEstudiante}
              onChange={(e) => setNombreEstudiante(e.target.value)}
              placeholder="Ej: Juan Pérez" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input 
              id="cedula" 
              type="text" 
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej: 12345678" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="universidad_origen">Universidad de Origen</Label>
            <Select value={universidadId} onValueChange={setUniversidadId}>
              <SelectTrigger id="universidad_origen">
                <SelectValue placeholder="Selecciona una universidad..." />
              </SelectTrigger>
              <SelectContent>
                {universidades.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.nombre_universidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carrera">Carrera</Label>
            <Input 
              id="carrera" 
              type="text" 
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Ej: Ingeniería en Sistemas" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio_cursa">Año que Cursa</Label>
            <Select value={anioCursa} onValueChange={setAnioCursa}>
              <SelectTrigger id="anio_cursa">
                <SelectValue placeholder="Selecciona el año..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1er Año</SelectItem>
                <SelectItem value="2">2do Año</SelectItem>
                <SelectItem value="3">3er Año</SelectItem>
                <SelectItem value="4">4to Año</SelectItem>
                <SelectItem value="5">5to Año</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="infoplaza">Infoplaza Asignada</Label>
            <Select value={infoplazaId} onValueChange={setInfoplazaId}>
              <SelectTrigger id="infoplaza">
                <SelectValue placeholder="Selecciona una infoplaza..." />
              </SelectTrigger>
              <SelectContent>
                {infoplazas.map((info) => (
                  <SelectItem key={info.id} value={info.id!}>
                    {info.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? (isEditing ? 'Guardando...' : 'Registrando...') : (isEditing ? 'Guardar Cambios' : 'Registrar Estudiante')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
