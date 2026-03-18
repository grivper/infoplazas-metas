import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RadarUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  deviceCount: number;
}

/**
 * Botón de upload para archivos CSV del Radar KPAX
 */
export const RadarUpload: React.FC<RadarUploadProps> = ({ 
  onUpload, 
  loading, 
  deviceCount 
}) => {
  return (
    <div className="flex items-center gap-3">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        onChange={onUpload}
        id="radar-kpax-upload"
      />
      <label htmlFor="radar-kpax-upload">
        <Button 
          size="sm"
          variant="outline" 
          className="h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium shadow-sm transition-all cursor-pointer"
          asChild
          disabled={loading}
        >
          <span>
            <UploadCloud className="w-4 h-4 mr-2 text-amber-600" />
            {loading ? 'Procesando...' : 'Subir CSV KPAX 68'}
            {deviceCount > 0 && !loading && (
              <Badge 
                variant="secondary" 
                className="ml-3 bg-amber-100/80 text-amber-700 hover:bg-amber-100 border-none font-semibold px-2"
              >
                {deviceCount}
              </Badge>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
};
