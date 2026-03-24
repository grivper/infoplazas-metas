import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, X, RotateCcw } from 'lucide-react';

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

interface StudentTrackingTableProps {
  students: StudentData[];
  onCambiarEstado: (id: string, nuevoEstado: 'activo' | 'completado' | 'cancelado') => void;
}

export function StudentTrackingTable({ students, onCambiarEstado }: StudentTrackingTableProps) {
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
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{student.nombre_estudiante}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{student.cedula}</td>
                    <td className="px-4 py-3 text-slate-600">{student.universidad}</td>
                    <td className="px-4 py-3 text-slate-600">{student.infoplaza}</td>
                    <td className="px-4 py-3 text-slate-600">{student.carrera}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {/* Extrae solo números del año (ej: "4to Año" → "4", "3er Año" → "3") */}
                      {student.anio_cursa ? student.anio_cursa.replace(/[^0-9]/g, '') : '-'}
                    </td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
