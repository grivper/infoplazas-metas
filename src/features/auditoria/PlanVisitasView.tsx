import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { deleteItinerariosByEnlace } from './services/itinerarioService';
import {
  MESES,
  MES_ACTUAL,
  calcularItinerarios,
  type ItinerarioEnlace,
} from './services/cruceVisitas';
import { ItinerarioCard } from './components/ItinerarioCard';

// ==========================================
// VISTA PRINCIPAL TOTALMENTE FUSIONADA
// ==========================================
const PlanVisitasView: React.FC = () => {
  const [itinerarios, setItinerarios] = useState<ItinerarioEnlace[]>([]);
  const [mesEval, setMesEval] = useState(MES_ACTUAL);

  // Carga rutas y calcula itinerario con cruce de cognito simultáneo
  const loadRutasYGaps = useCallback(async (mes: number) => {
    setItinerarios(await calcularItinerarios(mes));
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadRutasYGaps(mesEval);
    };
    init();
  }, [mesEval, loadRutasYGaps]);

  const handleDeleteRutasDeEnlace = async (enlace: string) => {
    if(!confirm(`¿Eliminar de la Nube el Itinerario completo de ${enlace}?`)) return;
    await deleteItinerariosByEnlace(enlace);
    loadRutasYGaps(mesEval);
  };

  // KPIs Cabecera Global
  const totalEnlaces = itinerarios.length;
  const promedio = itinerarios.length > 0 ? Math.round(itinerarios.reduce((s, it) => s + it.pct, 0) / itinerarios.length) : 0;
  const totalPlanificadas = itinerarios.reduce((acc, it) => acc + it.totalInfoplazas, 0);
  const totalVisitadasGlobal = itinerarios.reduce((acc, it) => acc + it.visitadasUnicas, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cabecera Principal */}
      <div className="flex flex-row justify-between items-start w-full gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline text-on-surface tracking-tight">Evaluación de Itinerarios</h1>
          <p className="text-on-surface-variant mt-1">Cruce semaforizado en tiempo real contra registros de Cognito</p>
        </div>
      </div>

      {/* Panel Superior KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {[
          {
            title: 'Enlaces Monitoreados',
            value: totalEnlaces,
            color: 'bg-indigo-500',
            icon: <Users className="w-4 h-4 text-indigo-500 mr-2" />,
            subtitle: `Gestionando ${totalPlanificadas} Infoplazas`
          },
          {
            title: 'Cumplimiento Global',
            value: `${promedio}%`,
            color: 'bg-violet-500',
            icon: <Target className="w-4 h-4 text-violet-500 mr-2" />,
            subtitle: `${totalVisitadasGlobal} de ${totalPlanificadas} Rutas Completadas`
          },
        ].map(k => (
          <Card key={k.title} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-surface-container-lowest">
            <div className={`h-1 ${k.color}`} />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-on-surface-variant font-semibold flex items-center">{k.icon}{k.title}</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{k.value}</p>
              <p className="text-xs text-outline mt-1">{k.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cuerpo Analítico : Itinerarios Semaforizados (Nivel 1, 2 y 3 fusionados) */}
      {itinerarios.length > 0 && (
        <div className="mt-8 border-t border-border/60 pt-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Mapeo de Rutas del Mes — {MESES[mesEval]}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Las Infoplazas cambiarán a verde (visitadas) si el sistema constata un match exitoso contra el repositorio Cognito en dicho mes.
              </p>
            </div>

            {/* Selector de Mes (Movido aquí por Ley de Proximidad UI/UX) */}
            <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl border border-border shadow-sm shrink-0">
              <Search className="w-4 h-4 text-outline" />
              <span className="text-sm font-medium text-on-surface">Mes a Evaluar:</span>
              <select className="border-none text-sm font-semibold text-primary focus:ring-0 cursor-pointer bg-transparent"
                value={mesEval} onChange={e => setMesEval(+e.target.value)}>
                {Object.entries(MESES).map(([num, nombre]) => <option key={num} value={num}>{nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
            {itinerarios.map(it => (
              <ItinerarioCard key={it.enlace} it={it} onEliminar={handleDeleteRutasDeEnlace} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanVisitasView;
