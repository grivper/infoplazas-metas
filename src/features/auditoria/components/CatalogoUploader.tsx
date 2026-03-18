import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { decodeCSVFile } from '@/utils/csvHelper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  upsertInfoplazasBatch, 
  generateInfoplazaCode, 
  type Infoplaza 
} from '../services/infoplazasService';

export const CatalogoUploader: React.FC<{ onProcessComplete: () => void, badgeCount?: number }> = ({ onProcessComplete, badgeCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // Procesa el CSV buscando columnas de Nombre, ID y Región.
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      const text = await decodeCSVFile(file);
      
      Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data;
            const keys = results.meta.fields || [];

            // Identificación dinámica de columnas
            const nameCol = keys.find(k => k.toLowerCase().includes('nombre') || k.toLowerCase().includes('infoplaza')) || keys[0];
            const codeCol = keys.find(k => k.toLowerCase() === 'id' || k.toLowerCase() === 'codigo');
            const regionCol = keys.find(k => k.toLowerCase().includes('region') || k.toLowerCase().includes('provincia') || k.toLowerCase().includes('zona'));

            const entities: Infoplaza[] = rows.map(r => {
              const rawNombre = (r[nameCol] || 'Sin Nombre').trim();
              const rawCodigo = codeCol && r[codeCol] ? r[codeCol].trim() : generateInfoplazaCode(rawNombre);
              const rawRegion = regionCol && r[regionCol] ? r[regionCol].trim() : 'Sin Asignar';

              return {
                codigo: rawCodigo,
                nombre: rawNombre,
                region: rawRegion
              };
            }).filter(e => e.nombre !== 'Sin Nombre');

            if (entities.length === 0) {
              throw new Error('No se encontraron registros válidos en el archivo.');
            }

            // Upsert masivo en Supabase
            await upsertInfoplazasBatch(entities);
            
            onProcessComplete();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error procesando catálogo:', error);
            alert(`Error en la carga: ${message}`);
          } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }
      });
    } catch (error: unknown) {
      console.error('Error al decodificar archivo:', error);
      alert('No se pudo leer el archivo. Asegúrate de que sea un CSV válido.');
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFile} 
      />
      
      <Button 
        size="sm"
        variant="outline" 
        className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all"
        onClick={() => fileInputRef.current?.click()} 
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 text-emerald-600 animate-spin" />
        ) : (
          <Database className="w-4 h-4 mr-2 text-emerald-600" />
        )}
        
        {loading ? 'Sincronizando...' : 'Cargar Catálogo de Infoplazas'}
        
        {badgeCount !== undefined && badgeCount > 0 && !loading && (
          <Badge variant="secondary" className="ml-3 bg-emerald-100/80 text-emerald-700 hover:bg-emerald-100 border-none font-semibold px-2">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {badgeCount} en Nube
          </Badge>
        )}
      </Button>
    </div>
  );
};

