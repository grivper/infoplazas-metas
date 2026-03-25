/**
 * Hoja: Resumen de Metas
 */
import ExcelJS from 'exceljs';
import type { Meta1Data, Meta2Data, Meta3Data, Meta4Data, Meta5Data } from '../datos';
import { COLORES_META } from '../estilos';

export const crearHojaResumen = async (
  wb: ExcelJS.Workbook,
  m1: Meta1Data,
  m2: Meta2Data,
  m3: Meta3Data,
  m4: Meta4Data,
  m5: Meta5Data
) => {
  const ws = wb.addWorksheet('Resumen de Metas ENLACES');

  // Calcular avances
  const avance1 = Math.round((m1.universidades / 5 * 40) + (m1.estudiantes / 60 * 30) + (m1.talleres / 140 * 15) + (m1.usuarios / 600 * 15));
  const avance2 = m2.historial.length > 0 ? m2.historial[m2.historial.length - 1].progreso : 0;
  const avance3 = Math.round((m3.mesas.length / 21) * 100);
  const avance4 = m4.tasaExito;
  const avance5 = m5.conectividad;

  // Título principal
  ws.mergeCells(2, 2, 2, 4);
  ws.getCell(2, 2).value = 'SUB DIRECCIÓN DE OPERACIONES';
  ws.getCell(2, 2).font = { bold: true, size: 14 };

  ws.mergeCells(4, 2, 4, 4);
  ws.getCell(4, 2).value = 'Metas 2026';
  ws.getCell(4, 2).font = { bold: true, size: 12 };

  // Info equipo
  ws.getCell(6, 2).value = 'Equipo de Trabajo:';
  ws.getCell(6, 3).value = 'Enlace Regional';
  ws.getCell(7, 2).value = 'Regional:';
  ws.getCell(7, 3).value = 'Los Santos';
  ws.getCell(8, 5).value = 'Tiempo ejecución';

  // Headers
  const headerRow = 9;
  const headers = ['Meta No.', 'Meta', 'Descripción de la Meta', 'Inicio', 'Final', 'Responsable', 'Meta Alcanzada\nAño 2026', 'Observaciones'];
  headers.forEach((h, i) => {
    ws.getCell(headerRow, i + 2).value = h;
    ws.getCell(headerRow, i + 2).font = { bold: true };
    ws.getCell(headerRow, i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + COLORES_META.header.slice(1) }
    };
    ws.getCell(headerRow, i + 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Filas de metas
  const metas = [
    { nro: 1, nombre: 'Implementar el programa de Servicio Social Universitario integrando estudiantes de educación superior en las Infoplazas para fortalecer la capacitación comunitaria',
      desc: 'Indicador:\n• Número de Universidades participantes: 5\n• Número de estudiantes participantes: 60\n• Número de capacitaciones o talleres impartidos: 140\n• Número de usuarios finales capacitados: 600\nMínimo 24 Infoplazas diferentes.',
      inicio: '01/01/2026', fin: '30/11/2026', responsable: 'Guillermo Rivera', avance: `${avance1}%`, color: COLORES_META.meta1 },
    { nro: 2, nombre: 'Incrementar la participación ciudadana en las Infoplazas mediante supervisión constante, identificación de problemas y aplicación de soluciones.',
      desc: 'Indicador:\n• Meta cuatrimestral: Incrementar en 29 Infoplazas al 30%.\n• Utilización del COGNITOS al 100%.',
      inicio: '01/01/2026', fin: '31/12/2026', responsable: 'Jose Ruiz', avance: `${avance2}%`, color: COLORES_META.meta2 },
    { nro: 3, nombre: 'Organizar y completar 21 Mesas de Transformación en la regional de Los Santos.',
      desc: 'Obtener 80% de participación por provincia.\nDeben participar 21 mesas:\nCoclé: 6 | Los Santos: 9 | Herrera: 6',
      inicio: '01/01/2026', fin: '31/12/2026', responsable: 'Rogelio Cruz', avance: `${avance3}%`, color: COLORES_META.meta3 },
    { nro: 4, nombre: 'Realizar y cumplir plan de visitas a las Infoplazas 95% mensual.',
      desc: 'Cumplir con el plan de visitas en 95%.\nVerificación de sincronización de Bases de datos 100%.',
      inicio: '01/01/2026', fin: '31/12/2026', responsable: 'Jose Ruiz, Rogelio Cruz, Guillermo Rivera', avance: `${avance4}%`, color: COLORES_META.meta4 },
    { nro: 5, nombre: 'Seguimiento a los softwares de soporte de datos:\n-Proyecto KPAX',
      desc: 'Indicador:\n• 100% de equipos reportando correctamente.\n• Mantener activos el 100% de las licencias.',
      inicio: '01/01/2026', fin: '31/12/2026', responsable: 'Jose Ruiz, Rogelio Cruz, Guillermo Rivera', avance: `${avance5}%`, color: COLORES_META.meta5 }
  ];

  metas.forEach((meta, idx) => {
    const row = 10 + idx;
    ws.getCell(row, 2).value = meta.nro;
    ws.getCell(row, 3).value = meta.nombre;
    ws.getCell(row, 4).value = meta.desc;
    ws.getCell(row, 5).value = meta.inicio;
    ws.getCell(row, 6).value = meta.fin;
    ws.getCell(row, 7).value = meta.responsable;
    ws.getCell(row, 8).value = meta.avance;
    ws.getCell(row, 9).value = '';

    // Color de fondo
    for (let c = 2; c <= 9; c++) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + meta.color.slice(1) } };
    }
    ws.getCell(row, 4).alignment = { wrapText: true, vertical: 'top' };
  });

  ws.getColumn(2).width = 3;
  ws.getColumn(3).width = 8;
  ws.getColumn(4).width = 45;
  ws.getColumn(5).width = 60;
  ws.getColumn(6).width = 12;
  ws.getColumn(7).width = 12;
  ws.getColumn(8).width = 28;
  ws.getColumn(9).width = 18;
  ws.getColumn(10).width = 20;
};
