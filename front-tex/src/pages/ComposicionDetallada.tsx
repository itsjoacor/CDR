// ComposicionDetallada.tsx — highlight por ingrediente con cantidad 0 (plug & play)

import React, { useEffect, useState, Fragment, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import Cookies from "js-cookie";

const RecetasDetalladas: React.FC = () => {
  interface RecetaNormalizada {
    codigo_producto: string;
    codigo_ingrediente: string;
    cantidad_ingrediente: number;
    costo_ingrediente: number | null;
    costo_total: number | null;
    valor_cdr: number | null;
    ultima_actualizacion: string | null;
  }

  interface Producto {
    codigo_producto: string;
    descripcion_producto: string;
    sector_productivo: string;
  }

  const token = Cookies.get("token");
  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas, setRecetas] = useState<RecetaNormalizada[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<{ codigo_producto: string; codigo_ingrediente: string } | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecetaNormalizada>>({});
  const canEdit = user?.role === "admin";
  const navigate = useNavigate();

  // 🔴 Highlight: fila roja cuando la cantidad del ingrediente es 0
  const isZeroQty = (r: RecetaNormalizada) => Number(r?.cantidad_ingrediente ?? 0) === 0;
  const rowClass = (r: RecetaNormalizada) => (isZeroQty(r) ? "bg-red-50 hover:bg-red-100" : "");
  const qtyTextClass = (r: RecetaNormalizada) => (isZeroQty(r) ? "text-red-700 font-medium" : "");

  // Re-fetch de recetas para refrescar cálculos automáticos
  const cargarRecetas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas-normalizada`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecetas(data);

      const urlParams = new URLSearchParams(window.location.search);
      const productIdParam = urlParams.get("productId");
      if (productIdParam) setProductoSeleccionado(productIdParam);
    } catch {
      toast({
        title: "Error",
        description: "No se pudieron cargar las recetas desde el servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/productos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: Producto[] = await res.json();
        setProductos(data);
        setSectores([...new Set(data.map((p) => p.sector_productivo))]);
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      }
    };

    cargarRecetas();
    fetchProductos();
  }, [cargarRecetas, token, toast]);

  const filtered = recetas.filter((r) => {
    const matchProducto = productoSeleccionado ? r.codigo_producto === productoSeleccionado : true;
    const matchSector = sectorSeleccionado
      ? productos.find((p) => p.codigo_producto === r.codigo_producto)?.sector_productivo === sectorSeleccionado
      : true;
    return matchProducto && matchSector;
  });

  // Al abrir edición: el campo de cantidad queda VACÍO (sin valor por defecto)
  const handleEdit = (item: RecetaNormalizada) => {
    setEditingId({
      codigo_producto: item.codigo_producto,
      codigo_ingrediente: item.codigo_ingrediente,
    });
    setEditForm({
      ...item,
      cantidad_ingrediente: undefined, // input vacío
    } as Partial<RecetaNormalizada>);
  };

  const handleSave = async () => {
    if (
      !editingId ||
      editForm.cantidad_ingrediente === undefined ||
      editForm.cantidad_ingrediente === null ||
      Number.isNaN(editForm.cantidad_ingrediente as number)
    ) {
      toast({
        title: "Error",
        description: "Por favor ingresá una cantidad válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${editingId.codigo_producto}/${editingId.codigo_ingrediente}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cantidad_ingrediente: editForm.cantidad_ingrediente,
          }),
        }
      );

      const text = await response.text();
      if (!response.ok) throw new Error(`Error al guardar: ${text}`);

      toast({
        title: "Guardado exitoso",
        description: "Los cambios se han guardado correctamente.",
      });

      // Cierro editor y limpio
      setEditingId(null);
      setEditForm({});

      // Re-fetch para traer cálculos automáticos actualizados
      await cargarRecetas();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (codigo_producto: string, codigo_ingrediente: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${codigo_producto}/${codigo_ingrediente}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      await cargarRecetas();

      toast({
        title: "Eliminado",
        description: `La receta fue eliminada correctamente.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la receta. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Composición detallada">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-pink-50">
              🍲 Composición - Estructura de Costos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Detalle de insumos utilizados por producto
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate(`/cargarComposicion`)}>
                ➕ Agregar Componente
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            {/* Producto */}
            <div className="flex-1">
              <Listbox value={productoSeleccionado} onChange={setProductoSeleccionado}>
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-purple-300 flex items-center justify-between">
                    {productoSeleccionado || "Filtrar por producto"}
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-purple-100 text-purple-800" : ""}`}>
                          Todos los productos
                        </li>
                      )}
                    </ListboxOption>
                    {productos.map((p, i) => (
                      <ListboxOption key={i} value={p.codigo_producto} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${
                              active ? "bg-purple-100 text-purple-800" : "text-gray-800"
                            } ${selected ? "font-medium" : ""}`}
                          >
                            {p.codigo_producto} - {p.descripcion_producto}
                          </li>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Sector */}
            <div className="flex-1">
              <Listbox value={sectorSeleccionado} onChange={setSectorSeleccionado}>
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-yellow-300 flex items-center justify-between">
                    {sectorSeleccionado || "Filtrar por sector"}
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-yellow-100 text-yellow-800" : ""}`}>
                          Todos los sectores
                        </li>
                      )}
                    </ListboxOption>
                    {sectores.map((s, i) => (
                      <ListboxOption key={i} value={s} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${
                              active ? "bg-yellow-100 text-yellow-800" : "text-gray-800"
                            } ${selected ? "font-medium" : ""}`}
                          >
                            {s}
                          </li>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Composición</CardTitle>
            <CardDescription>Incluye cantidades, costos y valor CDR</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando recetas...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>CDR</TableHead>
                    <TableHead>Últ. Modif.</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <Fragment key={`${r.codigo_producto}-${r.codigo_ingrediente}`}>
                      {/* Fila de visualización con highlight si cantidad = 0 */}
                      <TableRow className={rowClass(r)}>
                        <TableCell className="font-mono">{r.codigo_producto}</TableCell>
                        <TableCell className="font-mono">{r.codigo_ingrediente}</TableCell>
                        <TableCell className={qtyTextClass(r)}>{r.cantidad_ingrediente}</TableCell>
                        <TableCell className="font-mono text-green-700">
                          {r.costo_ingrediente != null ? `$${r.costo_ingrediente.toLocaleString("es-CO")}` : "—"}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-black">
                          {r.costo_total != null ? `$${r.costo_total.toLocaleString("es-CO")}` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-orange-600 font-semibold">
                          {r.valor_cdr != null ? `$${r.valor_cdr.toLocaleString("es-CO")}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.ultima_actualizacion ? new Date(r.ultima_actualizacion).toLocaleDateString() : "—"}
                        </TableCell>

                        {canEdit && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(r)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará permanentemente la receta del producto "{r.codigo_producto}" con
                                      ingrediente "{r.codigo_ingrediente}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(r.codigo_producto, r.codigo_ingrediente)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Fila de edición (mantiene tu estructura y colSpan original) */}
                      {editingId?.codigo_producto === r.codigo_producto &&
                        editingId?.codigo_ingrediente === r.codigo_ingrediente && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={canEdit ? 8 : 7}>
                              <Card className="w-full">
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Editando: {r.codigo_producto} - {r.codigo_ingrediente}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <Label htmlFor="cantidad">Cantidad del Ingrediente</Label>
                                      <Input
                                        id="cantidad"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Ingresar cantidad…"
                                        value={
                                          editForm.cantidad_ingrediente === undefined || editForm.cantidad_ingrediente === null
                                            ? ""
                                            : String(editForm.cantidad_ingrediente)
                                        }
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(",", ".");
                                          const parsed = raw === "" ? undefined : Number(raw);
                                          setEditForm((prev) => ({
                                            ...prev,
                                            cantidad_ingrediente: raw === "" || Number.isNaN(parsed) ? undefined : parsed,
                                          }));
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-6 flex items-center gap-2">
                                    <Button onClick={handleSave}>Guardar</Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </TableCell>
                          </TableRow>
                        )}
                    </Fragment>
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

export default RecetasDetalladas;
