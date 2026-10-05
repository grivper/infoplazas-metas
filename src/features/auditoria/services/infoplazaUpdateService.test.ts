import { beforeEach, describe, expect, it, vi } from 'vitest';

// Simula la cadena supabase.from().update().eq() y deja ver qué se envió.
// vi.hoisted: vi.mock se ejecuta antes que el resto, así que los mocks deben crearse antes.
const { eq, update, from } = vi.hoisted(() => {
  const eq = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { eq, update, from };
});

vi.mock('@/lib/supabase', () => ({ supabase: { from } }));

import { updateInfoplaza } from './infoplazaUpdateService';

const datos = {
  codigo: '668-chupa',
  nombre: ' Chupa ',
  region: 'Herrera',
  distrito: '',
  corregimiento: 'Chupa',
};

describe('updateInfoplaza', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('actualiza la fila por id con los datos limpios', async () => {
    eq.mockResolvedValue({ error: null });

    const result = await updateInfoplaza('abc', datos);

    expect(result).toEqual({ success: true });
    expect(from).toHaveBeenCalledWith('catalogo_infoplazas');
    expect(update).toHaveBeenCalledWith({
      codigo: '668-chupa',
      nombre: 'Chupa',
      region: 'Herrera',
      distrito: null,
      corregimiento: 'Chupa',
    });
    expect(eq).toHaveBeenCalledWith('id', 'abc');
  });

  it('marca el error como duplicado cuando el código ya existe', async () => {
    eq.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const result = await updateInfoplaza('abc', datos);

    expect(result.success).toBe(false);
    expect(result.duplicado).toBe(true);
  });

  it('devuelve el error sin marcar duplicado ante otras fallas', async () => {
    eq.mockResolvedValue({ error: { code: '42501', message: 'denied' } });

    const result = await updateInfoplaza('abc', datos);

    expect(result.success).toBe(false);
    expect(result.duplicado).toBeFalsy();
  });
});
