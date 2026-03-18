import { Loader2 } from 'lucide-react';

interface RemeLoaderProps {
  size?: number;
}

export function RemeLoader({ size }: RemeLoaderProps) {
  // Tamaño por defecto: 24px para inline, usar prop para pantallas completas
  const defaultSize = size ? size : 24;
  return (
    <Loader2 
      className="animate-spin text-indigo-600" 
      style={{ width: defaultSize, height: defaultSize }} 
    />
  );
}
