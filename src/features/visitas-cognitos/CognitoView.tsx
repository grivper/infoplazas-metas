import React, { useState, useCallback, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, Database, CheckCircle2, Loader2, XCircle, Info, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Utilidades y Servicios
import { decodeCSVFile } from '@/utils/csvHelper';
import { getInfoplazaLookup } from '@/features/auditoria/services/itinerariosService';
import { insertCognitoBatch, fetchCognitoRegistros, getExistingReferences, type CognitoRegistro } from './services/cognitoService';

// --- Tipos locales ---
interface FilaMensual { nombre: string; meses: Record<number, number>; total: number; }
interface ErrorRegistro {
  infoplaza: string;
  enlace: string;
  mes: number;
  razon: 'Duplicado' | 'No en Catálogo';
  referencia: string;
}

// --- Constantes ---
const CUATRIMESTRES: Record<string, number[]> = {
  C1: [1, 2, 3, 4], C2: [5, 6, 7, 8], C3: [9, 10, 11, 12],
};
const MES_NOMBRE: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

// --- Utilidad: Extrae el mes ---
const extraerMes = (fecha: string): number | null => {
  if (!fecha) return null;
  const partes = fecha.includes('/') ? fecha.split('/') : fecha.split('-');
  const m = parseInt(partes[fecha.includes('/') ? 0 : 1], 10);
  return m >= 1 && m <= 12 ? m : null;
};

// --- Utilidad: Busca columna por patrón ---
const buscarColumna = (row: Record<string, string>, patron: string): string => {
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase().includes(patron) && value?.trim()) return value.trim();
  }
  return '';
};

// --- Componente: Tabla con desglose mensual ---
const TablaMensual: React.FC<{ datos: FilaMensual[]; mesesCuat: number[]; label: string; col: string }> = ({ datos, mesesCuat, label, col }) => (
  <Card className="border shadow-md overflow-hidden">
    <CardHeader className="bg-slate-50/50 border-b">
      <CardTitle className="text-lg flex items-center gap-2">
        {col.includes('Enlace') ? <Database className="w-4 h-4 text-indigo-500" /> : <FileText className="w-4 h-4 text-emerald-500" />}
        {label}
      </CardTitle>
      <CardDescription>{datos.length} entidades con registros</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">{col}</th>
              {mesesCuat.map(m => <th key={m} className="px-2 py-3 text-center font-semibold">{MES_NOMBRE[m].substring(0, 3)}</th>)}
              <th className="px-3 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {datos.map(r => (
              <tr key={r.nombre} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{r.nombre}</td>
                {mesesCuat.map(m => (
                  <td key={m} className={`px-2 py-3 text-center ${r.meses[m] ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                    {r.meses[m] || 0}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-extrabold text-indigo-700 bg-indigo-50/20">{r.total}</td>
              </tr>
            ))}
            {datos.length === 0 && (
              <tr><td colSpan={mesesCuat.length + 2} className="px-4 py-8 text-center text-slate-400 italic">No hay registros para este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

export const CognitoView: React.FC = () => {
  const [data, setData] = useState<CognitoRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, guardados: 0, duplicados: 0, noMatch: 0 });
  
  // Separación de estados para omisiones
  const [omitidosCatalogo, setOmitidosCatalogo] = useState<Record<string, ErrorRegistro[]>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(async () => {
    try {
      const registros = await fetchCognitoRegistros();
      setData(registros as CognitoRegistro[]);
    } catch (dbErr) {
      console.error('Error al sincronizar con Supabase:', dbErr);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setOmitidosCatalogo({});

    try {
      const text = await decodeCSVFile(file);
      const lookup = await getInfoplazaLookup();

      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const mesesEnCSV = Array.from(new Set(results.data.map(r => extraerMes(buscarColumna(r, 'fecha'))).filter(m => m !== null) as number[]));
          const existingRefs = await getExistingReferences(mesesEnCSV);

          const listosParaSubir: CognitoRegistro[] = [];
          const fallosCatalogo: ErrorRegistro[] = [];
          const fallosDuplicados: ErrorRegistro[] = [];

          results.data.forEach(row => {
            const ref = row['#']?.trim() || '';
            const fechaStr = buscarColumna(row, 'fecha');
            const mes = extraerMes(fechaStr);
            const enlace = buscarColumna(row, 'enlace') || 'Sin Enlace';
            const infoplaza = buscarColumna(row, 'infoplaza');

            if (!mes || !infoplaza) return;

            // 1. Detección de Duplicados
            if (existingRefs.has(ref)) {
              fallosDuplicados.push({ infoplaza, enlace, mes, razon: 'Duplicado', referencia: ref });
              return;
            }

            // 2. Match Numérico
            const infoplazaId = lookup.findId(infoplaza);
            if (infoplazaId) {
              listosParaSubir.push({
                cognito_referencia: ref,
                infoplaza_id: infoplazaId,
                fecha: fechaStr,
                mes: mes,
                visitas: 1,
                horas: 0,
                infoplaza_original: infoplaza,
                enlace_original: enlace
              });
            } else {
              fallosCatalogo.push({ infoplaza, enlace, mes, razon: 'No en Catálogo', referencia: ref });
            }
          });

          if (listosParaSubir.length > 0) {
            try {
              await insertCognitoBatch(listosParaSubir);
              await cargarDatos();
            } catch (dbErr) {
              console.error('Error Supabase:', dbErr);
            }
          }

          // Agrupar fallos de catálogo por enlace
          const agrupadosCatalogo = fallosCatalogo.reduce((acc, f) => {
            if (!acc[f.enlace]) acc[f.enlace] = [];
            acc[f.enlace].push(f);
            return acc;
          }, {} as Record<string, ErrorRegistro[]>);

          setOmitidosCatalogo(agrupadosCatalogo);
          
          setStats({
            total: results.data.length,
            guardados: listosParaSubir.length,
            duplicados: fallosDuplicados.length,
            noMatch: fallosCatalogo.length
          });

          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    } catch (err) {
      console.error('Fallo en la lectura del archivo:', err);
      setLoading(false);
    }
  };

  const agruparMensualLocal = (campo: 'enlace_original' | 'infoplaza_original', mesesCuat: number[]): FilaMensual[] => {
    const mapa: Record<string, Record<number, number>> = {};
    data.forEach(v => {
      const val = v[campo];
      if (!mesesCuat.includes(v.mes) || !val) return;
      if (!mapa[val]) mapa[val] = {};
      mapa[val][v.mes] = (mapa[val][v.mes] || 0) + 1;
    });
    return Object.entries(mapa)
      .map(([nombre, meses]) => ({ nombre, meses, total: Object.values(meses).reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.total - a.total);
  };

  return (
    <div className="space-y-6 w-[90%] max-w-none mx-auto pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Database className="w-7 h-7 text-white" />
            </div>
            Consola Cognito
          </h1>
          <p className="text-slate-500 font-medium ml-1">Sincronización avanzada con validación estricta de duplicados.</p>
        </div>
      </div>

      {/* Area de Carga */}
      <Card className="border-2 border-dashed border-slate-200 bg-white/50 hover:bg-white hover:border-indigo-400 transition-all duration-300 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="flex flex-col items-center justify-center py-10 gap-4 relative z-10">
          <div className={`p-4 rounded-full ${loading ? 'bg-indigo-100' : 'bg-slate-100'} transition-colors`}>
            <Upload className={`w-10 h-10 ${loading ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Actualizar Registros Mensuales</h3>
            <p className="text-xs text-slate-400 font-medium">Arrastra el CSV de Cognito o haz clic para buscar</p>
          </div>
          
          <input id="cognito-upload" type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          
          <Button variant="default" size="lg" className="bg-slate-900 hover:bg-indigo-600 text-white shadow-xl px-10 rounded-full font-bold transition-all hover:scale-105 active:scale-95 gap-2" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {loading ? 'Procesando...' : 'Cargar Archivo'}
          </Button>

          {stats.total > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-4 py-1.5 rounded-full ring-1 ring-emerald-200/50">
                <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> {stats.guardados} Exitosos
              </Badge>
              {stats.duplicados > 0 && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-100 px-4 py-1.5 rounded-full ring-1 ring-amber-200/50">
                  <Info className="w-3.5 h-3.5 mr-2" /> {stats.duplicados} Duplicados
                </Badge>
              )}
              {stats.noMatch > 0 && (
                <Badge className="bg-rose-50 text-rose-700 border-rose-100 px-4 py-1.5 rounded-full ring-1 ring-rose-200/50">
                  <XCircle className="w-3.5 h-3.5 mr-2" /> {stats.noMatch} Sin Match
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registros Omitidos (No encontrados en Catálogo) */}
      {Object.keys(omitidosCatalogo).length > 0 && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500 mb-6 font-sans">
          <div className="flex items-center gap-2 mb-6 text-rose-800 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="text-lg">Registros omitidos (No existen en el Catálogo de Infoplazas)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(omitidosCatalogo).flatMap(([enlace, registros]) => 
              registros.map((r, idx) => (
                <div 
                  key={`${enlace}-${idx}`} 
                  className="bg-white border border-rose-100/50 rounded-lg py-2.5 px-4 flex justify-between items-center shadow-sm"
                >
                  <span className="font-bold text-slate-700 text-sm">
                    {r.enlace}
                  </span>
                  <span className="italic text-slate-300 text-sm font-medium">
                    {r.infoplaza}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Visualización de Datos */}
      {data.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Map className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-black text-slate-800">Desglose de Impacto Consolidado</h2>
          </div>
          
          <Tabs defaultValue="C1" className="w-full">
            <TabsList className="bg-slate-100/50 p-1 rounded-full mb-6 w-full md:w-auto inline-flex shadow-inner border border-slate-200/50">
              <TabsTrigger value="C1" className="px-8 py-2 rounded-full text-xs font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">C1 (Ene–Abr)</TabsTrigger>
              <TabsTrigger value="C2" className="px-8 py-2 rounded-full text-xs font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">C2 (May–Ago)</TabsTrigger>
              <TabsTrigger value="C3" className="px-8 py-2 rounded-full text-xs font-black uppercase data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all">C3 (Sep–Dic)</TabsTrigger>
            </TabsList>
            {(Object.entries(CUATRIMESTRES) as [string, number[]][]).map(([key, meses]) => (
              <TabsContent key={key} value={key} className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 px-1">
                  <TablaMensual datos={agruparMensualLocal('enlace_original', meses)} mesesCuat={meses} label="Análisis por Enlace Regional" col="Enlace Regional" />
                  <TablaMensual datos={agruparMensualLocal('infoplaza_original', meses)} mesesCuat={meses} label="Análisis por Infoplaza" col="Infoplaza" />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default CognitoView;
