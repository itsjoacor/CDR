
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}
import {
  Home,
  ClipboardList,
  ShoppingCart,
  Package,
  HardHat,
  Zap,
  RefreshCcw,
  DollarSign,
  UploadCloud
} from "lucide-react";

import Whool from '../../public/TexCDR.png';



const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/composicion', label: 'Composición', icon: ClipboardList, color: 'text-sky-400' },
    { path: '/producto', label: 'Productos', icon: ShoppingCart, color: 'text-orange-300' },
    { path: '/insumos', label: 'Insumos', icon: Package, color: 'text-purple-300' },
    { path: '/mano-obra', label: 'Mano de Obra', icon: HardHat, color: 'text-orange-400' },
    { path: '/matriz-energetica', label: 'Matriz Energética', icon: Zap, color: 'text-yellow-300' },
    { path: '/actualizar', label: 'Actualizar costos', icon: RefreshCcw },
    { path: '/resultados-cdr', label: 'CDR', icon: DollarSign, color: 'text-green-400' },
    { path: '/exportacion', label: 'Exportación', icon: UploadCloud },
  ];



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
            <img
              src={Whool}
              alt="Whool"
              className='h-8 w-8'
            />

                <h1 className="text-2xl font-bold text-primary">TexCDR</h1>
              </div>

              <Badge variant="secondary" className="text-sm">
                Sistema de Gestión Textil
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{user?.name}</span>
                <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
                  {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </Badge>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-12 lg:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-muted-foreground">Navegación</h3>
              <nav className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                      }`}
                  >
                    <span className={`text-lg ${item.color ?? 'text-muted-foreground'}`}>
                      <item.icon size={20} />
                    </span>

                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground">{title}</h2>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
