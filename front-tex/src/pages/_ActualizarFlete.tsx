import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Save, RefreshCw, Loader2, AlertTriangle, DollarSign, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlanta } from '../contexts/PlantaContext';
import Cookies from 'js-cookie';

type Planta = 'catamarca' | 'varela';

const COLORS: Record<Planta, {
  bg: string; border: string; text: string; button: string; badge: string;
}> = {
  catamarca: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  varela: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-800',
    button: 'bg-sky-600 hover:bg-sky-700',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
  },
};

const formatARS = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ActualizarFlete: React.FC = () => {
  const token = Cookies.get('token') ?? '';
  const { toast } = useToast();
  const { plantaParaEscritura } = usePlanta();

  // Hooks SIEMPRE al tope — no se pueden invocar condicionalmente.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actualValor, setActualValor] = useState<number>(0);
  const [nuevoValor, setNuevoValor] = useState<string>('0');
  const [conteoProductosFlete, setConteoProductosFlete] = useState<{ total: number; conFlete: number; conFleteYM3: number } | null>(null);

  const planta: Planta | null = plantaParaEscritura;
  const titulo = planta === 'catamarca' ? 'Catamarca' : planta === 'varela' ? 'Varela' : '';
  const c = planta ? COLORS[planta] : null;

  useEffect(() => {
    if (!planta) return;
    let cancelado = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/plantas/${planta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('No se pudo cargar el flete actual');
        const data = await res.json();
        const v = Number(data?.valor_flete ?? 0);
        if (cancelado) return;
        setActualValor(v);
        setNuevoValor(String(v));
      } catch (err: any) {
        if (!cancelado) toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, [planta, token]);

  useEffect(() => {
    if (!planta) return;
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/productos?planta=${planta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const prods = await r.json();
        if (cancelado) return;
        setConteoProductosFlete({
          total: prods.length,
          conFlete: prods.filter((p: any) => p.lleva_flete === true).length,
          conFleteYM3: prods.filter((p: any) => p.lleva_flete === true && Number(p.m3 ?? 0) > 0).length,
        });
      } catch { /* silencioso */ }
    })();
    return () => { cancelado = true; };
  }, [planta, actualValor, token]);

  // Early return DESPUÉS de declarar todos los hooks.
  if (!planta || !c) {
    return (
      <Layout title="Actualizar Flete">
        <Card className="max-w-2xl border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Building2 className="h-5 w-5" />
              Elegí una planta específica
            </CardTitle>
            <CardDescription>
              El flete se configura por planta. Cambiá el selector de planta (arriba a la derecha)
              a <strong>Catamarca</strong> o <strong>Varela</strong> para editar su valor.
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  const recargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/plantas/${planta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo cargar el flete actual');
      const data = await res.json();
      const v = Number(data?.valor_flete ?? 0);
      setActualValor(v);
      setNuevoValor(String(v));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    const nuevo = Number(nuevoValor);
    if (!Number.isFinite(nuevo) || nuevo < 0) {
      toast({ title: 'Valor inválido', description: 'El valor de flete debe ser un número ≥ 0.', variant: 'destructive' });
      return;
    }
    if (nuevo === actualValor) {
      toast({ title: 'Sin cambios', description: 'El valor es el mismo que el actual.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/plantas/${planta}/flete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ valor_flete: nuevo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Error guardando flete');
      }
      const data = await res.json();
      setActualValor(Number(data.valor_flete));
      setNuevoValor(String(data.valor_flete));

      const conteoRes = await fetch(`${import.meta.env.VITE_API_URL}/productos?planta=${planta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productos = conteoRes.ok ? await conteoRes.json() : [];
      const conFlete = productos.filter((p: any) => p.lleva_flete === true).length;
      const conFleteYM3 = productos.filter((p: any) => p.lleva_flete === true && Number(p.m3 ?? 0) > 0).length;
      const total = productos.length;

      if (conFlete === 0) {
        toast({
          title: '⚠ Flete guardado, pero no afecta a ningún producto',
          description: `${titulo} ahora tiene $${formatARS(data.valor_flete)} por m³, pero NINGÚN producto de esta planta tiene "Aplica flete" marcado.`,
          duration: 8000,
        });
      } else if (conFleteYM3 === 0) {
        toast({
          title: '⚠ Flete guardado, pero todos los productos tienen m³ = 0',
          description: `${titulo}: $${formatARS(data.valor_flete)} por m³ guardado. ${conFlete} productos tienen "Aplica flete" pero ninguno tiene m³ cargado, así que el flete no afecta.`,
          duration: 8000,
        });
      } else {
        toast({
          title: '✅ Flete actualizado y CDR recalculado',
          description: `${titulo}: nuevo valor = $${formatARS(data.valor_flete)} por m³. Se recalculó el CDR de ${conFleteYM3} de ${total} productos (los que tienen "Aplica flete" + m³ > 0).`,
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title={`Actualizar Flete — ${titulo}`}>
      <div className="space-y-6 max-w-2xl">

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={c.badge}>
            <Truck className="h-3 w-3 mr-1 inline" />
            Planta {titulo}
          </Badge>
          {conteoProductosFlete && (
            <Badge variant="outline" className={
              conteoProductosFlete.conFleteYM3 > 0
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-orange-50 text-orange-700 border-orange-300'
            }>
              {conteoProductosFlete.conFleteYM3 > 0
                ? `📦 ${conteoProductosFlete.conFleteYM3} de ${conteoProductosFlete.total} productos pagan flete (con "Aplica flete" + m³ > 0)`
                : `⚠ Ninguno de los ${conteoProductosFlete.total} productos paga flete (necesitan "Aplica flete" + m³ > 0)`}
            </Badge>
          )}
        </div>

        <Card className={`${c.bg} ${c.border} border-2`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${c.text}`}>
              <Truck className="h-5 w-5" />
              Valor de flete por m³ — {titulo}
            </CardTitle>
            <CardDescription>
              Monto en pesos que se cobra por cada m³ ocupado en un camión. Se aplica solo a productos con <strong>"Aplica flete"</strong> activo y <strong>m³ &gt; 0</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border rounded-md">
                    <Label className="text-xs text-muted-foreground">Valor actual</Label>
                    <div className={`text-3xl font-bold ${c.text} mt-1 flex items-baseline gap-1`}>
                      <DollarSign className="h-5 w-5" />
                      {formatARS(actualValor)}
                      <span className="text-sm font-normal text-muted-foreground">/m³</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white border rounded-md">
                    <Label htmlFor="nuevo-valor" className="text-xs text-muted-foreground">Nuevo valor ($ por m³)</Label>
                    <div className="flex items-baseline gap-1 mt-1">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <Input
                        id="nuevo-valor"
                        type="number"
                        step="0.01"
                        min={0}
                        value={nuevoValor}
                        onChange={(e) => setNuevoValor(e.target.value)}
                        className="text-3xl font-bold border-0 p-0 h-auto flex-1"
                      />
                      <span className="text-sm font-normal text-muted-foreground">/m³</span>
                    </div>
                  </div>
                </div>

                {Number(nuevoValor) !== actualValor && Number.isFinite(Number(nuevoValor)) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      Al guardar se va a recalcular <code>monto_flete</code> y <code>valor_cdr_final</code> de
                      todos los productos de {titulo} con <strong>"Aplica flete" activo</strong>.
                      El nuevo flete por producto será <code>${formatARS(Number(nuevoValor) || 0)} × m³ del producto</code>.
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={recargar} variant="outline" disabled={saving || loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recargar
                  </Button>
                  <Button
                    onClick={guardar}
                    disabled={saving || loading || Number(nuevoValor) === actualValor}
                    className={`${c.button} text-white`}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando y recalculando...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Guardar y recalcular</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Cómo se calcula el CDR final cuando un producto lleva flete:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs font-mono">
{`CDR base        = Σ valor_cdr de ingredientes
CDR mantención  = CDR base × (1 + % mantención del sector)
Monto flete     = valor_flete (planta) × m³ (producto)
CDR final       = CDR mantención + Monto flete`}
            </pre>
            <p>
              Si <code>lleva_flete = false</code> o <code>m³ = 0</code>, no se aplica flete y el CDR final es igual al CDR con mantención.
            </p>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default ActualizarFlete;
