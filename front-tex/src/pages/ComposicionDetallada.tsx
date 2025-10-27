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
const ComposicionDetallada: React.FC = () => {
  const token = Cookies.get("token");
  const { user } = useAuth();
  const { toast } = useToast();
  const [sp] = useSearchParams();
  const productId = sp.get("productId") || "";

  const [loading, setLoading] = useState(true);
  const [filas, setFilas] = useState<Receta[]>([]);
  const [editMap, setEditMap] = useState<Record<string, EditState>>({});
  const [nombres, setNombres] = useState<Record<string, string>>({}); // descripciones de códigos

  const canEdit = user?.role === "admin";

  const keyFor = (r: Receta) =>
    `${r.codigo_producto}__${r.codigo_ingrediente}`;

  /** ===== Helpers nombres (Autocomplete) ===== */
  // Extrae un nombre válido desde la respuesta del autocomplete
  const pickNombre = (raw: any): string | null => {
    if (!raw) return null;
    if (typeof raw === "string") {
      const s = raw.trim();
      return s.length ? s : null;
    }
    if (typeof raw === "object") {
      const candidates = [
        raw.nombre,
        raw.descripcion_producto,
        raw.detalle,
        raw.descripcion,
        raw.label,
        raw.text,
        raw.texto,
        raw.descripcionProducto,
        raw.titulo,
      ].filter(Boolean);
      if (candidates.length) {
        const first = String(candidates[0]).trim();
        return first.length ? first : null;
      }
    }
    return null;
  };

  // Usa TU endpoint existente: GET /api/autocomplete/ingrediente/:codigo
  const fetchNombrePorCodigo = async (codigo: string): Promise<string | null> => {
    if (!codigo) return null;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/autocomplete/ingrediente/${encodeURIComponent(codigo)}`,
        { headers: { Authorization: `Bearer ${token || ""}` } }
      );
      if (res.ok) {
        const data = await res.json();
        return pickNombre(data);
      }
    } catch {
      // noop
    }
    return null;
  };

  // Resuelve muchos códigos con pequeñas tandas para no saturar
  const resolverNombres = async (codigos: string[]): Promise<Record<string, string>> => {
    const unique = Array.from(new Set(codigos.filter(Boolean)));
    const result: Record<string, string> = {};
    if (unique.length === 0) return result;

    const CHUNK = 20;
    for (let i = 0; i < unique.length; i += CHUNK) {
      const slice = unique.slice(i, i + CHUNK);
      const batch = await Promise.all(
        slice.map(async (c) => {
          const nombre = await fetchNombrePorCodigo(c);
          return [c, nombre] as const;
        })
      );
      batch.forEach(([c, nombre]) => {
        if (nombre) result[c] = nombre;
      });
    }
    return result;
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
    ? `Composición detallada — ${productId}`
    : "Composición detallada";

  const descDe = (codigo: string) => nombres[codigo] ?? "";

  return (
    <Layout title="Composicion Detallada">
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

          <Button onClick={() => window.location.assign("/cargarComposicion")}>
            Cargar composición
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
                            ? "bg-red-50 hover:bg-red-100"
                            : "bg-white hover:bg-muted/30"
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

export default ComposicionDetallada;
