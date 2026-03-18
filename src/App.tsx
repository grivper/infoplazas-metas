import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useIdleTimeout } from './hooks/useIdleTimeout';

// Vistas de Autenticación y Dashboard
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';

// Layout Principal Elegante
import Layout from './core/Layout';

// Módulos (Features) - Screaming Architecture
import ServicioSocialView from './features/servicio-social/ServicioSocialView';
import VisitasIncidencias from './features/visitas-cognitos';
import MesasTransformacion from './features/mesas';
import AuditoriaTecnica from './features/auditoria';
import { MonitoreoConectividadView } from './features/radar-conectividad';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verificamos sesión inicial y escuchamos cambios
  useEffect(() => {
    // Revisar la sesión activa al inicio
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Escuchar cambios de estado (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hook de inactividad: Cierra sesión automáticamente tras 30 min inactivo
  // Protege todas las rutas privadas a nivel global.
  useIdleTimeout(() => {
    if (isAuthenticated) {
      // El estado de sesión cambiará automáticamente a través de onAuthStateChange
    }
  });

  if (isLoading) {
    // Loading state muy simple para evitar parpadeos
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="text-slate-400 font-medium">Verificando sesión segura...</div>
        </div>
      </div>
    );
  }

  // Capa de Seguridad: Si no está autenticado, mostramos SOLO la pantalla de Login.
  // Esto previene que se renderice cualquier parte del ruteo interno o el layout
  // incluso si la URL es manipulada manualmente en el navegador.
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Capa Privada: Renderizado de la aplicación con navegación protegida
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardView />} />
          <Route path="servicio-social" element={<ServicioSocialView />} />
          <Route path="visitas-incidencias" element={<VisitasIncidencias />} />
          <Route path="mesas" element={<MesasTransformacion />} />
          <Route path="auditoria" element={<AuditoriaTecnica />} />
          <Route path="radar" element={<MonitoreoConectividadView />} />
          
          {/* Redirección automática a Dashboard para cualquier ruta no reconocida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
