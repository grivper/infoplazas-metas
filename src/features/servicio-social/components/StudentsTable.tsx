import type { ReactNode } from 'react';
import type { StudentData } from './StudentTrackingTable';

interface StudentsTableProps {
  students: StudentData[];
  renderActions: (student: StudentData) => ReactNode;
  roundedHeader?: boolean;
}

export function StudentsTable({ students, renderActions, roundedHeader = false }: StudentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className={roundedHeader
          ? 'text-xs text-on-surface-variant uppercase bg-surface-container-low rounded-t-lg'
          : 'text-xs text-on-surface-variant uppercase bg-surface-container-low'}>
          <tr>
            <th className={roundedHeader ? 'px-4 py-3 font-medium rounded-tl-lg' : 'px-4 py-3 font-medium'}>Estudiante</th>
            <th className="hidden lg:table-cell px-4 py-3 font-medium">Cédula</th>
            <th className="hidden md:table-cell px-4 py-3 font-medium">Universidad</th>
            <th className="hidden sm:table-cell px-4 py-3 font-medium">Infoplaza</th>
            <th className="hidden lg:table-cell px-4 py-3 font-medium">Carrera</th>
            <th className="hidden lg:table-cell px-4 py-3 font-medium">Año</th>
            <th className="hidden md:table-cell px-4 py-3 font-medium">Talleres</th>
            <th className="hidden lg:table-cell px-4 py-3 font-medium">Inscripción</th>
            <th className={roundedHeader ? 'px-4 py-3 font-medium rounded-tr-lg' : 'px-4 py-3 font-medium'}>Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-surface-container-low/50 transition-colors">
              <td className="px-4 py-3 font-medium text-on-surface">{student.nombre_estudiante}</td>
              <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant font-mono text-xs">{student.cedula}</td>
              <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">{student.universidad}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-on-surface-variant">{student.infoplaza}</td>
              <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant">{student.carrera}</td>
              <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant">
                {student.anio_cursa ? student.anio_cursa.replace(/[^0-9]/g, '') : '-'}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-on-surface-variant">{student.talleres}</td>
              <td className="hidden lg:table-cell px-4 py-3 text-on-surface-variant">{student.fecha_inscripcion}</td>
              <td className="px-4 py-3">{renderActions(student)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
