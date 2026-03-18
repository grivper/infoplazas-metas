import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginView: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados de carga y error (Seguridad y UX)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Intentamos autenticar al usuario con Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Regla de seguridad: Anti-Enumeración (Mensaje genérico siempre)
      // Regla de seguridad: Cero Fugas de Memoria (No usamos console.log)
      setErrorMsg('Credenciales incorrectas o acceso denegado');
      setIsLoading(false);
    }
    // Si la autenticación es exitosa, el listener en App.tsx lo detectará
    // y cambiará el estado de la aplicación instantáneamente.
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full font-sans bg-white">
      {/* Columna Izquierda - Branding */}
      <div className="lg:w-1/2 w-full bg-blue-900 flex flex-col items-center justify-center p-12 text-center order-2 lg:order-1">
        <div className="max-w-md w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 pt-12 lg:pt-0">
          {/* Logo Placeholder */}
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl mb-8">
            <span className="text-blue-900 font-black text-2xl tracking-tighter leading-none">
              IP<br/><span className="text-sm">AIP</span>
            </span>
          </div>
          <h1 className="text-4xl text-white font-bold mb-4 tracking-tight">Transformando<br/>Panamá</h1>
          <p className="text-blue-200 text-lg font-light max-w-sm">
            Sistema Gerencial Integral para el Monitoreo y Evaluación de Metas Institucionales.
          </p>
        </div>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="lg:w-1/2 w-full flex items-center justify-center p-8 lg:p-24 order-1 lg:order-2 bg-white">
        <div className="max-w-md w-full animate-in slide-in-from-right-8 duration-500">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Iniciar sesión</h2>
            <p className="text-slate-500 mt-2">Ingresa tus credenciales para acceder al portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje de error genérico (Anti-Enumeración) */}
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 animate-in fade-in">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 disabled:opacity-50"
                  placeholder="usuario@infoplazas.org.pa"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-700 disabled:opacity-50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  disabled={isLoading} 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                />
                <span className="text-slate-600 font-medium">Recordarme</span>
              </label>
              <a href="#" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de Submit bloqueado visualmente durante la petición */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
