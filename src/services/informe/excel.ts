/**
 * Generación del Excel de informe de metas
 * Usa datos de Supabase y formatea según el original
 */
import * as XLSX from 'xlsx';
import { getAllMetasData } from './lib/datos';
import type { Meta1Data, Meta2Data, Meta3Data, Meta4Data, Meta5Data } from './lib/datos';
import { COLORES_META, setColumnWidth, applyHeaderStyle } from './lib/estilos';

/**
 * Genera el archivo Excel
 */
export const generarExcelMetas = async (): Promise<Blob> => {
  const [meta1, meta2, meta3, meta4, meta5] = await getAllMetasData();
  const wb = XLSX.utils.book_new();

  // Crear cada hoja
  crearHojaResumen(wb, meta1, meta2, meta3, meta4, meta5);
  crearHojaMeta1(wb, meta1);
  crearHojaMeta2(wb, meta2);
  crearHojaMeta3(wb, meta3);
  crearHojaMeta4(wb, meta4);
  crearHojaMeta5(wb, meta5);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Descarga el Excel
 */
export const descargarExcelMetas = async (filename?: string): Promise<void> => {
  const blob = await generarExcelMetas();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `informe-metas-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================
// HOJAS INDIVIDUALES
// ============================================

const crearHojaResumen = (wb: XLSX.WorkBook, m1: Meta1Data, m2: Meta2Data, m3: Meta3Data, m4: Meta4Data, m5: Meta5Data) => {
  // Calcular avances
  const avance1 = Math.round((m1.universidades/5*40) + (m1.estudiantes/60*30) + (m1.talleres/140*15) + (m1.usuarios/600*15));
  const avance2 = m2.historial.length > 0 ? m2.historial[m2.historial.length-1].progreso : 0;
  const avance3 = Math.round((m3.mesas.length / 21) * 100);
  const avance4 = m4.tasaExito;
  const avance5 = m5.conectividad;

  const data = [
    ['', '', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Equipo de Trabajo:', 'Enlace Regional', '', '', '', '', '', ''],
    ['', 'Regional:', 'Los Santos', '', '', '', '', '', ''],
    ['', '', '', '', 'Tiempo ejecución', '', '', '', ''],
    ['', 'Meta No.', 'Meta', 'Descripción de la Meta', 'Inicio', 'Final', 'Responsable', 'Meta Alcanzada\nAño 2026', 'Observaciones'],
    ['', 1, 'Implementar el programa de Servicio Social Universitario integrando estudiantes de educación superior en las Infoplazas para fortalecer la capacitación comunitaria',
     `Indicador:\n• Número de Universidades participantes: 5\n• Número de estudiantes participantes: 60\n• Número de capacitaciones o talleres impartidos: 140\n• Número de usuarios finales capacitados: 600\nMínimo 24 Infoplazas diferentes.`,
     '01/01/2026', '30/11/2026', 'Guillermo Rivera', `${avance1}%`, ''],
    ['', 2, 'Incrementar la participación ciudadana en las Infoplazas mediante supervisión constante, identificación de problemas y aplicación de soluciones.',
     `Indicador:\n• Meta cuatrimestral: Incrementar en 29 Infoplazas al 30%.\n• Utilización del COGNITOS al 100%.`,
     '01/01/2026', '31/12/2026', 'Jose Ruiz', `${avance2}%`, ''],
    ['', 3, 'Organizar y completar 21 Mesas de Transformación en la regional de Los Santos.',
     `Obtener 80% de participación por provincia.\nDeben participar 21 mesas:\nCoclé: 6 | Los Santos: 9 | Herrera: 6`,
     '01/01/2026', '31/12/2026', 'Rogelio Cruz', `${avance3}%`, ''],
    ['', 4, 'Realizar y cumplir plan de visitas a las Infoplazas 95% mensual.',
     `Cumplir con el plan de visitas en 95%.\nVerificación de sincronización de Bases de datos 100%.`,
     '01/01/2026', '31/12/2026', 'Jose Ruiz, Rogelio Cruz, Guillermo Rivera', `${avance4}%`, ''],
    ['', 5, 'Seguimiento a los softwares de soporte de datos:\n-Proyecto KPAX',
     `Indicador:\n• 100% de equipos reportando correctamente.\n• Mantener activos el 100% de las licencias.`,
     '01/01/2026', '31/12/2026', 'Jose Ruiz, Rogelio Cruz, Guillermo Rivera', `${avance5}%`, ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [3, 8, 45, 60, 12, 12, 28, 18, 20]);
  
  // Aplicar colores a filas de metas
  applyHeaderStyle(ws, 'B2:I2', COLORES_META.header);
  applyHeaderStyle(ws, 'B9:I9', COLORES_META.header);
  applyHeaderStyle(ws, 'B10:H10', COLORES_META.meta1);
  applyHeaderStyle(ws, 'B11:H11', COLORES_META.meta2);
  applyHeaderStyle(ws, 'B12:H12', COLORES_META.meta3);
  applyHeaderStyle(ws, 'B13:H13', COLORES_META.meta4);
  applyHeaderStyle(ws, 'B14:H14', COLORES_META.meta5);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Metas ENLACES');
};

const crearHojaMeta1 = (wb: XLSX.WorkBook, m: Meta1Data) => {
  const data = [
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', 'Meta No.1 - Servicio Social Universitario', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'PROGRAMA DE SERVICIO SOCIAL UNIVERSITARIO 2026', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Resultados Acumulados:', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Indicador', 'Meta', 'Ejecutado', '%', '', '', '', ''],
    ['', 'Universidades', 5, m.universidades, Math.round(m.universidades/5*100), '', '', '', ''],
    ['', 'Estudiantes', 60, m.estudiantes, Math.round(m.estudiantes/60*100), '', '', '', ''],
    ['', 'Talleres', 140, m.talleres, Math.round(m.talleres/140*100), '', '', '', ''],
    ['', 'Usuarios', 600, m.usuarios, Math.round(m.usuarios/600*100), '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', 'AVANCE MENUAL', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Mes', 'Talleres', 'Usuarios', '', '', '', '', ''],
    ...m.talleresPorMes.map(t => ['', t.mes, t.cantidad, t.usuarios, '', '', '', '', ''])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [5, 25, 12, 12, 10, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Meta No.1 2026');
};

const crearHojaMeta2 = (wb: XLSX.WorkBook, m: Meta2Data) => {
  const data = [
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', 'Meta No.2 - Cumplimiento 30%', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'SEGUIMIENTO VISITAS A INFOPLAZAS', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Resultados:', `Incidencias: ${m.incidencias}`, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Mes', 'IP Sobre 30%', 'Total IP', '%', '', '', '', ''],
    ...m.historial.map(h => ['', h.mes, h.ip_sobre_30, h.total, h.progreso, '', '', '', ''])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [5, 20, 15, 12, 12, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Meta No.2 2026');
};

const crearHojaMeta3 = (wb: XLSX.WorkBook, m: Meta3Data) => {
  const data = [
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', 'Meta No.3 - Mesas de Transformación', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'MESAS DE TRANSFORMACIÓN 2026', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Resumen:', `Completadas: ${m.totalCompletadas}`, `En Progreso: ${m.totalProgreso}`, '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Región', 'Mesa', 'Infoplaza', 'Estado', 'Participantes', 'Dinamizador', '', ''],
    ...m.mesas.map(x => ['', x.region, x.mesa, x.infoplaza, x.estado, x.participantes, x.dinamizador, '', ''])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [5, 15, 8, 25, 15, 12, 25, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Meta No.3 2026');
};

const crearHojaMeta4 = (wb: XLSX.WorkBook, m: Meta4Data) => {
  const data = [
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', 'Meta No.4 - Plan de Visitas', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'CUMPLIMIENTO DE RUTAS', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Resumen:', `Tasa de Éxito: ${m.tasaExito}%`, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Enlace', 'Visitadas', 'Meta', '%', '', '', '', ''],
    ...m.enlaces.map(e => ['', e.nombre, e.visitadas, e.meta, e.cumplimiento, '', '', '', ''])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [5, 30, 12, 10, 15, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Meta No.4 2026');
};

const crearHojaMeta5 = (wb: XLSX.WorkBook, m: Meta5Data) => {
  const data = [
    ['', 'Metas 2026', '', '', '', '', '', '', ''],
    ['', 'SUB DIRECCIÓN DE OPERACIONES', '', '', '', '', '', '', ''],
    ['', 'Meta No.5 - KPAX', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'SEGUIMIENTO SOFTWARE KPAX', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Resumen de Equipos:', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Indicador', 'Valor', '%', '', '', '', '', ''],
    ['', 'Equipos Online', m.equiposOnline, m.conectividad, '', '', '', '', ''],
    ['', 'Equipos Totales', m.equiposTotal, '', '', '', '', '', ''],
    ['', 'Equipos Críticos', m.criticos, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['', 'Conectividad Regional:', `${m.conectividad}%`, '', '', '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidth(ws, [5, 25, 15, 12, 10, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Ejecución Meta No.5 2026');
};
