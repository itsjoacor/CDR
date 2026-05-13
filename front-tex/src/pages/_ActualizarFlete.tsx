import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Save, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

type Planta = 'catamarca' | 'varela';
type Color = 'amber' | 'sky';

const COLORS = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  sky: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-800',
    button: 'bg-sky-600 hover:bg-sky-700',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
  },
};

interface Props {
  planta: Planta;
  color: Color;
}

const ActualizarFlete: React.FC<Props> = ({ planta, color }) => {
  const token = Cookies.get('token') ?? '';
  const { toast } = useToast();
  const c = COLORS[color];
  const titulo = planta === 'catamarca' ? 'Catamarca' : 'Varela';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actualPct, setActualPct] = useState<number>(0);
  const [nuevoPct, setNuevoPct] = useState<string>('0');

  const cargarFleteActual = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/plantas/${planta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo cargar el flete actual');
      const data = await res.json();
      const pct = Number(data?.porcentaje_flete ?? 0);
      setActualPct(pct);
      setNuevoPct(String(pct));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarFleteActual(); }, [planta]);

  const guardar = async () => {
    const nuevo = Number(nuevoPct);
    if (!Number.isFinite(nuevo) || nuevo < 0 || nuevo > 100) {
      toast({ title: 'Valor inválido', description: 'El porcentaje debe estar entre 0 y 100.', variant: 'destructive' });
      return;
    }
    if (nuevo === actualPct) {
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
        body: JSON.stringify({ porcentaje_flete: nuevo }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? 'Error guardando flete');
      }
      const data = await res.json();
      setActualPct(Number(data.porcentaje_flete));
      setNuevoPct(String(data.porcentaje_flete));

      // Después de actualizar el %, contar cuántos productos tienen lleva_flete=true
      // y por lo tanto fueron afectados por el recálculo
      const conteoRes = await fetch(`${import.meta.env.VITE_API_URL}/productos?planta=${planta}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productos = conteoRes.ok ? await conteoRes.json() : [];
      const conFlete = productos.filter((p: any) => p.lleva_flete === true).length;
      const total = productos.length;

      if (conFlete === 0) {
        toast({
          title: '⚠ Flete guardado, pero no afecta a ningún producto',
          description: `${titulo} ahora tiene ${data.porcentaje_flete}% de flete configurado, pero NINGÚN producto de esta planta tiene "Aplica flete" marcado. Marcalo en los productos donde corresponda para que el CDR se ajuste.`,
          duration: 8000,
        });
      } else {
        toast({
          title: '✅ Flete actualizado y CDR recalculado',
          description: `${titulo}: nuevo % flete = ${data.porcentaje_flete}%. Se recalculó el CDR de ${conFlete} de ${total} productos (los que tienen "Aplica flete" activado).`,
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Conteo de productos con flete activo (para mostrar en el UI)
  const [conteoProductosFlete, setConteoProductosFlete] = useState<{ total: number; conFlete: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/productos?planta=${planta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return;
        const prods = await r.json();
        setConteoProductosFlete({
          total: prods.length,
          conFlete: prods.filter((p: any) => p.lleva_flete === true).length,
        });
      } catch { /* silencioso */ }
    })();
  }, [planta, actualPct]);

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
              conteoProductosFlete.conFlete > 0
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-orange-50 text-orange-700 border-orange-300'
            }>
              {conteoProductosFlete.conFlete > 0
                ? `📦 ${conteoProductosFlete.conFlete} de ${conteoProductosFlete.total} productos afectables por flete`
                : `⚠ Ninguno de los ${conteoProductosFlete.total} productos tiene "Aplica flete"`}
            </Badge>
          )}
        </div>

        {/* Card principal */}
        <Card className={`${c.bg} ${c.border} border-2`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${c.text}`}>
              <Truck className="h-5 w-5" />
              Porcentaje de flete para productos de {titulo}
            </CardTitle>
            <CardDescription>
              Solo se aplica a productos de esta planta que tienen <strong>"Aplica flete"</strong> marcado. Los productos sin flete no se afectan.
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
                    <Label className="text-xs text-muted-foreground">% Actual</Label>
                    <div className={`text-3xl font-bold ${c.text} mt-1`}>{actualPct}%</div>
                  </div>
                  <div className="p-4 bg-white border rounded-md">
                    <Label htmlFor="nuevo-pct" className="text-xs text-muted-foreground">% Nuevo</Label>
                    <Input
                      id="nuevo-pct"
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={nuevoPct}
                      onChange={(e) => setNuevoPct(e.target.value)}
                      className="mt-1 text-3xl font-bold border-0 p-0 h-auto"
                    />
                  </div>
                </div>

                {/* Warning si cambia */}
                {Number(nuevoPct) !== actualPct && Number.isFinite(Number(nuevoPct)) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-md text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      Al guardar se va a recalcular automáticamente <code>valor_cdr_final</code> y
                      <code> monto_flete</code> de TODOS los productos de {titulo} que tienen <strong>"Aplica flete"</strong> en true.
                      No afecta productos sin flete ni a la otra planta.
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={cargarFleteActual} variant="outline" disabled={saving || loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recargar
                  </Button>
                  <Button
                    onClick={guardar}
                    disabled={saving || loading || Number(nuevoPct) === actualPct}
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

        {/* Info adicional */}
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Cómo se calcula el CDR final cuando un producto lleva flete:</strong>
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs font-mono">
{`CDR base       = Σ valor_cdr de ingredientes
CDR mantención = CDR base × (1 + % mantención del sector)
CDR final      = CDR mantención × (1 + % flete de la planta)`}
            </pre>
            <p>
              Si el producto tiene <code>lleva_flete = false</code>, su CDR final es igual al CDR con mantención (no se le suma flete).
            </p>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default ActualizarFlete;
