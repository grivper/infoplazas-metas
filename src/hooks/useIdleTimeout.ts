import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// 30 minutos por defecto (en milisegundos)
const DEFAULT_TIMEOUT = 30 * 60 * 1000;

/**
 * Hook de seguridad que monitorea la inactividad del usuario.
 * Cierra automáticamente la sesión de Supabase si se excede el tiempo límite
 * y ejecuta una función de callback (ej. redirección al login).
 */
export const useIdleTimeout = (onTimeout: () => void, timeoutMs: number = DEFAULT_TIMEOUT) => {
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIdle = async () => {
    // Cerramos la sesión en Supabase y ejecutamos el callback (redirección)
    await supabase.auth.signOut();
    onTimeout();
  };

  const resetTimeout = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(handleIdle, timeoutMs);
  };

  useEffect(() => {
    // Eventos generales que indican actividad del usuario
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart'
    ];

    // Registramos los listeners para reiniciar el contador
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    // Inicializamos el temporizador al montar
    resetTimeout();

    // Limpieza de eventos al desmontar
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [timeoutMs, onTimeout]);
};
