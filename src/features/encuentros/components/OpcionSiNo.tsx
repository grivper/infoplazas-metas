import { Label } from '@/components/ui/label';

interface OpcionSiNoProps { nombre: string; pregunta: string; valor: boolean | null; onChange: (valor: boolean) => void; }

/** Pregunta Sí/No accesible mediante fieldset + inputs radio. */
export function OpcionSiNo({ nombre, pregunta, valor, onChange }: OpcionSiNoProps) {
  const opciones: Array<{ sufijo: string; etiqueta: string; marcado: boolean; valor: boolean }> = [
    { sufijo: 'si', etiqueta: 'Sí', marcado: valor === true, valor: true },
    { sufijo: 'no', etiqueta: 'No', marcado: valor === false, valor: false },
  ];

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <legend className="text-lg font-bold text-slate-900">{pregunta}</legend>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {opciones.map(({ sufijo, etiqueta, marcado, valor: opcionValor }) => {
          const id = `${nombre}-${sufijo}`;
          return (
            <div key={sufijo}>
              <input
                id={id}
                type="radio"
                name={nombre}
                checked={marcado}
                onChange={() => onChange(opcionValor)}
                className="peer sr-only"
              />
              <Label
                htmlFor={id}
                className={`flex min-h-24 cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 text-base font-semibold shadow-sm transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-2 ${marcado ? 'border-emerald-700 bg-emerald-50 text-slate-900 ring-1 ring-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${marcado ? 'border-emerald-200 bg-emerald-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
                  >
                    {marcado ? '✓' : '○'}
                  </span>
                  <span>{etiqueta}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${marcado ? 'border-emerald-700' : 'border-slate-300'}`}
                >
                  <span className={marcado ? 'size-2 rounded-full bg-emerald-700' : ''} />
                </span>
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
