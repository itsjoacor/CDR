import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  ClipboardList,
  Package,
  ShoppingCart,
  HardHat,
  Zap,
  DollarSign,
  ArrowUpRight,
  BarChart2,
  UploadCloud,
  Truck,
  RefreshCcw,
  BookOpen,
} from 'lucide-react';

type ModuleCard = {
  path: string;
  title: string;
  description: string;
  Icon: any;
  /** HSL tonal — usado para el chip y el halo hover */
  hue: string;
  /** Sección categórica */
  section: 'operacion' | 'analisis' | 'gestion';
  /** Solo admin */
  adminOnly?: boolean;
};

const modules: ModuleCard[] = [
  // OPERACIÓN
  { path: '/receta',             title: 'Recetas',           description: 'Composición de productos: insumos, MO, energía y sub-recetas.', Icon: ClipboardList, hue: '199 89% 48%', section: 'operacion' },
  { path: '/producto',           title: 'Productos',         description: 'Catálogo de productos finales con sectores, flete y volumen.',  Icon: ShoppingCart,  hue: '24 95% 53%',  section: 'operacion' },
  { path: '/insumos',            title: 'Insumos',           description: 'Materiales comprados externamente con costo y flete propio.',   Icon: Package,       hue: '270 60% 60%', section: 'operacion' },
  { path: '/mano-obra',          title: 'Mano de Obra',      description: 'Tiempos estándar, salarios y consumo por operación.',           Icon: HardHat,       hue: '32 95% 52%',  section: 'operacion' },
  { path: '/matriz-energetica',  title: 'Matriz Energética', description: 'Consumos y costos energéticos por operación.',                  Icon: Zap,           hue: '45 93% 58%',  section: 'operacion' },

  // ANÁLISIS
  { path: '/resultados-cdr',     title: 'CDR',                description: 'Costo Directo de Reposición calculado por producto.',          Icon: DollarSign,    hue: '152 76% 42%', section: 'analisis' },
  { path: '/resultados-volumen', title: 'Resultados Volumen', description: 'Análisis de producción mensual y proyecciones.',               Icon: BarChart2,     hue: '173 80% 36%', section: 'analisis' },
  { path: '/implosion-volumen',  title: 'Implosión Volumen',  description: 'Cargar volumen producido del periodo.',                        Icon: UploadCloud,   hue: '173 80% 36%', section: 'analisis' },

  // GESTIÓN
  { path: '/actualizar-flete',   title: 'Flete',              description: 'Configurar valor de flete por planta (productos e insumos).',  Icon: Truck,         hue: '38 92% 50%',  section: 'gestion', adminOnly: true },
  { path: '/actualizar',         title: 'Costos globales',    description: 'Actualización masiva de costos.',                              Icon: RefreshCcw,    hue: '0 0% 30%',    section: 'gestion', adminOnly: true },
  { path: '/manual-carga',       title: 'Manual de Carga',    description: 'Referencia de columnas, formatos y reglas de import/export.',  Icon: BookOpen,      hue: '210 89% 55%', section: 'gestion' },
];

const SECTIONS: { id: ModuleCard['section']; label: string; description: string }[] = [
  { id: 'operacion', label: 'Operación',   description: 'Catálogos y composición productiva.' },
  { id: 'analisis',  label: 'Análisis',    description: 'Visualización y métricas de costos.' },
  { id: 'gestion',   label: 'Gestión',     description: 'Configuración, variables globales y documentación.' },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Layout title="Panel de Control">
      <div className="space-y-10">
        {/* Módulos agrupados por sección */}
        {SECTIONS.map((section) => {
          const items = modules.filter(m => m.section === section.id && (!m.adminOnly || isAdmin));
          if (!items.length) return null;

          return (
            <section key={section.id} className="space-y-4">
              <header className="flex items-baseline justify-between gap-3">
                <div>
                  <h4 className="text-headline text-[18px]">{section.label}</h4>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">{section.description}</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/60">
                  {items.length} módulo{items.length === 1 ? '' : 's'}
                </span>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {items.map(({ path, title, description, Icon, hue }) => (
                  <Link
                    key={path}
                    to={path}
                    className="group relative rounded-2xl liquid-card p-5 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                    style={{
                      // Custom hover shadow con color de la card
                      ['--hover-glow' as any]: `hsl(${hue} / 0.25)`,
                    }}
                  >
                    {/* Halo de color al hover — más fuerte */}
                    <div
                      className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, hsl(${hue} / 0.3), transparent 70%)`,
                        filter: 'blur(28px)',
                      }}
                    />
                    {/* Halo secundario inferior */}
                    <div
                      className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full opacity-0 group-hover:opacity-50 transition-all duration-700 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, hsl(${hue} / 0.2), transparent 70%)`,
                        filter: 'blur(24px)',
                      }}
                    />
                    {/* Línea de luz superior — visible siempre, más fuerte en hover */}
                    <div
                      className="absolute inset-x-4 top-0 h-px opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, transparent, hsl(${hue} / 0.6), transparent)`,
                      }}
                    />

                    <div className="relative flex items-start justify-between gap-3">
                      <div className="relative">
                        {/* Glow detrás del icon */}
                        <div
                          className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-500"
                          style={{
                            background: `radial-gradient(circle, hsl(${hue} / 0.4), transparent 70%)`,
                            filter: 'blur(12px)',
                          }}
                        />
                        <div
                          className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-105"
                          style={{
                            background: `linear-gradient(135deg, hsl(${hue} / 0.18), hsl(${hue} / 0.08))`,
                            color: `hsl(${hue})`,
                            boxShadow: `inset 0 1px 0 0 hsl(${hue} / 0.2), 0 1px 2px hsl(${hue} / 0.1)`,
                          }}
                        >
                          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                        </div>
                      </div>
                      <ArrowUpRight
                        className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:rotate-12 group-hover:scale-110 transition-all duration-300"
                        strokeWidth={2}
                      />
                    </div>

                    <h5 className="text-[15px] font-semibold tracking-tight mt-4">{title}</h5>
                    <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">
                      {description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Layout>
  );
};

export default Dashboard;
