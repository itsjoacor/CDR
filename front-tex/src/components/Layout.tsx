import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlanta, PlantaView } from '../contexts/PlantaContext';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  DownloadCloud,
  Menu,
  ChevronRight,
  BarChart2,
  Truck,
  Building2,
  Settings,
  Database,
} from 'lucide-react';

import Whool from '../TexCDR.png';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { planta, setPlanta, plantaLabel, plantaColor } = usePlanta();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Rutas organizadas por sección. Items con `sectionHeader` se renderean como cabecera.
  type NavLink = { path: string; label: string; icon: any; color?: string; indent?: boolean };
  type NavHeader = { sectionHeader: string; sectionIcon: any };
  type NavItem = NavLink | NavHeader;

  const navigationItems: NavItem[] = [
    // Operación principal
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/receta', label: 'Receta', icon: ClipboardList, color: 'text-sky-400' },
    { path: '/producto', label: 'Productos', icon: ShoppingCart, color: 'text-orange-300' },
    { path: '/insumos', label: 'Insumos', icon: Package, color: 'text-purple-300' },
    { path: '/mano-obra', label: 'Mano de Obra', icon: HardHat, color: 'text-orange-400' },
    { path: '/matriz-energetica', label: 'Matriz Energética', icon: Zap, color: 'text-yellow-300' },
    { path: '/resultados-cdr', label: 'CDR', icon: DollarSign, color: 'text-green-400' },
    { path: '/resultados-cdr-mantencion', label: 'CDR Sectorizado', icon: DollarSign },
    { path: '/implosion-volumen', label: 'Implosión Volumen', icon: UploadCloud, color: 'text-teal-400' },
    { path: '/resultados-volumen', label: 'Resultados Volumen', icon: BarChart2, color: 'text-teal-400' },

    // Fletes
    { sectionHeader: 'Actualizar Fletes', sectionIcon: Truck },
    { path: '/actualizarFleteCatamarca', label: 'Flete Catamarca', icon: Truck, color: 'text-amber-400', indent: true },
    { path: '/actualizarFleteVarela', label: 'Flete Varela', icon: Truck, color: 'text-sky-400', indent: true },

    // Variables globales
    { sectionHeader: 'Variables Globales', sectionIcon: Settings },
    { path: '/actualizar', label: 'Actualizar costos', icon: RefreshCcw, indent: true },
    { path: '/actualizarMantencion', label: 'Actualizar Mantención', icon: RefreshCcw, indent: true },
    { path: '/sectores-productivos', label: 'Sectores Productivos', icon: Building2, indent: true, color: 'text-blue-400' },

    // Datos
    { sectionHeader: 'Datos', sectionIcon: Database },
    { path: '/importacion', label: 'Importación', icon: UploadCloud, indent: true },
    { path: '/exportacion', label: 'Exportación', icon: DownloadCloud, indent: true },
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
                <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0 flex flex-col overflow-hidden">
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
                  <nav className="p-2 overflow-y-auto flex-1">
                    {navigationItems.map((item, idx) => {
                      // Encabezado de sección
                      if ('sectionHeader' in item) {
                        const SectionIcon = item.sectionIcon;
                        return (
                          <div
                            key={`section-${idx}`}
                            className="mt-3 mb-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                          >
                            <SectionIcon className="h-3 w-3" />
                            {item.sectionHeader}
                          </div>
                        );
                      }

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
                            item.indent ? 'ml-3' : '',
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

            {/* Derecha: planta selector + usuario + logout */}
            <div className="flex items-center gap-3">
              {/* Selector global de planta */}
              <Select value={planta} onValueChange={(v) => setPlanta(v as PlantaView)}>
                <SelectTrigger className={`w-44 ${plantaColor} border-2 font-semibold`}>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <SelectValue placeholder="Planta" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catamarca">🏭 Catamarca</SelectItem>
                  <SelectItem value="varela">🏭 Varela</SelectItem>
                  <SelectItem value="all">🏢 Ambas Plantas</SelectItem>
                </SelectContent>
              </Select>

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
