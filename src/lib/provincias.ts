const SIN_PROVINCIA = 'Sin provincia';

/**
 * Agrupa elementos por provincia (región). `obtenerProvincia` indica de dónde
 * sale la provincia de cada elemento. Las provincias salen en orden alfabético
 * y "Sin provincia" siempre al final.
 */
export const agruparPorProvincia = <T,>(
  elementos: T[],
  obtenerProvincia: (elemento: T) => string | null | undefined,
): Array<{ provincia: string; elementos: T[] }> => {
  const grupos = new Map<string, T[]>();

  for (const elemento of elementos) {
    const provincia = obtenerProvincia(elemento)?.trim() || SIN_PROVINCIA;
    grupos.set(provincia, [...(grupos.get(provincia) ?? []), elemento]);
  }

  return [...grupos.entries()]
    .map(([provincia, items]) => ({ provincia, elementos: items }))
    .sort((a, b) => {
      if (a.provincia === SIN_PROVINCIA) return 1;
      if (b.provincia === SIN_PROVINCIA) return -1;
      return a.provincia.localeCompare(b.provincia, 'es');
    });
};
