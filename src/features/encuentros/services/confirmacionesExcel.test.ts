import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));
vi.mock('./encuentrosService', () => ({ ENCUENTRO_CLAVE: 'test', getEncuentroByClave: vi.fn() }));

import {
  buildConfirmacionRows,
  createEnlacesByInfoplazaId,
  formatResponse,
  type ConfirmacionQueryRow,
  type ItinerarioEnlaceRow,
} from './confirmacionesExcel';

const infoplaza = (overrides = {}) => ({
  id: 'ip-1', nombre: 'Infoplaza Uno', region: 'Panamá',
  distrito: 'D1', corregimiento: 'C1', cerrada: false, ...overrides,
});
const dinamizador = (overrides = {}) => ({
  nombre: 'Juan Pérez', cedula: '8-123-456', estatus: 'Activo',
  catalogo_infoplazas: infoplaza(), ...overrides,
});
const confirmacion = (overrides: Partial<ConfirmacionQueryRow> = {}): ConfirmacionQueryRow => ({
  asiste: null, se_hospeda: null, cena: null, confirmado_at: null,
  dinamizadores: dinamizador(), ...overrides,
});

describe('formatResponse', () => {
  it('null/undefined -> Pendiente; true/false -> Sí/No', () => {
    expect(formatResponse(null)).toBe('Pendiente');
    expect(formatResponse(undefined)).toBe('Pendiente');
    expect(formatResponse(true)).toBe('Sí');
    expect(formatResponse(false)).toBe('No');
  });
});

describe('createEnlacesByInfoplazaId', () => {
  it('deduplica, une con coma y ordena; vacío sin itinerario', () => {
    const itinerario: ItinerarioEnlaceRow[] = [
      { infoplaza_id: 'ip-1', enlace_nombre: 'Zoe' },
      { infoplaza_id: 'ip-1', enlace_nombre: 'Ana' },
      { infoplaza_id: 'ip-1', enlace_nombre: 'Zoe' },
    ];
    expect(createEnlacesByInfoplazaId(itinerario).get('ip-1')).toBe('Ana, Zoe');
    expect(createEnlacesByInfoplazaId([]).size).toBe(0);
  });
});

describe('buildConfirmacionRows', () => {
  it('excluye infoplaza cerrada y dinamizador/infoplaza faltante', () => {
    const rows = buildConfirmacionRows([
      confirmacion({ dinamizadores: dinamizador({ catalogo_infoplazas: infoplaza({ cerrada: true }) }) }),
      confirmacion({ dinamizadores: null }),
      confirmacion({ dinamizadores: dinamizador({ catalogo_infoplazas: null }) }),
    ], []);
    expect(rows).toHaveLength(0);
  });

  it('deriva Confirmados/Pendientes como inversos de confirmado_at; asigna el enlace o vacío', () => {
    const [confirmed] = buildConfirmacionRows([confirmacion({ confirmado_at: '2025-01-01' })], []);
    expect([confirmed.confirmados, confirmed.pendientes]).toEqual(['Sí', 'No']);

    const [pending] = buildConfirmacionRows([confirmacion({ confirmado_at: null })], []);
    expect([pending.confirmados, pending.pendientes]).toEqual(['No', 'Sí']);

    const [withEnlace] = buildConfirmacionRows([confirmacion()], [{ infoplaza_id: 'ip-1', enlace_nombre: 'Ana' }]);
    expect(withEnlace.enlace).toBe('Ana');
    expect(buildConfirmacionRows([confirmacion()], [])[0].enlace).toBe('');
  });

  it('ordena por provincia, infoplaza, dinamizador y cedula', () => {
    const row = (region: string, id: string, nombreIp: string, nombreDin: string, cedula: string) => confirmacion({
      dinamizadores: dinamizador({ nombre: nombreDin, cedula, catalogo_infoplazas: infoplaza({ id, nombre: nombreIp, region }) }),
    });
    const rows = buildConfirmacionRows([
      row('Panamá', 'ip-2', 'Infoplaza B', 'Zoe', '9-000-000'),
      row('Chiriquí', 'ip-1', 'Infoplaza A', 'Ana', '1-000-000'),
    ], []);
    expect(rows.map((r) => r.provincia)).toEqual(['Chiriquí', 'Panamá']);
  });
});
