import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { descargarConfirmacionesExcel } from '../services/confirmacionesExcel';

/** Botón que genera y descarga el Excel de confirmaciones del encuentro regional. */
export function DescargarConfirmacionesButton() {
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  const descargar = async () => {
    setDescargando(true);
    setError('');

    try {
      await descargarConfirmacionesExcel();
    } catch (descargaError) {
      const mensaje = descargaError instanceof Error
        ? descargaError.message
        : 'No se pudo generar el Excel. Intentá nuevamente.';
      setError(mensaje);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        type="button"
        variant="outline"
        onClick={descargar}
        disabled={descargando}
      >
        {descargando ? <Loader2 className="animate-spin" /> : <Download />}
        {descargando ? 'Generando...' : 'Descargar Excel'}
      </Button>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
