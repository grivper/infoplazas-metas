import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { decodeCSVFile } from '@/utils/csvHelper';
import { 
  getInfoplazaLookup, 
  insertItinerariosBatch, 
  deleteItinerariosByEnlace,
  type Itinerario 
} from '../services/itinerariosService';

// Función para normalizar nombres de cabeceras (quitar tildes, espacios y a minúsculas)
const normalizeHeader = (header: string) => {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .trim()
    .replace(/\s+/g, '_'); // Espacios por guiones bajos
};

export const RutaUploader: React.FC<{ onProcessComplete: () => void, badgeCount?: number }> = ({ onProcessComplete, badgeCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [failures, setFailures] = useState<{original: string, enlace: string}[]>([]);

  const procesarCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFailures([]);

    try {
      const text = await decodeCSVFile(file);
      
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: "", 
        transformHeader: normalizeHeader,
        complete: async (results) => {
          try {
            const rows = results.data;
            const lookup = await getInfoplazaLookup();
            
            const itinerarios: Itinerario[] = [];
            const missing = new Set<{original: string, enlace: string}>();
            const enlacesEnArchivo = new Set<string>();

            rows.forEach((r) => {
              const enlace = (r['enlace'] || r['enlace_regional'] || r['regional'] || '').trim();
              const infoplazaInput = (r['infoplaza'] || r['nombre_infoplaza'] || r['sitio'] || '').trim();
              const diaRuta = (r['dia_ruta'] || r['ruta_dia'] || r['numero_dia'] || '').trim();
              const diaSemana = (r['dia_semana'] || r['dia'] || '').trim();

              if (enlace && infoplazaInput) {
                enlacesEnArchivo.add(enlace);
                const infoplazaId = lookup.findId(infoplazaInput);
                
                if (infoplazaId) {
                  itinerarios.push({
                    enlace_nombre: enlace,
                    dia_ruta: diaRuta,
                    dia_semana: diaSemana,
                    infoplaza_id: infoplazaId
                  });
                } else {
                  missing.add({ original: infoplazaInput, enlace });
                }
              }
            });

            if (missing.size > 0) {
              setFailures(Array.from(missing));
            }

            if (itinerarios.length === 0) {
              throw new Error('No se encontraron itinerarios válidos que coincidan con el catálogo.');
            }

            // Persistencia en Supabase
            for (const enlace of Array.from(enlacesEnArchivo)) {
              await deleteItinerariosByEnlace(enlace);
            }

            await insertItinerariosBatch(itinerarios);
            onProcessComplete();
          } catch (error) {
            console.error('Error procesando el CSV de Itinerarios:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
          } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }
      });
    } catch (error) {
      console.error('Error al decodificar archivo:', error);
      alert('No se pudo leer el archivo. Asegúrate de que sea un CSV válido.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={procesarCSV} 
        />
        
        <Button 
          size="sm"
          variant="outline" 
          className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all"
          onClick={() => fileInputRef.current?.click()} 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 text-indigo-600 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
          )}
          
          {loading ? 'Procesando...' : 'Cargar Itinerarios de Enlaces'}
          
          {badgeCount !== undefined && badgeCount > 0 && !loading && (
            <Badge variant="secondary" className="ml-3 bg-indigo-100/80 text-indigo-700 hover:bg-indigo-100 border-none font-semibold px-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {badgeCount} en Nube
            </Badge>
          )}
        </Button>

        {failures.length > 0 && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setFailures([])}
          >
            Limpiar {failures.length} advertencias
          </Button>
        )}
      </div>

      {failures.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-amber-800 font-semibold text-sm mb-2 flex items-center">
            ⚠️ Se omitieron {failures.length} registros (No encontrados en Catálogo Maestro)
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
            {failures.map((f, i) => (
              <div key={i} className="text-xs text-amber-700 flex justify-between bg-white/50 p-1 rounded border border-amber-100">
                <span className="font-medium">{f.original}</span>
                <span className="opacity-70 italic">{f.enlace}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-amber-600 mt-2">
            * Sugerencia: Actualiza el Catálogo Maestro o revisa si hay errores de ortografía en el CSV.
          </p>
        </div>
      )}
    </div>
  );
};
