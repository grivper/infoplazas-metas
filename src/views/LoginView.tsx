import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LogoReme from '../assets/logo-reme.png';

// Clases compartidas por los dos inputs para mantenerlos idénticos
const inputClasses =
  'w-full py-3 bg-surface-container-low border border-border rounded-xl text-on-surface font-medium placeholder:text-outline outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50';

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
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 font-sans bg-gradient-to-br from-slate-900 via-slate-900 to-primary">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        {/* Branding sobre el fondo oscuro: el logo es blanco, no puede ir sobre la tarjeta */}
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={LogoReme}
            alt="Logo Reme"
            className="w-32 h-auto mb-4 drop-shadow-xl"
          />
          <h1 className="text-3xl font-black font-headline text-white tracking-tight">
            Metas enlaces
          </h1>
          <p className="text-slate-300 mt-1">Regional de los Santos</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-on-surface-variant mt-1">
              Ingresa tus credenciales para acceder al portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensaje de error genérico (Anti-Enumeración) */}
            {errorMsg && (
              <div
                role="alert"
                className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm font-medium border border-destructive/20 animate-in fade-in"
              >
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-semibold text-on-surface">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-outline" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClasses} pl-10 pr-4`}
                  placeholder="usuario@infoplazas.org.pa"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-semibold text-on-surface">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-outline" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClasses} pl-10 pr-12`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface focus:outline-none focus-visible:text-primary disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botón de Submit bloqueado visualmente durante la petición */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center py-3 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
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

        <p className="mt-6 text-center text-sm text-slate-400">
          Sistema Gerencial Integral para el Monitoreo y Evaluación de Metas Institucionales.
        </p>
      </div>
    </div>
  );
};
