import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import {
  Home,
  ClipboardList,
  ShoppingCart,
  Package,
  HardHat,
  Zap,
  RefreshCcw,
  DollarSign,
  UploadCloud,
  Menu,
  ChevronRight,
} from 'lucide-react';

import Whool from '../TexCDR.png';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mantengo tus rutas e íconos
  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/receta', label: 'Receta', icon: ClipboardList, color: 'text-sky-400' },
    { path: '/producto', label: 'Productos', icon: ShoppingCart, color: 'text-orange-300' },
    { path: '/insumos', label: 'Insumos', icon: Package, color: 'text-purple-300' },
    { path: '/mano-obra', label: 'Mano de Obra', icon: HardHat, color: 'text-orange-400' },
    { path: '/matriz-energetica', label: 'Matriz Energética', icon: Zap, color: 'text-yellow-300' },
    { path: '/actualizar', label: 'Actualizar costos', icon: RefreshCcw },
    { path: '/actualizarMantencion', label: 'Actualizar Mantención', icon: RefreshCcw },
    { path: '/resultados-cdr', label: 'CDR', icon: DollarSign, color: 'text-green-400' },
    { path: '/resultados-cdr-mantencion', label: 'CDR Sectorizado', icon: DollarSign },
    { path: '/importacion', label: 'Importación', icon: UploadCloud },
    { path: '/exportacion', label: 'Exportación', icon: UploadCloud },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Izquierda: marca + botón hamburguesa */}
            <div className="flex items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0">
                  <div className="border-b px-4 py-3">
                    <SheetHeader>
                      <div className="flex items-center gap-2">
                        <img src={Whool} alt="Whool" className="h-7 w-7" />
                        <SheetTitle className="text-xl">TexCDR</SheetTitle>
                      </div>
                      <Badge variant="secondary" className="w-fit mt-2">Sistema de Gestión Textil</Badge>
                    </SheetHeader>
                  </div>

                  {/* Menú de navegación */}
                  <nav className="p-2">
                    {navigationItems.map((item) => {
                      const Active = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className={[
                            'group flex items-center justify-between rounded-md px-3 py-2 transition-colors',
                            Active
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted text-foreground',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-3">
                            <Icon
                              size={20}
                              className={`${item.color ?? 'text-muted-foreground'} ${
                                Active ? 'text-primary-foreground' : ''
                              }`}
                            />
                            <span className="font-medium">{item.label}</span>
                          </span>
                          <ChevronRight
                            size={18}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              Active ? 'opacity-100' : ''
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <img src={Whool} alt="Whool" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-primary leading-none">TexCDR</h1>
              </div>

              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                Sistema de Gestión Textil
              </Badge>
            </div>

            {/* Derecha: usuario + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-sm text-muted-foreground">
                <span className="font-medium">{user?.name}</span>
                <Badge
                  variant={user?.role === 'admin' ? 'default' : 'secondary'}
                  className="ml-2"
                >
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

      {/* Contenido centrado (ya no hay sidebar) */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
