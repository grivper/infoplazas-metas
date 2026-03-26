import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, CheckCircle, X, RotateCcw, Search, Pencil } from 'lucide-react';
import { useState } from 'react';

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
  // Datos originales para edición
  universidad_id?: string | null;
  infoplaza_id?: string | null;
}

interface EstudianteParaEditar {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  universidad_id: string | null;
  carrera: string;
  anio_cursa: string;
  infoplaza_id: string | null;
}

interface StudentTrackingTableProps {
  students: StudentData[];
  onCambiarEstado: (id: string, nuevoEstado: 'activo' | 'completado' | 'cancelado') => void;
  onEditarEstudiante?: (estudiante: EstudianteParaEditar) => void;
}

type FiltroTab = 'todos' | 'activos' | 'completados' | 'cancelados';

export function StudentTrackingTable({ students, onCambiarEstado, onEditarEstudiante }: StudentTrackingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('todos');

  // Filtrar estudiantes por término de búsqueda (nombre, cédula, universidad, infoplaza, carrera)
  // Y por tab de estado (todos, activos, completados, cancelados)
  const estudiantesFiltrados = students.filter(student => {
    const search = searchTerm.toLowerCase();
    const matchSearch = 
      student.nombre_estudiante.toLowerCase().includes(search) ||
      student.cedula.toLowerCase().includes(search) ||
      student.universidad.toLowerCase().includes(search) ||
      student.infoplaza.toLowerCase().includes(search) ||
      student.carrera.toLowerCase().includes(search);

    if (filtroTab === 'todos') return matchSearch;
    if (filtroTab === 'activos') return matchSearch && student.status === 'Activo';
    if (filtroTab === 'completados') return matchSearch && student.status === 'Completado';
    if (filtroTab === 'cancelados') return matchSearch && student.status === 'Cancelado';
    return matchSearch;
  });

  // Agrupar estudiantes por estado para mostrar en secciones separadas en vista "Todos"
  const activos = estudiantesFiltrados.filter(s => s.status === 'Activo');
  const completados = estudiantesFiltrados.filter(s => s.status === 'Completado');
  const cancelados = estudiantesFiltrados.filter(s => s.status === 'Cancelado');

  // Función para renderizar los botones de acción
  const renderActions = (student: StudentData) => (
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
      {/* Botón de editar (disponible para todos los estados) */}
      {onEditarEstudiante && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100"
          onClick={() => onEditarEstudiante({
            id: student.id,
            nombre_estudiante: student.nombre_estudiante,
            cedula: student.cedula,
            universidad_id: student.universidad_id || null,
            carrera: student.carrera,
            anio_cursa: student.anio_cursa,
            infoplaza_id: student.infoplaza_id || null,
          })}
          title="Editar estudiante"
        >
          <Pencil className="w-3 h-3" />
        </Button>
      )}
      {/* Solo mostrar acciones si está ACTIVO */}
      {student.status === 'Activo' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onCambiarEstado(student.id, 'completado')}
            title="Marcar como completado"
          >
            <CheckCircle className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => onCambiarEstado(student.id, 'cancelado')}
            title="Cancelar/Retirar"
          >
            <X className="w-3 h-3" />
          </Button>
        </>
      )}
      {/* Solo mostrar botón reactivar si está CANCELADO */}
      {student.status === 'Cancelado' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => onCambiarEstado(student.id, 'activo')}
          title="Reactivar"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );

  // Función para renderizar una sección de tabla
  const renderTableSection = (title: string, data: StudentData[], colorClass: string, badgeColor: string) => {
    if (data.length === 0) return null;
    return (
      <div className="mb-6 last:mb-0">
        <div className={`px-4 py-2 border-b ${colorClass}`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{title}</h4>
            <Badge variant="outline" className={badgeColor}>
              {data.length} {data.length === 1 ? 'estudiante' : 'estudiantes'}
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium">Estudiante</th>
                <th className="px-4 py-3 font-medium">Cédula</th>
                <th className="px-4 py-3 font-medium">Universidad</th>
                <th className="px-4 py-3 font-medium">Infoplaza</th>
                <th className="px-4 py-3 font-medium">Carrera</th>
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="px-4 py-3 font-medium">Talleres</th>
                <th className="px-4 py-3 font-medium">Inscripción</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{student.nombre_estudiante}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{student.cedula}</td>
                  <td className="px-4 py-3 text-slate-600">{student.universidad}</td>
                  <td className="px-4 py-3 text-slate-600">{student.infoplaza}</td>
                  <td className="px-4 py-3 text-slate-600">{student.carrera}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {student.anio_cursa ? student.anio_cursa.replace(/[^0-9]/g, '') : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.talleres}</td>
                  <td className="px-4 py-3 text-slate-600">{student.fecha_inscripcion}</td>
                  <td className="px-4 py-3">{renderActions(student)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Seguimiento de Estudiantes</CardTitle>
        <CardDescription>
          Listado activo de estudiantes realizando servicio social.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay estudiantes registrados aún.</p>
            <p className="text-sm">Usa el botón "Inscribir Estudiantes" para registrar el primer estudiante.</p>
          </div>
        ) : (
          <>
            {/* Buscador y filtros */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, cédula, universidad, infoplaza..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { value: 'todos', label: 'Todos' },
                  { value: 'activos', label: 'Activos' },
                  { value: 'completados', label: 'Completados' },
                  { value: 'cancelados', label: 'Cancelados' },
                ].map((tab) => (
                  <Button
                    key={tab.value}
                    variant={filtroTab === tab.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroTab(tab.value as FiltroTab)}
                    className="text-xs"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tablas separadas por estado */}
            {filtroTab === 'todos' ? (
              <>
                {renderTableSection('Activos', activos, 'bg-blue-50 border-blue-100', 'bg-blue-50 text-blue-700 border-blue-200')}
                {renderTableSection('Completados', completados, 'bg-emerald-50 border-emerald-100', 'bg-emerald-50 text-emerald-700 border-emerald-200')}
                {renderTableSection('Cancelados', cancelados, 'bg-rose-50 border-rose-100', 'bg-rose-50 text-rose-700 border-rose-200')}
              </>
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
                    {estudiantesFiltrados.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{student.nombre_estudiante}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{student.cedula}</td>
                        <td className="px-4 py-3 text-slate-600">{student.universidad}</td>
                        <td className="px-4 py-3 text-slate-600">{student.infoplaza}</td>
                        <td className="px-4 py-3 text-slate-600">{student.carrera}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {student.anio_cursa ? student.anio_cursa.replace(/[^0-9]/g, '') : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{student.talleres}</td>
                        <td className="px-4 py-3 text-slate-600">{student.fecha_inscripcion}</td>
                        <td className="px-4 py-3">{renderActions(student)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {estudiantesFiltrados.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No se encontraron estudiantes con ese criterio de búsqueda.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
