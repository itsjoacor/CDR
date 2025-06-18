import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

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
  const { toast } = useToast();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/autorizacion/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
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
      throw error; // Propagate error to Login.tsx
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      Cookies.remove('token');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar sesión al cargar la app
  useEffect(() => {
    const verifySession = async () => {
      const token = Cookies.get('token');
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/autorizacion/verificarSesion`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const { rol } = await res.json();
          setUser({
            id: '', // Puedes obtenerlo de Supabase si es necesario
            email: '', // Obtenerlo de Supabase o almacenarlo en cookies
            role: rol,
            token,
          });
        }
      } catch (error) {
        console.error('Error verifying session:', error);
      }
    };

    verifySession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};