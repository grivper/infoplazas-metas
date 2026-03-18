import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Users, ClipboardCheck, Network, LayoutDashboard, MapPin, Activity, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Layout: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState<string>('');

  // Obtener nombre del usuario desde la tabla profiles
  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.display_name) {
          setUserName(profile.display_name);
        } else if (user.email) {
          // Fallback al email si no hay nombre
          setUserName(user.email);
        }
      }
    };
    getUserProfile();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Servicio Social', href: '/servicio-social', icon: Users },
    { name: 'Visitas e Incidencias', href: '/visitas-incidencias', icon: ClipboardCheck },
    { name: 'Mesas de Transformación', href: '/mesas', icon: Network },
    { name: 'Cumplimiento de Rutas', href: '/auditoria', icon: MapPin },
    { name: 'Radar de Conectividad', href: '/radar', icon: Activity },
  ];

  // Función para determinar si está activo
  const isActive = (href: string) => {
    if (href === '/') {
      // Dashboard: solo activo si es exactamente '/' (no '/algo')
      return location.pathname === '/';
    }
    // Otras rutas: usar startsWith
    return location.pathname.startsWith(href);
  };

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <LayoutDashboard className="w-6 h-6 text-indigo-400 mr-2" />
          <span className="text-lg font-bold text-white tracking-wide">AML Pro Metas</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  active
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between group">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {userName ? getInitials(userName) : 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate max-w-[150px]">
                  {userName || 'Cargando...'}
                </p>
              </div>
            </div>
            
            {/* Botón de Logout Seguro */}
            <button 
              title="Cerrar sesión"
              onClick={async () => {
                await supabase.auth.signOut();
              }} 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center text-slate-800 font-semibold text-lg">
            Sistema de Gestión de Metas - Regional Los Santos
          </div>
          

        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
