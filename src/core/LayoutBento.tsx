import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Network, 
  MapPin, 
  Radar,
  LogOut,
  Menu
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LogoReme from '../assets/logo-reme.png';

/**
 * Layout principal estilo "Polished Luminary"
 * - Sidebar oscura fija
 * - Main stage con contenido luminoso
 * - Tipografía editorial (Plus Jakarta Sans para headlines)
 */
const LayoutBento: React.FC = () => {
  const location = useLocation();
  const [userName, setUserName] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          setUserName(user.email);
        }
      }
    };
    getUserProfile();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Servicio Social', href: '/servicio-social', icon: Users },
    { name: 'Cumplimiento 30%', href: '/visitas-incidencias', icon: ClipboardCheck },
    { name: 'Mesas de Transformación', href: '/mesas', icon: Network },
    { name: 'Cumplimiento de Rutas', href: '/auditoria', icon: MapPin },
    { name: 'Radar Kpax', href: '/radar', icon: Radar },
  ];

  // Función para determinar si está activo
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar oscura - estilo "void" */}
      <aside className="bg-slate-900 h-screen w-64 fixed left-0 top-0 overflow-y-auto z-50 flex flex-col py-6 shadow-2xl transition-transform duration-300 lg:translate-x-0 -translate-x-full">
        {/* Logo */}
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <img src={LogoReme} alt="Metas Enlace" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight font-headline">Metas Enlace</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Institutional Portal</p>
            </div>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors duration-200 group ${
                  active
                    ? 'bg-blue-600/10 text-white border-r-4 border-blue-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon 
                  className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`}
                  style={{ fill: active ? 'currentColor' : 'none' }}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User section */}
        <div className="mt-auto px-4 py-4 border-t border-slate-800/50">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-white font-bold">
                {userName ? getInitials(userName) : 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[120px]">
                  {userName || 'Cargando...'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Regional Director</p>
              </div>
            </div>
            
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

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Stage - Contenido luminoso */}
      <main className="flex-1 lg:ml-64 min-h-screen relative">
        {/* Top App Bar con glassmorphism */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/50">
          <div className="flex justify-between items-center px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-headline">
                  Sistema de Gestión de Metas - Regional Los Santos
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Panel de Control Gerencial
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LayoutBento;
