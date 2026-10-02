/**
 * Genera el libro de Excel con las confirmaciones del encuentro regional,
 * para descargarlo directamente desde el navegador.
 *
 * Esta lógica es un puerto de scripts/generate-confirmaciones-workbook.mjs:
 * mismos encabezados, orden, semántica Sí/No/Pendiente, exclusión de
 * infoplazas cerradas, filtro de dinamizadores Activo y enlace por
 * itinerario_enlaces. La diferencia es que aquí se usa el cliente
 * autenticado de Supabase (`@/lib/supabase`) en vez de la service role,
 * por lo que las políticas RLS del usuario logueado aplican.
 */
import { supabase } from '@/lib/supabase';
import { ENCUENTRO_CLAVE, getEncuentroByClave } from './encuentrosService';
import { createWorkbook } from './confirmacionesWorkbook';

export interface ConfirmacionWorkbookRow {
  infoplaza: string;
  provincia: string;
  distrito: string;
  corregimiento: string;
  cedula: string;
  asistencia: string;
  hospedaje: string;
  cena: string;
  enlace: string;
  confirmados: string;
  pendientes: string;
  dinamizador: string;
}

type RelatedRow<T> = T | T[] | null | undefined;

export interface InfoplazaRow {
  id: string;
  nombre: string;
  region: string | null;
  distrito: string | null;
  corregimiento: string | null;
  cerrada: boolean;
}

export interface DinamizadorRow {
  nombre: string;
  cedula: string | null;
  estatus: string;
  catalogo_infoplazas: RelatedRow<InfoplazaRow>;
}

export interface ConfirmacionQueryRow {
  asiste: boolean | null;
  se_hospeda: boolean | null;
  cena: boolean | null;
  confirmado_at: string | null;
  dinamizadores: RelatedRow<DinamizadorRow>;
}

export interface ItinerarioEnlaceRow {
  infoplaza_id: string;
  enlace_nombre: string;
}

export const formatResponse = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) return 'Pendiente';
  return value ? 'Sí' : 'No';
};

const formatBoolean = (value: boolean): string => (value ? 'Sí' : 'No');

const text = (value: unknown): string => String(value ?? '').trim();

const getRelatedRow = <T,>(value: RelatedRow<T>): T | null => (
  Array.isArray(value) ? value[0] ?? null : value ?? null
);

/** Agrupa los nombres de enlace del itinerario por infoplaza, sin duplicados. */
export const createEnlacesByInfoplazaId = (itinerarioEnlaces: ItinerarioEnlaceRow[]): Map<string, string> => {
  const namesByInfoplazaId = new Map<string, Set<string>>();

  for (const itinerary of itinerarioEnlaces) {
    const infoplazaId = text(itinerary.infoplaza_id);
    const enlaceName = text(itinerary.enlace_nombre);
    if (!infoplazaId || !enlaceName) continue;

    const names = namesByInfoplazaId.get(infoplazaId) ?? new Set<string>();
    names.add(enlaceName);
    namesByInfoplazaId.set(infoplazaId, names);
  }

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  return new Map([...namesByInfoplazaId].map(([infoplazaId, names]) => [
    infoplazaId,
    [...names].sort(collator.compare).join(', '),
  ]));
};

/**
 * Transforma confirmaciones crudas + enlaces de itinerario en las filas del
 * reporte, ya filtradas (infoplaza cerrada, dinamizador/infoplaza faltante) y
 * ordenadas por provincia, infoplaza, dinamizador y cédula. Pura: sin acceso
 * a Supabase, para poder probarla sin red.
 */
export const buildConfirmacionRows = (
  confirmaciones: ConfirmacionQueryRow[],
  itinerarioEnlaces: ItinerarioEnlaceRow[],
): ConfirmacionWorkbookRow[] => {
  const enlacesByInfoplazaId = createEnlacesByInfoplazaId(itinerarioEnlaces);

  const validRows = confirmaciones.flatMap((confirmacion) => {
    const dinamizador = getRelatedRow(confirmacion.dinamizadores);
    const infoplaza = getRelatedRow(dinamizador?.catalogo_infoplazas);
    if (!dinamizador || !infoplaza || infoplaza.cerrada) return [];

    const enlace = enlacesByInfoplazaId.get(text(infoplaza.id)) ?? '';
    const confirmed = confirmacion.confirmado_at !== null && confirmacion.confirmado_at !== undefined;

    return [{
      infoplaza: text(infoplaza.nombre),
      provincia: text(infoplaza.region),
      distrito: text(infoplaza.distrito),
      corregimiento: text(infoplaza.corregimiento),
      cedula: text(dinamizador.cedula),
      asistencia: formatResponse(confirmacion.asiste),
      hospedaje: formatResponse(confirmacion.se_hospeda),
      cena: formatResponse(confirmacion.cena),
      enlace,
      confirmados: formatBoolean(confirmed),
      pendientes: formatBoolean(!confirmed),
      dinamizador: text(dinamizador.nombre),
    }];
  });

  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  validRows.sort((left, right) => (
    collator.compare(left.provincia, right.provincia)
    || collator.compare(left.infoplaza, right.infoplaza)
    || collator.compare(left.dinamizador, right.dinamizador)
    || collator.compare(left.cedula, right.cedula)
  ));

  return validRows;
};

/** Carga las confirmaciones válidas del encuentro regional y las ordena para el reporte. */
const loadRows = async (): Promise<{ encuentroNombre: string; rows: ConfirmacionWorkbookRow[] }> => {
  const encuentro = await getEncuentroByClave(ENCUENTRO_CLAVE);
  if (!encuentro) {
    throw new Error(
      `No existe el encuentro con clave "${ENCUENTRO_CLAVE}". Aplique la migración del Encuentro Regional antes de generar el reporte.`,
    );
  }

  const { data: confirmaciones, error: confirmacionesError } = await supabase
    .from('confirmaciones')
    .select(`
      asiste,
      se_hospeda,
      cena,
      confirmado_at,
      dinamizadores!inner (
        nombre,
        cedula,
        estatus,
        catalogo_infoplazas!inner (
          id,
          nombre,
          region,
          distrito,
          corregimiento,
          cerrada
        )
      )
    `)
    .eq('encuentro_id', encuentro.id)
    .eq('dinamizadores.estatus', 'Activo');

  if (confirmacionesError) {
    throw new Error(`No se pudieron leer las confirmaciones: ${confirmacionesError.message}`);
  }

  const { data: itinerarioEnlaces, error: itinerarioEnlacesError } = await supabase
    .from('itinerario_enlaces')
    .select('infoplaza_id, enlace_nombre');

  if (itinerarioEnlacesError) {
    throw new Error(`No se pudo leer el itinerario de enlaces: ${itinerarioEnlacesError.message}`);
  }

  // SAFETY: this nested shape matches the explicit Supabase select above; the client lacks generated DB types.
  const validRows = buildConfirmacionRows(
    (confirmaciones ?? []) as unknown as ConfirmacionQueryRow[],
    (itinerarioEnlaces ?? []) as ItinerarioEnlaceRow[],
  );

  if (validRows.length === 0) {
    throw new Error(
      'No hay confirmaciones válidas para el encuentro regional. Verifique que existan dinamizadores activos en infoplazas no cerradas.',
    );
  }

  return { encuentroNombre: encuentro.nombre, rows: validRows };
};

/** Nombre de archivo sugerido para la descarga, con la fecha de generación. */
const buildFilename = (): string => `confirmaciones-${ENCUENTRO_CLAVE}-${new Date().toISOString().split('T')[0]}.xlsx`;

/** Genera el blob del libro de confirmaciones listo para descargar en el navegador. */
export const generarConfirmacionesExcel = async (): Promise<Blob> => {
  const { encuentroNombre, rows } = await loadRows();
  const workbook = createWorkbook(encuentroNombre, rows);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/** Genera y dispara la descarga del libro de confirmaciones en el navegador. */
export const descargarConfirmacionesExcel = async (): Promise<void> => {
  const blob = await generarConfirmacionesExcel();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
