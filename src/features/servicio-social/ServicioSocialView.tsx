import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, BookOpen, GraduationCap, Building2, Handshake, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCardWithProgress } from '@/components/ui/bento-card';
import { ModalAlianza } from './components/ModalAlianza';
import { ModalReclutamiento } from './components/ModalReclutamiento';
import { ModalTaller } from './components/ModalTaller';
import { StudentTrackingTable } from './components/StudentTrackingTable';
import { WorkflowTimeline, type Workflow } from './components/WorkflowTimeline';
import { RemeLoader } from '@/components/ui/reme-loader';

// DB Services
import { getAlianzasCount } from './services/alianzasDb';
import { getReclutamientos, getTotalEstudiantesReclutados, updateEstadoEstudiante } from './services/reclutamientoDb';
import { getTalleresCount, getTotalUsuariosCapacitados, getTalleresCountBulk } from './services/talleresDb';

// Tipos para datos reales
interface KPIData {
  title: string;
  value: string | number;
  icon: React.ElementType;
  progress: number;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  peso: number; // Peso en % para el promedio ponderado
}

interface StudentData {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  universidad: string;
  infoplaza: string;
  carrera: string;
  anio_cursa: string;
  talleres: number;
  fecha_inscripcion: string;
  status: 'Activo' | 'Completado' | 'Cancelado';
  estado_original: 'activo' | 'completado' | 'cancelado';
  universidad_id?: string | null;
  infoplaza_id?: string | null;
}

// Tipo para pasar al modal de edición
interface EstudianteParaEditar {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  universidad_id: string | null;
  carrera: string;
  anio_cursa: string;
  infoplaza_id: string | null;
}

export const ServicioSocialView: React.FC = () => {
  // State para datos reales
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [studentTracking, setStudentTracking] = useState<StudentData[]>([]);
  const [estudianteEditando, setEstudianteEditando] = useState<EstudianteParaEditar | null>(null);

  // Función para cambiar estado del estudiante (completar o cancelar) - memoizada
  const handleCambiarEstado = useCallback(async (estudianteId: string, nuevoEstado: 'activo' | 'completado' | 'cancelado') => {
    const result = await updateEstadoEstudiante(estudianteId, nuevoEstado);
    if (result.success) {
      // Recargar datos para reflejar el cambio en la UI
      cargarDatos();
    }
  }, []);

  // Función para abrir el modal de edición con los datos del estudiante seleccionado - memoizada
  const handleEditarEstudiante = useCallback((estudiante: EstudianteParaEditar) => {
    setEstudianteEditando(estudiante);
  }, []);

  // Workflows calculados dinámicamente desde Supabase - memoizado para evitar re-cálculos
  const workflows = useMemo((): Workflow[] => {
    const alianzas = kpiData[0]?.value as number || 0;
    const estudiantes = kpiData[1]?.value as number || 0;
    const talleres = kpiData[2]?.value as number || 0;

    const metaAlianzas = 5;
    const metaEstudiantes = 60;
    const metaTalleres = 140;

    return [
      {
        phase: 'Alianzas',
        dates: `${alianzas}/${metaAlianzas} universidades`,
        desc: 'Gestión de acuerdos con universidades.',
        status: (alianzas >= metaAlianzas ? 'Completado' : 'En curso') as 'Completado' | 'En curso',
      },
      {
        phase: 'Reclutamiento',
        dates: `${estudiantes}/${metaEstudiantes} estudiantes`,
        desc: 'Selección y captación de estudiantes.',
        status: (estudiantes >= metaEstudiantes ? 'Completado' : 'En curso') as 'Completado' | 'En curso',
      },
      {
        phase: 'Ejecución',
        dates: `${talleres}/${metaTalleres} talleres`,
        desc: 'Despliegue operativo en Infoplazas.',
        status: (talleres >= metaTalleres ? 'Completado' : 'En curso') as 'Completado' | 'En curso',
      },
    ];
  }, [kpiData]);

  // Workflows se genera dinámicamente con useMemo
  // Los estados se calculan desde Supabase
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todos los datos en paralelo
      const [
        alianzasCount,
        estudiantesTotal,
        talleresCount,
        usuariosCapacitados,
        reclutamientosData
      ] = await Promise.all([
        getAlianzasCount(),
        getTotalEstudiantesReclutados(),
        getTalleresCount(),
        getTotalUsuariosCapacitados(),
        getReclutamientos()
      ]);

      // Actualizar KPIs
      setKpiData([
        {
          title: 'Universidades Aliadas',
          value: alianzasCount,
          icon: Building2,
          progress: Math.min((alianzasCount / 5) * 100, 100), // Meta: 5 universidades
          color: 'blue',
          peso: 40,
        },
        {
          title: 'Estudiantes Reclutados',
          value: estudiantesTotal,
          icon: Users,
          progress: Math.min((estudiantesTotal / 60) * 100, 100), // Meta: 60 estudiantes
          color: 'emerald',
          peso: 30,
        },
        {
          title: 'Talleres Impartidos',
          value: talleresCount,
          icon: BookOpen,
          progress: Math.min((talleresCount / 140) * 100, 100), // Meta: 140 talleres
          color: 'amber',
          peso: 15,
        },
        {
          title: 'Usuarios Capacitados',
          value: usuariosCapacitados,
          icon: GraduationCap,
          progress: Math.min((usuariosCapacitados / 1000) * 100, 100), // Meta: 1000 usuarios
          color: 'purple',
          peso: 15,
        },
      ]);

      // Obtener conteo de talleres para todos los reclutamientos en una sola query (evita N+1)
      const reclutamientoIds = reclutamientosData.map(r => r.id);
      const talleresCountMap = await getTalleresCountBulk(reclutamientoIds);

      // Mapear reclutamientos a formato de tabla de estudiantes
      const students: StudentData[] = reclutamientosData.map((r) => {
        // Mapear estado de la DB
        let statusLabel: 'Activo' | 'Completado' | 'Cancelado' = 'Activo';
        if (r.estado === 'completado') statusLabel = 'Completado';
        else if (r.estado === 'cancelado') statusLabel = 'Cancelado';
        
        return {
          id: r.id,
          nombre_estudiante: r.nombre_estudiante || 'Sin nombre',
          cedula: r.cedula || '-',
          universidad: r.nombre_universidad || 'Sin universidad',
          infoplaza: r.nombre_infoplaza || 'Sin asignar',
          carrera: r.carrera || '-',
          anio_cursa: r.anio_cursa || '-',
          talleres: talleresCountMap.get(r.id) || 0,
          fecha_inscripcion: r.created_at ? new Date(r.created_at).toLocaleDateString('es-PA') : '-',
          status: statusLabel,
          estado_original: r.estado || 'activo',
          universidad_id: r.universidad_id,
          infoplaza_id: r.infoplaza_id,
        };
      });
      setStudentTracking(students);

    } catch (error) {
      console.error('Error al cargar datos de Servicio Social:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RemeLoader size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Módulo Servicio Social</h1>
          <p className="text-slate-500 mt-1">Gestión integral de voluntarios y horas de servicio (Meta 1).</p>
        </div>
        
        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-3">
          <ModalAlianza onSuccess={cargarDatos}>
            <Button variant="outline" className="flex items-center gap-2">
              <Handshake className="w-4 h-4 text-slate-500" />
              Nueva Alianza
            </Button>
          </ModalAlianza>
          <ModalReclutamiento onSuccess={cargarDatos}>
            <Button variant="outline" className="flex items-center gap-2 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
              <UserPlus className="w-4 h-4" />
              Inscribir Estudiantes
            </Button>
          </ModalReclutamiento>
          <ModalTaller onSuccess={cargarDatos}>
            <Button variant="outline" className="flex items-center gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
              <BookOpen className="w-4 h-4" />
              Reportar Taller
            </Button>
          </ModalTaller>
        </div>
      </div>

      {/* Top Section: KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Progreso de Indicadores (KPIs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <StatCardWithProgress 
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={React.createElement(kpi.icon, { className: 'h-4 w-4' })}
              color={kpi.color}
              progress={kpi.progress}
              weight={kpi.peso}
            />
          ))}
        </div>
      </section>

      {/* Middle Section: Workflow Timeline */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Cronograma de Ejecución</h2>
        <WorkflowTimeline workflows={workflows} />
      </section>

      {/* Bottom Section: Student Tracking Table */}
      <section>
        <StudentTrackingTable 
          students={studentTracking} 
          onCambiarEstado={handleCambiarEstado}
          onEditarEstudiante={handleEditarEstudiante}
        />
        
        {/* Modal de edición de estudiante */}
        <ModalReclutamiento
          estudiante={estudianteEditando}
          onSuccess={() => {
            setEstudianteEditando(null);
            cargarDatos();
          }}
        >
          <span />
        </ModalReclutamiento>
      </section>
    </div>
  );
};

export default ServicioSocialView;
