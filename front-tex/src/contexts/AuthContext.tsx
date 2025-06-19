import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { supabase } from '@/lib/supabase';

interface User {
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
  isAuthenticated: boolean; // Add this new property
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/autorizacion/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await res.json();
      const userData: User = {
        id: data.user?.id || '',
        email,
        role: data.rol,
        token: data.token,
      };

      setUser(userData);
      Cookies.set('token', data.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Make sure to re-throw the error
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear Supabase session first
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Then clear local state
      setUser(null);
      Cookies.remove('token');

      // Force full page reload to clear any state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifySession = async () => {
    const token = Cookies.get('token');
    if (!token) {
      setInitialAuthCheck(true);
      setIsAuthenticated(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/autorizacion/verificarSesion`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const { rol, email } = await res.json();
        setUser({
          id: '', // Get from backend if needed
          email,
          role: rol,
          token,
        });
        setIsAuthenticated(true);
      } else {
        Cookies.remove('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session verification error:', error);
      Cookies.remove('token');
      setIsAuthenticated(false);
    } finally {
      setInitialAuthCheck(true);
    }
  };

  useEffect(() => {
    verifySession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        Cookies.remove('token');
        setUser(null);
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
      isAuthenticated // Add this
    }}>
      {children}
    </AuthContext.Provider>
  );
};