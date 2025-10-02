// src/pages/ActualizarMantencion.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, Database } from 'lucide-react';
import Cookies from 'js-cookie';

type Sector = {
  nombre: string;
  porcentaje_mantencion: number | null;
};

export default function ActualizacionMantencion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = Cookies.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, string>>({}); // nombre -> texto

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  useEffect(() => {
    fetchSectores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSectores() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/sectores-productivos/mantencion`,
        { headers }
      );
      if (!response.ok) throw await buildError(response, 'No se pudo cargar la lista');
      const data: Sector[] = await response.json();
      setSectores(data);

      const next: Record<string, string> = {};
      for (const s of data) next[s.nombre] = String(s.porcentaje_mantencion ?? 1);
      setEditing(next);
    } catch (err) {
      toast({ title: 'Error', description: getMsg(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function onChangeValor(nombre: string, text: string) {
    if (text === '' || /^[0-9]{0,3}$/.test(text)) {
      setEditing((prev) => ({ ...prev, [nombre]: text }));
    }
  }

  function onBlurNormalizar(nombre: string, actual: number) {
    const raw = editing[nombre];
    const n = raw === '' ? NaN : Number(raw);
    if (!Number.isFinite(n)) {
      setEditing((p) => ({ ...p, [nombre]: String(actual) }));
    } else {
      const clamped = Math.min(100, Math.max(0, Math.round(n)));
      setEditing((p) => ({ ...p, [nombre]: String(clamped) }));
    }
  }

  async function saveOne(nombre: string) {
    const current = sectores.find((s) => s.nombre === nombre);
    const raw = editing[nombre];
    const base = current?.porcentaje_mantencion ?? 1;
    const candidate = raw === '' ? NaN : Number(raw);
    const valor = Number.isFinite(candidate) ? Math.round(candidate) : base;

    if (!(valor >= 0 && valor <= 100)) {
      toast({
        title: 'Dato inválido',
        description: 'Ingresá un entero entre 0 y 100',
        variant: 'destructive',
      });
      return;
    }

    setSaving((p) => ({ ...p, [nombre]: true }));
    try {
      const url = `${import.meta.env.VITE_API_URL}/sectores-productivos/${encodeURIComponent(
        nombre
      )}/porcentaje-mantencion-v2`;

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ porcentajeMantencion: valor }),
      });
      if (!response.ok) throw await buildError(response, 'No se pudo actualizar');

      await response.json();

      setSectores((prev) =>
        prev.map((s) =>
          s.nombre === nombre ? { ...s, porcentaje_mantencion: valor } : s
        )
      );
      setEditing((p) => ({ ...p, [nombre]: String(valor) }));

      toast({
        title: 'Actualización exitosa',
        description: `Se actualizó ${nombre} a ${valor}%`,
      });
    } catch (err) {
      toast({ title: 'Error al guardar', description: getMsg(err), variant: 'destructive' });
    } finally {
      setSaving((p) => ({ ...p, [nombre]: false }));
    }
  }

  const list = useMemo(() => sectores, [sectores]);

  return (
    <Layout title="Actualizar Mantención por Sector">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <Button variant="ghost" onClick={fetchSectores} disabled={loading} className="flex items-center space-x-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar Porcentaje de Mantención por Sector</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-end gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                      <div className="h-9 w-32 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-9 w-28 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay sectores cargados.</div>
            ) : (
              <div className="space-y-6">
                {list.map((s) => {
                  const actual = typeof s.porcentaje_mantencion === 'number' ? s.porcentaje_mantencion : 1;
                  const text = editing[s.nombre] ?? String(actual);
                  const isSaving = !!saving[s.nombre];

                  return (
                    <div key={s.nombre} className="flex items-end gap-4 p-4 border rounded-lg bg-card">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`sector-${s.nombre}`} className="font-medium">
                            {s.nombre}
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Actual</span>
                            <Badge variant="outline" className="font-mono">
                              {actual}%
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id={`sector-${s.nombre}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={text}
                            onChange={(e) => onChangeValor(s.nombre, e.target.value)}
                            onBlur={() => onBlurNormalizar(s.nombre, actual)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>

                      <Button onClick={() => saveOne(s.nombre)} size="sm" disabled={isSaving} className="min-w-28">
                        {isSaving ? (
                          <>
                            <Database className="h-4 w-4 animate-pulse mr-2" />
                            Guardando…
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

/* ========= helpers ========= */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function buildError(res: Response, fallback: string) {
  const j = await safeJson(res);
  const msg = j?.message
    ? Array.isArray(j.message)
      ? j.message.join(', ')
      : String(j.message)
    : `${fallback} (HTTP ${res.status})`;
  return new Error(msg);
}

function getMsg(err: unknown) {
  return err instanceof Error ? err.message : 'Ocurrió un error';
}
