import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { usePlanta, PlantaView } from '../contexts/PlantaContext';
import { Factory, Building2, LogOut, ArrowUpRight } from 'lucide-react';
import Whool from '../TexCDR.png';

type Card = {
  id: PlantaView;
  label: string;
  description: string;
  Icon: any;
  /** HSL string del token --planta-* (sin paréntesis) o gradiente para "all" */
  accent: string;
};

const cards: Card[] = [
  {
    id: 'catamarca',
    label: 'Catamarca',
    description: 'Trabajar exclusivamente con datos de la planta de Catamarca.',
    Icon: Factory,
    accent: 'hsl(var(--planta-catamarca))',
  },
  {
    id: 'varela',
    label: 'Varela',
    description: 'Trabajar exclusivamente con datos de la planta de Varela.',
    Icon: Factory,
    accent: 'hsl(var(--planta-varela))',
  },
  {
    id: 'all',
    label: 'Ambas Plantas',
    description: 'Vista combinada de solo lectura — no se pueden crear nuevos registros.',
    Icon: Building2,
    accent: 'linear-gradient(135deg, hsl(var(--planta-catamarca)), hsl(var(--planta-varela)))',
  },
];

const SeleccionPlanta: React.FC = () => {
  const navigate = useNavigate();
  const { setPlanta } = usePlanta();
  const { user, logout } = useAuth();

  const elegir = (p: PlantaView) => {
    setPlanta(p);
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full opacity-30 dark:opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--planta-catamarca)/0.4), transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full opacity-20 dark:opacity-15"
          style={{
            background:
              'radial-gradient(ellipse at center, hsl(var(--planta-varela)/0.4), transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 liquid border-b border-hairline">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={Whool} alt="" className="h-7 w-7" />
            <h1 className="text-[17px] font-semibold tracking-tight leading-none">TexCDR</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-[12.5px] font-medium">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
            </div>
            <Button
              onClick={() => { logout(); navigate('/login'); }}
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative z-10 flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="mb-12 text-center max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">
            Sesión activa
          </p>
          <h2 className="text-display text-[40px] sm:text-[48px] leading-[1.05] mb-3">
            Elegí tu planta
          </h2>
          <p className="text-muted-foreground text-[14px]">
            Seleccioná con qué planta querés trabajar en esta sesión. Podés cambiarla en cualquier
            momento desde el selector del header.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
          {cards.map(({ id, label, description, Icon, accent }) => (
            <button
              key={id}
              onClick={() => elegir(id)}
              className="group relative liquid shadow-liquid hover:shadow-liquid-lg rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Halo on hover */}
              <div
                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: accent,
                  filter: 'blur(40px)',
                  opacity: 0.15,
                }}
              />

              <div className="relative">
                {/* Icon con halo de color */}
                <div className="relative inline-flex">
                  <div
                    className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: accent, filter: 'blur(20px)' }}
                  />
                  <div
                    className="relative h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: accent }}
                  >
                    <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                </div>

                <p className="mt-5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  {id === 'all' ? 'Vista' : 'Planta'}
                </p>
                <h3 className="text-display text-[26px] leading-none mt-1.5">{label}</h3>
                <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed">
                  {description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[12.5px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    Ingresar
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:rotate-12 transition-all"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SeleccionPlanta;
