import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { usePlanta, PlantaView } from '../contexts/PlantaContext';
import { Factory, Building2, LogOut } from 'lucide-react';
import Whool from '../TexCDR.png';

const SeleccionPlanta: React.FC = () => {
  const navigate = useNavigate();
  const { setPlanta } = usePlanta();
  const { user, logout } = useAuth();

  const elegir = (p: PlantaView) => {
    setPlanta(p);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — mismo estilo que Layout */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={Whool} alt="TexCDR" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-primary leading-none">TexCDR</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex text-xs ml-2">
              Sistema de Gestión Textil
            </Badge>
          </div>

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
            <Button
              onClick={() => { logout(); navigate('/login'); }}
              variant="outline"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Seleccionar Planta de Trabajo
          </h2>
          <p className="text-muted-foreground mt-2">
            Elegí con qué planta querés trabajar en esta sesión
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* CATAMARCA */}
          <Card className="bg-card border-2 border-amber-200 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                <Factory className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Planta</p>
                <h3 className="text-3xl font-extrabold text-amber-700 mt-1">Catamarca</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ver y trabajar solo con datos de Catamarca
              </p>
              <Button
                onClick={() => elegir('catamarca')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Ingresar
              </Button>
            </CardContent>
          </Card>

          {/* VARELA */}
          <Card className="bg-card border-2 border-sky-200 hover:border-sky-500 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-sky-50 flex items-center justify-center">
                <Factory className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Planta</p>
                <h3 className="text-3xl font-extrabold text-sky-700 mt-1">Varela</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Ver y trabajar solo con datos de Varela
              </p>
              <Button
                onClick={() => elegir('varela')}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                Ingresar
              </Button>
            </CardContent>
          </Card>

          {/* AMBAS */}
          <Card className="bg-card border-2 border-slate-200 hover:border-slate-500 hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-8 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Vista</p>
                <h3 className="text-3xl font-extrabold text-slate-700 mt-1">Ambas Plantas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Vista combinada — no permite crear nuevos registros
              </p>
              <Button
                onClick={() => elegir('all')}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white"
              >
                Ingresar
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground mt-10 text-center max-w-md">
          Podés cambiar la planta en cualquier momento desde el selector del header.
        </p>
      </main>
    </div>
  );
};

export default SeleccionPlanta;
