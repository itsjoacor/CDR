import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import Whool from '../TexCDR.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setError('');
    try {
      const success = await login(email, password);
      if (success) {
        toast({ title: 'Inicio de sesión exitoso', description: 'Bienvenido al sistema TexCDR' });
        const returnTo = (location.state as any)?.from?.pathname || '/seleccion-planta';
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      toast({
        title: 'Error de autenticación',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Fondo decorativo — orbs difusos con los colores de planta */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-24 h-[500px] w-[500px] rounded-full opacity-30 dark:opacity-20"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--planta-catamarca)/0.5), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-24 h-[600px] w-[600px] rounded-full opacity-30 dark:opacity-20"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--planta-varela)/0.5), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card principal */}
      <div className="relative w-full max-w-[420px]">
        {/* Halo detrás de la card */}
        <div
          className="absolute -inset-px rounded-3xl opacity-50"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--planta-catamarca)/0.15), transparent 50%, hsl(var(--planta-varela)/0.15))',
            filter: 'blur(20px)',
          }}
        />

        <div className="relative liquid shadow-liquid-lg rounded-3xl p-8 sm:p-10">
          {/* Logo + título */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--foreground)/0.08), transparent 70%)',
                }}
              />
              <img src={Whool} alt="" className="relative h-14 w-14" />
            </div>
            <h1 className="mt-5 text-display text-[28px] leading-none">TexCDR</h1>
            <p className="mt-2 text-[12.5px] text-muted-foreground tracking-[0.01em]">
              Sistema de Gestión de Estructura Productiva Textil
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium tracking-[0.01em]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                className="h-11 rounded-xl bg-background/60 border-hairline px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-medium tracking-[0.01em]">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className="h-11 rounded-xl bg-background/60 border-hairline px-4 pr-11 text-[14px] focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-[12.5px] text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLogging}
              className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-[14px] font-medium gap-2 group shadow-liquid"
            >
              {isLogging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-[11px] text-muted-foreground/70 tracking-[0.02em]">
            Acceso restringido al personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
