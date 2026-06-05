import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlanta, PlantaView } from '../contexts/PlantaContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
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
  Moon,
  Sun,
  BookOpen,
  LogOut,
  ChevronDown,
} from 'lucide-react';

import Whool from '../TexCDR.png';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { planta, setPlanta, plantaLabel } = usePlanta();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Estado de qué secciones están colapsadas (persistido en localStorage).
  // Default: si la sección contiene el path activo, queda abierta.
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('texcdr.nav.collapsed');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem('texcdr.nav.collapsed', JSON.stringify(collapsedSections));
  }, [collapsedSections]);
  const toggleSection = (key: string) =>
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

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
    { path: '/receta', label: 'Receta', icon: ClipboardList },
    { path: '/producto', label: 'Productos', icon: ShoppingCart, color: 'text-orange-500 dark:text-orange-300' },
    { path: '/insumos', label: 'Insumos', icon: Package, color: 'text-purple-500 dark:text-purple-300' },
    { path: '/mano-obra', label: 'Mano de Obra', icon: HardHat, color: 'text-amber-600 dark:text-amber-300' },
    { path: '/matriz-energetica', label: 'Matriz Energética', icon: Zap, color: 'text-yellow-500 dark:text-yellow-300' },
    { path: '/resultados-cdr', label: 'CDR', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    { path: '/resultados-cdr-mantencion', label: 'CDR Sectorizado', icon: DollarSign },
    { path: '/implosion-volumen', label: 'Implosión Volumen', icon: UploadCloud, color: 'text-teal-600 dark:text-teal-300' },
    { path: '/resultados-volumen', label: 'Resultados Volumen', icon: BarChart2, color: 'text-teal-600 dark:text-teal-300' },

    // Flete
    { sectionHeader: 'Actualizar Flete', sectionIcon: Truck },
    { path: '/actualizar-flete', label: 'Flete', icon: Truck, color: 'text-amber-500 dark:text-amber-300', indent: true },

    // Variables globales
    { sectionHeader: 'Variables Globales', sectionIcon: Settings },
    { path: '/actualizar', label: 'Actualizar costos', icon: RefreshCcw, indent: true },
    { path: '/actualizarMantencion', label: 'Actualizar Mantención', icon: RefreshCcw, indent: true },
    { path: '/sectores-productivos', label: 'Sectores Productivos', icon: Building2, indent: true, color: 'text-blue-500 dark:text-blue-300' },

    // Datos
    { sectionHeader: 'Datos', sectionIcon: Database },
    { path: '/importacion', label: 'Importación', icon: UploadCloud, indent: true },
    { path: '/exportacion', label: 'Exportación', icon: DownloadCloud, indent: true },
    { path: '/manual-carga', label: 'Manual de Carga', icon: BookOpen, indent: true, color: 'text-sky-500 dark:text-sky-300' },
  ];

  // Color dot por planta — usa los tokens definidos en index.css
  const plantaDot =
    planta === 'catamarca' ? 'bg-[hsl(var(--planta-catamarca))]' :
    planta === 'varela'    ? 'bg-[hsl(var(--planta-varela))]'    :
                             'bg-gradient-to-r from-[hsl(var(--planta-catamarca))] to-[hsl(var(--planta-varela))]';

  return (
    <div className="min-h-screen">
      {/* Header — liquid retina fuerte */}
      <header className="sticky top-0 z-40 liquid border-b border-hairline relative">
        {/* Línea de luz superior (estilo "scan line" sutil) */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--planta-catamarca)/0.4), hsl(var(--planta-varela)/0.4), transparent)',
          }}
        />
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Izquierda — botón menú + marca */}
            <div className="flex items-center gap-3">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full h-9 w-9 hover:bg-foreground/5"
                  >
                    <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[320px] sm:w-[360px] p-0 flex flex-col overflow-hidden"
                >
                  <div className="relative px-5 py-5 border-b border-hairline overflow-hidden">
                    {/* Halo decorativo */}
                    <div
                      className="absolute -top-12 -right-8 h-28 w-28 rounded-full opacity-30 pointer-events-none"
                      style={{
                        background:
                          'conic-gradient(from 90deg, hsl(var(--planta-catamarca)/0.4), hsl(var(--planta-varela)/0.4), hsl(var(--planta-catamarca)/0.4))',
                        filter: 'blur(28px)',
                      }}
                    />
                    <SheetHeader className="relative">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div
                            className="absolute -inset-1.5 rounded-full opacity-50"
                            style={{
                              background: 'radial-gradient(circle, hsl(var(--foreground)/0.06), transparent 70%)',
                            }}
                          />
                          <img src={Whool} alt="" className="relative h-7 w-7" />
                        </div>
                        <SheetTitle className="text-lg font-semibold tracking-tight">TexCDR</SheetTitle>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 tracking-[0.02em]">
                        Sistema de Gestión Textil
                      </p>
                    </SheetHeader>
                  </div>

                  {/* Menú de navegación con secciones colapsables */}
                  <nav className="px-2 py-3 overflow-y-auto flex-1">
                    {(() => {
                      // Agrupamos: items sin sección al principio, luego cada sección con sus hijos.
                      type Group = { sectionKey: string | null; header?: NavHeader; items: NavLink[] };
                      const groups: Group[] = [];
                      let current: Group = { sectionKey: null, items: [] };
                      groups.push(current);
                      for (const item of navigationItems) {
                        if ('sectionHeader' in item) {
                          current = { sectionKey: item.sectionHeader, header: item, items: [] };
                          groups.push(current);
                        } else {
                          current.items.push(item);
                        }
                      }
                      return groups.map((g, gi) => {
                        // Grupo "sin sección" — render directo
                        if (!g.header) {
                          return (
                            <div key={`nosec-${gi}`} className="space-y-0.5">
                              {g.items.map(item => renderLink(item))}
                            </div>
                          );
                        }

                        const key = g.sectionKey!;
                        const SectionIcon = g.header.sectionIcon;
                        const containsActive = g.items.some(i => i.path === location.pathname);
                        const isCollapsed = collapsedSections[key] === true && !containsActive;

                        return (
                          <div key={`sec-${gi}`} className="mt-5">
                            <button
                              type="button"
                              onClick={() => toggleSection(key)}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 hover:text-foreground transition-colors group"
                            >
                              <span className="flex items-center gap-1.5">
                                <SectionIcon className="h-3 w-3" strokeWidth={2.2} />
                                {key}
                              </span>
                              <ChevronDown
                                className={`h-3 w-3 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}
                                strokeWidth={2.2}
                              />
                            </button>
                            <div
                              className={`grid transition-all duration-300 ease-out ${
                                isCollapsed
                                  ? 'grid-rows-[0fr] opacity-0 mt-0'
                                  : 'grid-rows-[1fr] opacity-100 mt-1'
                              }`}
                            >
                              <div className="overflow-hidden space-y-0.5">
                                {g.items.map(item => renderLink(item))}
                              </div>
                            </div>
                          </div>
                        );
                      });

                      function renderLink(item: NavLink) {
                        const Active = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpen(false)}
                            className={[
                              'group relative flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-300',
                              Active
                                ? 'bg-foreground text-background glow-foreground'
                                : 'hover:bg-foreground/[0.04] text-foreground/75 hover:text-foreground',
                              item.indent ? 'ml-3' : '',
                            ].join(' ')}
                          >
                            {/* Barra indicadora a la izquierda */}
                            {Active && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[7px] h-5 w-[3px] rounded-full bg-foreground"
                                aria-hidden
                              />
                            )}
                            <span className="flex items-center gap-3 min-w-0">
                              <Icon
                                size={17}
                                strokeWidth={1.8}
                                className={Active
                                  ? 'text-background'
                                  : (item.color ?? 'text-muted-foreground/80 group-hover:text-foreground transition-colors')
                                }
                              />
                              <span className="text-[13.5px] font-medium tracking-[-0.005em] truncate">{item.label}</span>
                            </span>
                            <ChevronRight
                              size={14}
                              strokeWidth={2}
                              className={`transition-all duration-300 shrink-0 ${
                                Active
                                  ? 'opacity-100 translate-x-0 text-background/70'
                                  : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-muted-foreground'
                              }`}
                            />
                          </Link>
                        );
                      }
                    })()}
                  </nav>

                  {/* Footer del sidebar — usuario */}
                  <div className="border-t border-hairline px-4 py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{user?.name ?? 'Usuario'}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </p>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      title="Cerrar sesión"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex items-center gap-2 group">
                <img src={Whool} alt="" className="h-7 w-7 transition-transform duration-300 group-hover:rotate-[8deg]" />
                <h1 className="text-[17px] font-semibold tracking-tight leading-none">TexCDR</h1>
              </Link>
            </div>

            {/* Derecha — selector planta + theme + logout */}
            <div className="flex items-center gap-2">
              {/* Selector global de planta — liquid soft chip */}
              <Select value={planta} onValueChange={(v) => setPlanta(v as PlantaView)}>
                <SelectTrigger className="w-[150px] sm:w-[170px] h-9 rounded-full liquid-soft border-hairline text-[13px] font-medium pl-3 pr-2.5 gap-1.5 hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full ${plantaDot} shadow-[0_0_0_3px_rgb(0_0_0/0.04)] dark:shadow-[0_0_0_3px_rgb(255_255_255/0.04)] shrink-0`} />
                    <SelectValue placeholder="Planta" />
                  </div>
                </SelectTrigger>
                <SelectContent className="liquid border-hairline shadow-liquid-lg rounded-xl">
                  <SelectItem value="catamarca" className="gap-2 rounded-md">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--planta-catamarca))]" />
                      Catamarca
                    </span>
                  </SelectItem>
                  <SelectItem value="varela" className="gap-2 rounded-md">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[hsl(var(--planta-varela))]" />
                      Varela
                    </span>
                  </SelectItem>
                  <SelectItem value="all" className="gap-2 rounded-md">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[hsl(var(--planta-catamarca))] to-[hsl(var(--planta-varela))]" />
                      Ambas Plantas
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Theme toggle */}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                className="rounded-full h-9 w-9 hover:bg-foreground/5"
              >
                {theme === 'dark'
                  ? <Sun className="h-[16px] w-[16px]" strokeWidth={2} />
                  : <Moon className="h-[16px] w-[16px]" strokeWidth={2} />}
              </Button>

              {/* User chip — solo desktop */}
              <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-hairline">
                <div className="text-right leading-tight">
                  <p className="text-[12.5px] font-medium">{user?.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Ambient orbs detrás del contenido — afecta TODAS las páginas, más fuerte */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Orb superior izquierdo — color planta catamarca */}
        <div
          className="absolute -top-40 -left-32 h-[600px] w-[600px] rounded-full opacity-[0.22] dark:opacity-[0.15]"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--planta-catamarca)/0.8), transparent 65%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Orb central — neutro */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full opacity-[0.10] dark:opacity-[0.06]"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--foreground)/0.3), transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Orb inferior derecho — color planta varela */}
        <div
          className="absolute -bottom-40 -right-32 h-[700px] w-[700px] rounded-full opacity-[0.20] dark:opacity-[0.14]"
          style={{
            background:
              'radial-gradient(circle at center, hsl(var(--planta-varela)/0.7), transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Grid muy sutil */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-grid"
          style={{ color: 'currentColor' }}
        />
      </div>

      {/* Contenido principal */}
      <main className="relative container mx-auto px-4 py-8">
        <div className="mb-7 flex items-baseline justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="text-display text-3xl sm:text-[34px] leading-none">{title}</h2>
            <span
              className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-foreground/30"
              aria-hidden
            />
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
            {plantaLabel}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
