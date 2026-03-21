import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { navigation, isRouteActive } from './navigation';
import { useUserProfile } from './hooks/useUserProfile';
import LogoReme from '../assets/logo-reme.png';

/**
 * Layout principal con sidebar oscura fija y contenido luminoso
 */
const LayoutBento: React.FC = () => {
  const location = useLocation();
  const { userName, userRole } = useUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar oscura */}
      <aside className="bg-slate-900 h-screen w-64 fixed left-0 top-0 overflow-y-auto z-50 flex flex-col py-6 shadow-2xl transition-transform duration-300 lg:translate-x-0 -translate-x-full">
        {/* Logo */}
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <img src={LogoReme} alt="Metas Enlace" className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight font-headline">Metas Enlace</h1>
            </div>
          </div>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const active = isRouteActive(location.pathname, item.href);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 ml-[15px]">
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white truncate max-w-[150px] leading-tight">
                  {userName || 'Cargando...'}
                </p>
                {userRole && (
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide w-fit mt-0.5 ${
                    userRole === 'admin' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {userRole === 'admin' ? 'Administrador' : 'Usuario'}
                  </span>
                )}
              </div>
            </div>
            
            <button 
              title="Cerrar sesión"
              onClick={async () => {
                await supabase.auth.signOut();
              }} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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

      {/* Main Stage */}
      <main className="flex-1 lg:ml-64 min-h-screen relative">
        {/* Top App Bar */}
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
