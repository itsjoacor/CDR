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

  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  };


  // ⏱ Auto logout tras 1 hora
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutos

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

    // Eventos que reinician el contador de inactividad
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Inicializa el contador al entrar

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

      const userId = authData.user?.id;
      const token = authData.session?.access_token;

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
        name: ''
      };

      setUser(userData);
      setIsAuthenticated(true);
      Cookies.set('token', token!);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setIsAuthenticated(false);
      Cookies.remove('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySession = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    const session = sessionData.session;

    const token = session?.access_token || Cookies.get('token') || null;

    // ⛔ Cerrar sesión si el token ya expiró
    if (!token || isTokenExpired(token)) {
      Cookies.remove('token');
      setUser(null);
      setIsAuthenticated(false);
      setInitialAuthCheck(true);
      toast({
        title: 'Sesión expirada',
        description: 'Debes volver a iniciar sesión.',
        variant: 'destructive',
      });
      return;
    }

    const userId = session.user?.id;
    const email = session.user?.email;

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      Cookies.remove('token');
      setUser(null);
      setIsAuthenticated(false);
      setInitialAuthCheck(true);
      return;
    }

    setUser({
      id: userId!,
      email: email!,
      role: perfil.rol,
      token,
      name: ''
    });

    setIsAuthenticated(true);
    Cookies.set('token', token);
    setInitialAuthCheck(true);
  };


  useEffect(() => {
    verifySession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        Cookies.remove('token');
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      initialAuthCheck,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
