import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, Calendar, MapPin, CheckCircle2, XCircle, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchAllItinerarios,
  deleteItinerariosByEnlace
} from './services/itinerariosService';
import { getAllVisitasCognito } from './services/rutasDb';

// --- Constantes ---
const MESES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};
const MES_ACTUAL = new Date().getMonth() + 1;

// Normalizador anti-encoding para cruces exactos
const normalize = (str: string) => {
  if (!str) return "";
  return str
    .replace(/\uFFFD/g, 'e')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Extractor de IDs numéricos para cruces inquebrantables
const extractId = (str: string) => {
  if (!str) return null;
  const m = str.trim().match(/^(\d+)/);
  return m ? m[1] : null;
};

export interface InfoplazaStatus {
  nombre: string;
  uuid: string | null;
  visitada: boolean;
}

export interface DiaItinerario {
  diaRuta: string;
  diaSemana: string;
  infoplazas: InfoplazaStatus[];
}

export interface ItinerarioEnlace {
  enlace: string;
  dias: DiaItinerario[];
  totalInfoplazas: number;
  visitadasUnicas: number;
  pct: number;
}

interface CognitoVisita {
  mes?: number;
  fecha?: string;
  Fecha?: string;
  'Enlace Regional'?: string;
  enlace_original?: string;
  enlace?: string;
  '# de Infoplaza'?: string;
  infoplaza?: string;
  infoplaza_id?: string; // UUID de Supabase
}

// ==========================================
// VISTA PRINCIPAL TOTALMENTE FUSIONADA
// ==========================================
const PlanVisitasView: React.FC = () => {
  const [itinerarios, setItinerarios] = useState<ItinerarioEnlace[]>([]);
  const [mesEval, setMesEval] = useState(MES_ACTUAL);

  // Carga rutas y calcula itinerario con cruce de cognito simultáneo
  const loadRutasYGaps = useCallback(async (mes: number) => {
    // 1. Obtiene Rutas base y agrupa por Enlace + Día
    const rutasListPlana = await fetchAllItinerarios();
    const mapItinerarios = rutasListPlana.reduce((acc, r) => {
      if (!acc[r.enlace]) acc[r.enlace] = {};
      const keyDia = r.dia_ruta || 'Día No Asignado';
      if (!acc[r.enlace][keyDia]) {
        acc[r.enlace][keyDia] = {
          diaRuta: keyDia,
          diaSemana: r.dia_semana || '',
          infoplazas: [] as InfoplazaStatus[]
        };
      }
      // Guardamos nombre y UUID para poder comparar correctamente
      acc[r.enlace][keyDia].infoplazas.push({
        nombre: r.infoplaza,
        uuid: r.infoplaza_id,
        visitada: false // Se calculará después
      });
      return acc;
    }, {} as Record<string, Record<string, { diaRuta: string; diaSemana: string; infoplazas: InfoplazaStatus[] }>>);

    // 2. Extrae visitas de Cognito respetando el filtro mensual
    const visitas = await getAllVisitasCognito() as CognitoVisita[];
    
    const visitasMes = visitas.filter((v) => {
      let vMes = v.mes;
      const rawFecha = v.fecha || v['Fecha'] || '';
      if (!vMes && rawFecha && rawFecha.includes('/')) {
         const partes = rawFecha.split('/');
         if (partes.length >= 2) vMes = parseInt(partes[1], 10);
      }
      return vMes === mes;
    });

    // 3. Forma el arreglo renderizable y ejecuta Cruce Match Anti-Encoding e Inquebrantable Numérico
    const itinerariosArray: ItinerarioEnlace[] = Object.entries(mapItinerarios).map(([enlace, diasObj]) => {
      const normEnlaceRuta = normalize(enlace);
      
      const visitasDelEnlace = visitasMes.filter((v) => {
        const rawEnlace = v.enlace_original || v['Enlace Regional'] || v.enlace || '';
        const normVisitante = normalize(rawEnlace);
        return normVisitante.includes(normEnlaceRuta) || normEnlaceRuta.includes(normVisitante);
      });

      const ipsVisitadasSet = new Set<string>(); // Set para evitar sobrecontar infoplazas visitadas varias veces
      
      // Construir sub-arbol y setear el booleano 'visitada' para el UI Semáforo
      const diasArray = Object.values(diasObj).map(d => {
        const stadoIps: InfoplazaStatus[] = d.infoplazas
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map(ip => {
            // Buscar si esta infoplaza fue visitada en este mes
            const matchVisita = visitasDelEnlace.some((v) => {
              // 1. Comparar por UUID directo (Supabase)
              if (ip.uuid && v.infoplaza_id && ip.uuid === v.infoplaza_id) return true;
              
              // 2. Extraer ID numérico del nombre (ej: "599 - Barrios" -> "599")
              const idRuta = extractId(ip.nombre);
              const ipRaw = v['# de Infoplaza'] || v.infoplaza || '';
              const idVisita = extractId(ipRaw);
              
              if (idRuta && idVisita && idRuta === idVisita) return true;
              
              // 3. Fallback por nombre normalizado
              const nombreRutaNorm = normalize(ip.nombre);
              const nombreVisitaNorm = normalize(ipRaw);
              if (nombreRutaNorm && nombreVisitaNorm) {
                return nombreRutaNorm.includes(nombreVisitaNorm) || nombreVisitaNorm.includes(nombreRutaNorm);
              }
              
              return false;
            });
            
            if (matchVisita) ipsVisitadasSet.add(ip.uuid || ip.nombre);
            return { ...ip, visitada: matchVisita };
          });

        return {
          diaRuta: d.diaRuta,
          diaSemana: d.diaSemana,
          infoplazas: stadoIps
        };
      });

      // Orden natural alfanumérico para los días
      diasArray.sort((a, b) => a.diaRuta.localeCompare(b.diaRuta, undefined, { numeric: true, sensitivity: 'base' }));

      // Matemáticas Finales del Nodo
      const totalIps = diasArray.reduce((acc, d) => acc + d.infoplazas.length, 0);
      const funcActUnique = ipsVisitadasSet.size;
      const p = totalIps > 0 ? Math.round((funcActUnique / totalIps) * 100) : 0;

      return { enlace, dias: diasArray, totalInfoplazas: totalIps, visitadasUnicas: funcActUnique, pct: p };
    });
    
    setItinerarios(itinerariosArray.sort((a, b) => a.enlace.localeCompare(b.enlace)));
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Evaluación de Itinerarios</h1>
          <p className="text-slate-500 mt-1">Cruce semaforizado en tiempo real contra registros de Cognito</p>
        </div>
      </div>

      {/* Panel Superior KPIs */}
      <div className="grid grid-cols-2 gap-4 mt-2">
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
          <Card key={k.title} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <div className={`h-1 ${k.color}`} />
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-600 font-semibold flex items-center">{k.icon}{k.title}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cuerpo Analítico : Itinerarios Semaforizados (Nivel 1, 2 y 3 fusionados) */}
      {itinerarios.length > 0 && (
        <div className="mt-8 border-t border-slate-200/60 pt-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mapeo de Rutas del Mes — {MESES[mesEval]}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Las Infoplazas cambiarán a verde (visitadas) si el sistema constata un match exitoso contra el repositorio Cognito en dicho mes.
              </p>
            </div>
            
            {/* Selector de Mes (Movido aquí por Ley de Proximidad UI/UX) */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Mes a Evaluar:</span>
              <select className="border-none text-sm font-semibold text-indigo-600 focus:ring-0 cursor-pointer bg-transparent"
                value={mesEval} onChange={e => setMesEval(+e.target.value)}>
                {Object.entries(MESES).map(([num, nombre]) => <option key={num} value={num}>{nombre}</option>)}
              </select>
            </div>
          </div>
          
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
            {itinerarios.map(it => (
              <Card key={it.enlace} className="border border-slate-200/80 shadow-sm break-inside-avoid bg-white hover:border-indigo-200 transition-colors">
                
                {/* NIVEL 1: TARJETA DEL ENLACE + PROGRESS BAR */}
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-5">
                  <div className="flex flex-row items-start justify-between mb-3">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-500" /> 
                        {it.enlace}
                      </CardTitle>
                      <CardDescription className="mt-1 font-medium text-slate-500">
                        {it.visitadasUnicas} / {it.totalInfoplazas} IPs visitadas este mes
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRutasDeEnlace(it.enlace)} className="hover:bg-rose-50 rounded-full h-8 w-8 transition-colors -mt-1 -mr-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </Button>
                  </div>
                  
                  {/* Progress Bar Dinámica en HTML Puro / Tailwind */}
                  <div className="relative w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ${it.pct >= 95 ? 'bg-emerald-500' : it.pct > 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                      style={{ width: `${Math.min(it.pct, 100)}%` }}
                    />
                    <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-slate-400/50 z-10" title="Meta: 95%"></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className={it.pct >= 95 ? 'text-emerald-600' : 'text-slate-400'}>{it.pct}% Completado</span>
                    {it.pct >= 95 && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Meta Alcanzada</span>}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {it.dias.map((d, index) => (
                      <div key={`${d.diaRuta}-${index}`} className="p-5 hover:bg-slate-50/40 transition-colors">
                        
                        {/* NIVEL 2: FILA DIARIA */}
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <h3 className="text-sm font-bold text-slate-700">
                            {d.diaSemana ? `${d.diaSemana} — ${d.diaRuta}` : d.diaRuta}
                          </h3>
                        </div>
                        
                        {/* NIVEL 3: INFOPLAZAS SEMAFORIZADAS */}
                        <div className="flex flex-wrap gap-2 pl-6">
                          {d.infoplazas.map(ip => (
                            <Badge 
                              key={ip.nombre} 
                              variant="secondary" 
                              className={`
                                py-1 px-3 shadow-sm border font-medium flex items-center gap-1.5 transition-colors
                                ${ip.visitada 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}
                              `}
                            >
                              {ip.visitada ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {ip.nombre}
                            </Badge>
                          ))}
                        </div>

                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanVisitasView;
