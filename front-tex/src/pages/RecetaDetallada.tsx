import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Save, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** ===== Tipos ===== */
type Receta = {
  codigo_producto: string;
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
  costo_ingrediente: number | null;
  costo_total: number | null;
  valor_cdr: number | null;
  ultima_actualizacion: string | null;
};

type EditState = {
  cantidad_ingrediente: string;
  editing: boolean;
};

/** ===== Componente ===== */
const RecetaDetallada: React.FC = () => {
  const token = Cookies.get("token");
  const { user } = useAuth();
  const { toast } = useToast();
  const [sp] = useSearchParams();
  const productId = sp.get("productId") || "";

  const [loading, setLoading] = useState(true);
  const [filas, setFilas] = useState<Receta[]>([]);
  const [editMap, setEditMap] = useState<Record<string, EditState>>({});
  const [nombres, setNombres] = useState<Record<string, string>>({}); // descripciones de códigos

  // Mapa de CDR breakdown por código (solo aplica si el ingrediente es producto)
  type CdrInfo = {
    base_cdr: number;
    base_cdr_final: number | null;
    monto_flete: number | null;
    valor_cdr_final: number | null;
  };
  const [cdrInfoMap, setCdrInfoMap] = useState<Record<string, CdrInfo>>({});

  const canEdit = user?.role === "admin";

  const keyFor = (r: Receta) =>
    `${r.codigo_producto}__${r.codigo_ingrediente}`;

  /** ===== Helpers nombres (batch) ===== */
  const resolverNombres = async (codigos: string[]): Promise<Record<string, string>> => {
    const unique = Array.from(new Set(codigos.filter(Boolean)));
    if (unique.length === 0) return {};

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referencias/nombres`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigos: unique }),
      });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  };

  /** ===== Data load ===== */
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1) Traer filas (por producto o todo)
      let data: Receta[] = [];
      if (productId) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/recetas-normalizada/por-producto/${encodeURIComponent(
            productId
          )}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Error al cargar receta del producto");
        data = await res.json();
      } else {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/recetas-normalizada`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Error al cargar recetas");
        data = await res.json();
      }
      setFilas(data);

      // 2) Reset ediciones
      const map: Record<string, EditState> = {};
      data.forEach((r) => {
        map[keyFor(r)] = {
          cantidad_ingrediente: String(r.cantidad_ingrediente ?? ""),
          editing: false,
        };
      });
      setEditMap(map);

      // 3) Resolver nombres (producto e ingredientes) con tu Autocomplete
      const codigos = Array.from(
        new Set<string>([
          ...data.map((r) => r.codigo_producto),
          ...data.map((r) => r.codigo_ingrediente),
        ])
      );
      const nombresMap = await resolverNombres(codigos);
      setNombres(nombresMap);

      // 4) Traer CDR de productos para mostrar breakdown cuando el ingrediente
      //    sea a su vez un producto. Trae todo y filtramos local.
      try {
        const resCdr = await fetch(
          `${import.meta.env.VITE_API_URL}/resultados-cdr`,
          { headers: { Authorization: `Bearer ${token || ""}` } },
        );
        if (resCdr.ok) {
          const rows: any[] = await resCdr.json();
          const m: Record<string, CdrInfo> = {};
          for (const r of rows) {
            m[r.codigo_producto] = {
              base_cdr:        Number(r.base_cdr ?? 0),
              base_cdr_final:  r.base_cdr_final  != null ? Number(r.base_cdr_final)  : null,
              monto_flete:     r.monto_flete     != null ? Number(r.monto_flete)     : null,
              valor_cdr_final: r.valor_cdr_final != null ? Number(r.valor_cdr_final) : null,
            };
          }
          setCdrInfoMap(m);
        }
      } catch { /* opcional */ }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudieron cargar datos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  /** ===== Editar / Eliminar ===== */
  const startEdit = (r: Receta) => {
    const k = keyFor(r);
    setEditMap((prev) => ({
      ...prev,
      [k]: { ...prev[k], editing: true },
    }));
  };

  const cancelEdit = (r: Receta) => {
    const k = keyFor(r);
    setEditMap((prev) => ({
      ...prev,
      [k]: {
        cantidad_ingrediente: String(
          filas.find((f) => keyFor(f) === k)?.cantidad_ingrediente ?? ""
        ),
        editing: false,
      },
    }));
  };

  const changeCantidad = (r: Receta, value: string) => {
    const k = keyFor(r);
    setEditMap((prev) => ({
      ...prev,
      [k]: { ...prev[k], cantidad_ingrediente: value },
    }));
  };

  const saveEdit = async (r: Receta) => {
    const k = keyFor(r);
    const cantidadStr = editMap[k]?.cantidad_ingrediente ?? "";
    const cantidad = Number(cantidadStr);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      toast({
        title: "Dato inválido",
        description: "La cantidad debe ser un número mayor a cero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${encodeURIComponent(
          r.codigo_producto
        )}/${encodeURIComponent(r.codigo_ingrediente)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cantidad_ingrediente: cantidad }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`No se pudo guardar: ${body}`);
      }

      toast({ title: "Guardado", description: "Fila actualizada." });

      setFilas((prev) =>
        prev.map((x) =>
          keyFor(x) === k ? { ...x, cantidad_ingrediente: cantidad } : x
        )
      );
      setEditMap((prev) => ({
        ...prev,
        [k]: { cantidad_ingrediente: String(cantidad), editing: false },
      }));
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo actualizar la fila.",
        variant: "destructive",
      });
    }
  };

  const deleteRow = async (r: Receta) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${encodeURIComponent(
          r.codigo_producto
        )}/${encodeURIComponent(r.codigo_ingrediente)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`No se pudo eliminar: ${body}`);
      }
      toast({ title: "Eliminado", description: "Fila eliminada." });
      setFilas((prev) => prev.filter((x) => keyFor(x) !== keyFor(r)));
      setEditMap((prev) => {
        const cp = { ...prev };
        delete cp[keyFor(r)];
        return cp;
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo eliminar la fila.",
        variant: "destructive",
      });
    }
  };

  /** ===== Render ===== */
  const titulo = productId
    ? `Estas viendo el producto con codigo: ${productId} `
    : "Receta detallada";

  const descDe = (codigo: string) => nombres[codigo] ?? "";

  return (
    <Layout title="Receta Detallada">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
            {productId ? (
              <p className="text-sm text-muted-foreground">
                Mostrando todas las filas de <b>recetas_normalizada</b> para el
                producto <b>{productId}</b>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mostrando todas las filas de <b>recetas_normalizada</b>.
              </p>
            )}
          </div>

          <Button onClick={() => window.location.assign("/cargarReceta")}>
            Cargar receta
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Descr. Prod</TableHead>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Descr. Ing</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Ing.</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Valor CDR</TableHead>
                    <TableHead className="text-right">CDR simple (ing)</TableHead>
                    <TableHead className="text-right">Mantención (ing)</TableHead>
                    <TableHead className="text-right">Flete (ing)</TableHead>
                    <TableHead className="text-right">CDR final (ing)</TableHead>
                    <TableHead>Actualización</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((r) => {
                    const k = keyFor(r);
                    const state = editMap[k] || {
                      cantidad_ingrediente: String(r.cantidad_ingrediente ?? ""),
                      editing: false,
                    };
                    const red =
                      r.costo_total === 0 ||
                      r.costo_total === null ||
                      r.cantidad_ingrediente <= 0;

                    return (
                      <TableRow
                        key={k}
                        className={
                          red
                            ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50"
                            : "bg-white hover:bg-muted/30 dark:bg-card dark:hover:bg-muted/30"
                        }
                      >
                        {/* Producto */}
                        <TableCell className="font-medium">
                          {r.codigo_producto}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {descDe(r.codigo_producto) || "—"}
                        </TableCell>

                        {/* Ingrediente */}
                        <TableCell>{r.codigo_ingrediente}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {descDe(r.codigo_ingrediente) || "—"}
                        </TableCell>

                        {/* Cantidad (editable) */}
                        <TableCell className="w-[160px]">
                          {state.editing ? (
                            <Input
                              value={state.cantidad_ingrediente}
                              onChange={(e) => changeCantidad(r, e.target.value)}
                              type="number"
                              step="any"
                            />
                          ) : (
                            r.cantidad_ingrediente
                          )}
                        </TableCell>

                        {/* Otros */}
                        <TableCell>{r.costo_ingrediente ?? "-"}</TableCell>
                        <TableCell>{r.costo_total ?? "-"}</TableCell>
                        <TableCell>{r.valor_cdr ?? "-"}</TableCell>

                        {/* Breakdown por ingrediente — contribución al CDR del producto.
                            - Si el ingrediente es a su vez un producto (sub-receta):
                              CDR simple = cantidad × producto.base_cdr (lo que el trigger toma hoy)
                              Mantención = cantidad × (base_cdr_final - base_cdr) del producto
                              Flete      = cantidad × producto.monto_flete
                              CDR final  = suma de los 3 (lo que SERÍA si el trigger usara valor_cdr_final)
                            - Si el ingrediente es insumo/MO/energía (cost unitario plano):
                              CDR simple = valor_cdr (ya computado)
                              Mantención = 0, Flete = 0
                              CDR final  = valor_cdr (no aporta extra a la receta) */}
                        {(() => {
                          const cantidad = Number(r.cantidad_ingrediente ?? 0);
                          const valorCdr = Number(r.valor_cdr ?? 0);
                          const info = cdrInfoMap[r.codigo_ingrediente];
                          const fmt = (n: number | null | undefined) =>
                            n == null || Number.isNaN(Number(n))
                              ? '-'
                              : Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

                          if (!info) {
                            // Insumo / MO / energía: solo CDR simple = valor_cdr, sin mantención ni flete
                            return (
                              <>
                                <TableCell className="text-right font-mono text-xs">{fmt(valorCdr)}</TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">0,00</TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">0,00</TableCell>
                                <TableCell className="text-right font-mono text-xs font-semibold">{fmt(valorCdr)}</TableCell>
                              </>
                            );
                          }

                          // Sub-receta (ingrediente que es producto): cantidad × breakdown del producto
                          const baseCdr      = info.base_cdr ?? 0;
                          const finalSinFlete = info.base_cdr_final ?? baseCdr;
                          const mantencionUnit = finalSinFlete - baseCdr;
                          const fleteUnit     = info.monto_flete ?? 0;
                          const cdrSimple    = cantidad * baseCdr;
                          const mantencion   = cantidad * mantencionUnit;
                          const flete        = cantidad * fleteUnit;
                          const cdrFinal     = cdrSimple + mantencion + flete;

                          return (
                            <>
                              <TableCell className="text-right font-mono text-xs">{fmt(cdrSimple)}</TableCell>
                              <TableCell className="text-right font-mono text-xs">{fmt(mantencion)}</TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {flete > 0 ? fmt(flete) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs font-semibold">{fmt(cdrFinal)}</TableCell>
                            </>
                          );
                        })()}

                        <TableCell>
                          {r.ultima_actualizacion
                            ? new Date(r.ultima_actualizacion).toLocaleString()
                            : "-"}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell>
                          {!state.editing ? (
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(r)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                                </Button>
                              )}
                              {canEdit && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-300"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Eliminar
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Eliminar fila</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Eliminás la fila del ingrediente{" "}
                                        <b>{r.codigo_ingrediente}</b> del producto{" "}
                                        <b>{r.codigo_producto}</b>. ¿Continuar?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteRow(r)}>
                                        Sí, eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => saveEdit(r)}>
                                <Save className="w-4 h-4 mr-1" />
                                Guardar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => cancelEdit(r)}>
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecetaDetallada;
