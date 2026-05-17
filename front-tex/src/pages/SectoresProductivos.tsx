import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, AlertTriangle, Loader2, Building2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { usePlanta } from '../contexts/PlantaContext';

interface SectorRow {
  nombre: string;
  porcentaje_mantencion: number | null;
  planta?: string;
}

const SectoresProductivos: React.FC = () => {
  const token = Cookies.get('token') ?? '';
  const { toast } = useToast();
  const { plantaParam, plantaParaEscritura, plantaLabel } = usePlanta();

  const [sectores, setSectores] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState<string>('1');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/sectores-productivos/mantencion?planta=${plantaParam}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('No se pudieron cargar los sectores');
      const data = await res.json();
      setSectores(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [plantaParam]);

  const crear = async () => {
    if (!plantaParaEscritura) {
      toast({
        title: 'Elegí una planta',
        description: 'En modo "Ambas plantas" no se puede crear. Cambiá el header a Catamarca o Varela.',
        variant: 'destructive',
      });
      return;
    }
    const nombreNorm = nombre.trim();
    if (!nombreNorm) {
      toast({ title: 'Falta nombre', description: 'Ingresá un nombre para el sector.', variant: 'destructive' });
      return;
    }
    const pct = Number(porcentaje);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toast({ title: 'Valor inválido', description: 'El % mantención debe estar entre 0 y 100.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombreNorm,
          planta: plantaParaEscritura,
          porcentaje_mantencion: Math.round(pct),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Error creando el sector');
      }
      toast({
        title: '✅ Sector creado',
        description: `"${nombreNorm}" creado en ${plantaLabel} con ${Math.round(pct)}% mantención.`,
      });
      setNombre('');
      setPorcentaje('1');
      await cargar();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Sectores Productivos">
      <div className="space-y-6 max-w-4xl">
        {/* Form de creación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Crear nuevo sector productivo
            </CardTitle>
            <CardDescription>
              El nombre debe ser único globalmente. El % de mantención se elige una vez al crear; después se modifica desde
              <strong> Actualizar Mantención</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!plantaParaEscritura ? (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-300 rounded-md text-orange-800">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="text-sm">
                  Estás en modo <strong>"Ambas plantas"</strong>. Para crear un sector, cambiá el selector del header a <strong>Catamarca</strong> o <strong>Varela</strong>.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del sector</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: TEJIDO, TINTORERÍA"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planta">Planta</Label>
                  <Input
                    id="planta"
                    value={plantaLabel}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Determinada por el selector del header.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porcentaje">% Mantención (al crear)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="porcentaje"
                      type="number"
                      step="1"
                      min={0}
                      max={100}
                      value={porcentaje}
                      onChange={(e) => setPorcentaje(e.target.value)}
                      className="text-lg font-medium"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <Button
                onClick={crear}
                disabled={!plantaParaEscritura || saving || !nombre.trim()}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Crear sector</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Listado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Sectores existentes
              </span>
              <Badge variant="outline">
                Planta: {plantaLabel}
              </Badge>
            </CardTitle>
            <CardDescription>
              Solo lectura. Para modificar el % de mantención andá a <strong>Actualizar Mantención</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
              </div>
            ) : sectores.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No hay sectores cargados para {plantaLabel}.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Planta</TableHead>
                    <TableHead className="text-right">% Mantención</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectores.map((s) => (
                    <TableRow key={s.nombre}>
                      <TableCell className="font-medium">{s.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          s.planta === 'catamarca'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-sky-50 text-sky-800 border-sky-300'
                        }>
                          {s.planta === 'catamarca' ? '🏭 Catamarca' : '🏭 Varela'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {s.porcentaje_mantencion ?? 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SectoresProductivos;
