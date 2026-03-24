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
import { createReclutamiento } from '../services/reclutamientoDb';
import { getAlianzas, type Alianza } from '../services/alianzasDb';

interface Infoplaza {
  id: string;
  nombre: string;
  codigo?: string;
}

interface ModalReclutamientoProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

/**
 * ModalReclutamiento
 * Formulario para registrar un estudiante individual de servicio social.
 * Campos: Universidad de origen (Select), Estudiante (Input), Carrera (Input), Año (Select), Infoplaza (Select), Período (Input).
 */
export const ModalReclutamiento: React.FC<ModalReclutamientoProps> = ({ children, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data for selects
  const [universidades, setUniversidades] = useState<Alianza[]>([]);
  const [infoplazas, setInfoplazas] = useState<Infoplaza[]>([]);
  
  // Form state
  const [universidadId, setUniversidadId] = useState<string>('');
  const [infoplazaId, setInfoplazaId] = useState<string>('');
  const [nombreEstudiante, setNombreEstudiante] = useState<string>('');
  const [cedula, setCedula] = useState<string>('');
  const [carrera, setCarrera] = useState<string>('');
  const [anioCursa, setAnioCursa] = useState<string>('');

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
    };

    cargarDatos();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createReclutamiento(
      universidadId || null,
      infoplazaId || null,
      nombreEstudiante,
      cedula,
      carrera,
      anioCursa
    );

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
          <DialogTitle>Inscribir Estudiante</DialogTitle>
          <DialogDescription>
            Registra los datos del estudiante que realizará servicio social.
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
              {loading ? 'Registrando...' : 'Registrar Estudiante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
