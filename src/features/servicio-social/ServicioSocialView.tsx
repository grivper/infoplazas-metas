import React, { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, Building2, Handshake, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModalAlianza } from './components/ModalAlianza';
import { ModalReclutamiento } from './components/ModalReclutamiento';
import { ModalTaller } from './components/ModalTaller';

// DB Services
import { getAlianzasCount } from './services/alianzasDb';
import { getReclutamientos, getTotalEstudiantesReclutados, updateEstadoEstudiante } from './services/reclutamientoDb';
import { getTalleresCount, getTotalUsuariosCapacitados, getTalleresCountByReclutamiento } from './services/talleresDb';

// Tipos para datos reales
interface KPIData {
  title: string;
  value: string | number;
  icon: React.ElementType;
  progress: number;
  color: string;
}

interface Workflow {
  phase: string;
  dates: string;
  desc: string;
  status: 'Completado' | 'En curso' | 'Planificado';
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
}

export const ServicioSocialView: React.FC = () => {
  // State para datos reales
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [studentTracking, setStudentTracking] = useState<StudentData[]>([]);

  // Función para cambiar estado del estudiante
  const handleCambiarEstado = async (estudianteId: string, nuevoEstado: 'activo' | 'completado' | 'cancelado') => {
    const result = await updateEstadoEstudiante(estudianteId, nuevoEstado);
    if (result.success) {
      // Recargar datos
      cargarDatos();
    }
  };

  // Workflows calculados dinámicamente desde Supabase
  const getWorkflows = (): Workflow[] => {
    const alianzas = kpiData[0]?.value as number || 0;
    const estudiantes = kpiData[1]?.value as number || 0;
    const talleres = kpiData[2]?.value as number || 0;

    const metaAlianzas = 5;
    const metaEstudiantes = 60;
    const metaTalleres = 600;

    return [
      {
        phase: 'Alianzas',
        dates: `${alianzas}/${metaAlianzas} universidades`,
        desc: 'Gestión de acuerdos con universidades.',
        status: alianzas >= metaAlianzas ? 'Completado' : 'En curso',
      },
      {
        phase: 'Reclutamiento',
        dates: `${estudiantes}/${metaEstudiantes} estudiantes`,
        desc: 'Selección y captación de estudiantes.',
        status: estudiantes >= metaEstudiantes ? 'Completado' : 'En curso',
      },
      {
        phase: 'Ejecución',
        dates: `${talleres}/${metaTalleres} talleres`,
        desc: 'Despliegue operativo en Infoplazas.',
        status: talleres >= metaTalleres ? 'Completado' : 'En curso',
      },
    ];
  };

  // Workflows se genera dinámicamente con getWorkflows()
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
          color: 'bg-blue-500',
        },
        {
          title: 'Estudiantes Reclutados',
          value: estudiantesTotal,
          icon: Users,
          progress: Math.min((estudiantesTotal / 60) * 100, 100), // Meta: 60 estudiantes
          color: 'bg-emerald-500',
        },
        {
          title: 'Talleres Impartidos',
          value: talleresCount,
          icon: BookOpen,
          progress: Math.min((talleresCount / 30) * 100, 100), // Meta: 30 talleres
          color: 'bg-amber-500',
        },
        {
          title: 'Usuarios Capacitados',
          value: usuariosCapacitados,
          icon: GraduationCap,
          progress: Math.min((usuariosCapacitados / 1000) * 100, 100), // Meta: 1000 usuarios
          color: 'bg-purple-500',
        },
      ]);

      // Mapear reclutamientos a formato de tabla de estudiantes
      const students: StudentData[] = await Promise.all(
        reclutamientosData.map(async (r) => {
          // Contar talleres para este estudiante
          const talleresCount = await getTalleresCountByReclutamiento(r.id);
          
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
            talleres: talleresCount,
            fecha_inscripcion: r.created_at ? new Date(r.created_at).toLocaleDateString('es-PA') : '-',
            status: statusLabel,
            estado_original: r.estado || 'activo',
          };
        })
      );
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando datos de Servicio Social...</p>
        </div>
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
            <Card key={index} className="border-none shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.color} bg-opacity-10`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color.replace('bg-', 'text-')}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
                  <div
                    className={`${kpi.color} h-1.5 rounded-full`}
                    style={{ width: `${kpi.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{Number(kpi.progress).toFixed(2)}% de la meta anual</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Middle Section: Workflow Timeline */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Cronograma de Ejecución</h2>
        <Card className="border-none shadow-sm bg-white/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
              {/* Línea conectora base (oculta en móviles, visible en desktop) */}
              <div className="hidden lg:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-slate-100 -z-10" />

              {getWorkflows().map((flow, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative z-10 transition-transform hover:-translate-y-1 duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fase {idx + 1}</span>
                        <h3 className="text-lg font-bold text-slate-800 mt-0.5">{flow.phase}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">{flow.dates}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          flow.status === 'Completado'
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                            : flow.status === 'En curso'
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-slate-300 text-slate-500 bg-slate-50'
                        }
                      >
                        {flow.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{flow.desc}</p>
                  </div>
                  
                  {/* Flecha conectora para desktop */}
                  {idx < getWorkflows().length - 1 && (
                    <div className="hidden lg:flex items-center justify-center text-slate-300 w-12 shrink-0">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                  {/* Flecha conectora para móvil */}
                  {idx < getWorkflows().length - 1 && (
                    <div className="lg:hidden flex justify-center w-full py-2">
                       <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bottom Section: Student Tracking Table */}
      <section>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Seguimiento de Estudiantes</CardTitle>
            <CardDescription>
              Listado activo de estudiantes realizando servicio social.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentTracking.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay estudiantes registrados aún.</p>
                <p className="text-sm">Usa el botón "Inscribir Estudiantes" para registrar el primer estudiante.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-t-lg">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Estudiante</th>
                      <th className="px-4 py-3 font-medium">Cédula</th>
                      <th className="px-4 py-3 font-medium">Universidad</th>
                      <th className="px-4 py-3 font-medium">Infoplaza</th>
                      <th className="px-4 py-3 font-medium">Carrera</th>
                      <th className="px-4 py-3 font-medium">Año</th>
                      <th className="px-4 py-3 font-medium">Talleres</th>
                      <th className="px-4 py-3 font-medium">Inscripción</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentTracking.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{student.nombre_estudiante}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{student.cedula}</td>
                        <td className="px-4 py-3 text-slate-600">{student.universidad}</td>
                        <td className="px-4 py-3 text-slate-600">{student.infoplaza}</td>
                        <td className="px-4 py-3 text-slate-600">{student.carrera}</td>
                        <td className="px-4 py-3 text-slate-600">{student.anio_cursa}</td>
                        <td className="px-4 py-3 text-slate-600">{student.talleres}</td>
                        <td className="px-4 py-3 text-slate-600">{student.fecha_inscripcion}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                student.status === 'Completado'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                  : student.status === 'Activo'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                              }
                            >
                              {student.status}
                            </Badge>
                            {/* Solo mostrar acciones si está ACTIVO */}
                            {student.status === 'Activo' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleCambiarEstado(student.id, 'completado')}
                                  title="Marcar como completado"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleCambiarEstado(student.id, 'cancelado')}
                                  title="Cancelar/Retirar"
                                >
                                  ✕
                                </Button>
                              </>
                            )}
                            {/* Solo mostrar botón reactivar si está CANCELADO */}
                            {student.status === 'Cancelado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleCambiarEstado(student.id, 'activo')}
                                title="Reactivar"
                              >
                                ↩
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ServicioSocialView;
