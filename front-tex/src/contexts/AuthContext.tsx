import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { supabase } from '@/lib/supabase';

interface User {
  name: ReactNode;
  id: string;
  email: string;
  role: 'admin' | 'usuario';
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  initialAuthCheck: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ⏱ Auto logout por inactividad (30 min)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos
    let inactivityTimeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        toast({
          title: 'Sesión cerrada por inactividad',
          description: 'Debes volver a iniciar sesión',
        });
        logout();
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(inactivityTimeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        let message = 'Credenciales inválidas';
        if (authError.message.includes('Invalid login credentials')) {
          message = 'Correo o contraseña incorrectos';
        } else if (authError.message.includes('Email not confirmed')) {
          message = 'Por favor verifica tu correo electrónico primero';
        }
        throw new Error(message);
      }

      const session = authData.session;
      const userId = authData.user?.id;
      const token = session?.access_token;

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .single();

      if (perfilError || !perfil) {
        throw new Error('Perfil de usuario no encontrado');
      }

      const userData: User = {
        id: userId!,
        email,
        role: perfil.rol,
        token: token!,
        name: '',
      };

      setUser(userData);
      setIsAuthenticated(true);
      Cookies.set('token', token!); // opcional (no se usa para verificar sesión)
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearClientAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    Cookies.remove('token');

    // Remueve posibles claves de Supabase en localStorage (por seguridad)
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      sessionStorage.clear();
    } catch {}
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      // Si no hay sesión, Supabase puede devolver AuthSessionMissingError → no romper UX
      if (error && (error as any).name !== 'AuthSessionMissingError') {
        console.warn('Supabase signOut warning:', error);
      }
    } catch (err) {
      console.warn('Logout warning (ignored):', err);
    } finally {
      clearClientAuth();
      // Redirigir forzando nueva carga
      window.location.href = '/login';
      setIsLoading(false);
    }
  };

  const verifySession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    // 🔒 ÚNICA fuente de verdad: sesión de Supabase (sin fallback de cookie)
    if (!session) {
      clearClientAuth();
      setInitialAuthCheck(true);
      return;
    }

    const token = session.access_token;
    const userId = session.user?.id;
    const email = session.user?.email;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      clearClientAuth();
      setInitialAuthCheck(true);
      return;
    }

    setUser({
      id: userId!,
      email: email!,
      role: perfil.rol,
      token,
      name: '',
    });

    setIsAuthenticated(true);
    // Podés reflejar el token en cookie, pero NO se usa para validar auth
    Cookies.set('token', token);
    setInitialAuthCheck(true);
  };

  useEffect(() => {
    verifySession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        clearClientAuth();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        initialAuthCheck,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
