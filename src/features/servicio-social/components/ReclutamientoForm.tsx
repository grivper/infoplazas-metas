import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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

export interface Infoplaza {
  id: string;
  nombre: string;
  codigo?: string;
}

export interface EstudianteData {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  universidad_id: string | null;
  carrera: string;
  anio_cursa: string;
  infoplaza_id: string | null;
}

interface ReclutamientoFormProps {
  estudiante?: EstudianteData | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Formulario interno de reclutamiento. Se desmonta al cerrar el DialogContent,
 * por eso inicializa su estado una vez y cada apertura comienza limpia.
 */
export const ReclutamientoForm: React.FC<ReclutamientoFormProps> = ({ estudiante, onClose, onSuccess }) => {
  const [universidades, setUniversidades] = useState<Alianza[]>([]);
  const [infoplazas, setInfoplazas] = useState<Infoplaza[]>([]);
  const [universidadId, setUniversidadId] = useState(estudiante?.universidad_id ?? '');
  const [infoplazaId, setInfoplazaId] = useState(estudiante?.infoplaza_id ?? '');
  const [nombreEstudiante, setNombreEstudiante] = useState(estudiante?.nombre_estudiante ?? '');
  const [cedula, setCedula] = useState(estudiante?.cedula ?? '');
  const [carrera, setCarrera] = useState(estudiante?.carrera ?? '');
  const [anioCursa, setAnioCursa] = useState(estudiante?.anio_cursa ?? '');
  const [loading, setLoading] = useState(false);
  const isEditing = !!estudiante;

  // Carga los datos de los selectores cuando el formulario se monta.
  useEffect(() => {
    const cargarDatos = async () => {
      const [unis, infos] = await Promise.all([
        getAlianzas(),
        supabase.from('catalogo_infoplazas').select('id, nombre, codigo').or('cerrada.is.null,cerrada.eq.false').order('nombre'),
      ]);

      setUniversidades(unis);
      if (infos.data) {
        setInfoplazas(infos.data);
      }
    };

    cargarDatos();
  }, []);

  // Guarda los datos y determina si debe crear o actualizar un estudiante.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let result: { success: boolean; error?: Error };
    if (estudiante) {
      result = await updateEstudiante(estudiante.id, {
        nombre_estudiante: nombreEstudiante,
        cedula,
        universidad_id: universidadId || null,
        carrera,
        anio_cursa: anioCursa,
        infoplaza_id: infoplazaId || null,
      });
    } else {
      result = await createReclutamiento(
        universidadId || null,
        infoplazaId || null,
        nombreEstudiante,
        cedula,
        carrera,
        anioCursa,
      );
    }

    setLoading(false);
    if (result.success) {
      onClose();
      onSuccess?.();
    } else {
      alert('Error al registrar estudiante. Por favor intenta de nuevo.');
    }
  };

  return (
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
        <Input id="cedula" type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej: 12345678" required />
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
              <SelectItem key={info.id} value={info.id}>
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
  );
};
