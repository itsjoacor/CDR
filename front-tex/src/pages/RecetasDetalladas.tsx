import React, { useEffect, useState, Fragment } from "react";
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
import { Edit, Trash2, Save, X, Cookie } from "lucide-react";
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
import Cookies from 'js-cookie';


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
  const token = Cookies.get('token');
  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas, setRecetas] = useState<RecetaNormalizada[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<
    string | null
  >(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<{
    codigo_producto: string;
    codigo_ingrediente: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecetaNormalizada>>({});
  const canEdit = user?.role === "admin";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/recetas-normalizada`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setRecetas(data);

        const urlParams = new URLSearchParams(window.location.search);
        const productIdParam = urlParams.get("productId"); // Changed from "producto" to "productId"

        if (productIdParam) {
          setProductoSeleccionado(productIdParam);
        }
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar las recetas desde el servidor",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchProductos = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/productos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
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

    fetchRecetas();
    fetchProductos();
  }, []);

  const filtered = recetas.filter((r) => {
    const matchProducto = productoSeleccionado
      ? r.codigo_producto === productoSeleccionado
      : true;
    const matchSector = sectorSeleccionado
      ? productos.find((p) => p.codigo_producto === r.codigo_producto)
        ?.sector_productivo === sectorSeleccionado
      : true;
    return matchProducto && matchSector;
  });


  const handleEdit = (item: RecetaNormalizada) => {
    setEditingId({
      codigo_producto: item.codigo_producto,
      codigo_ingrediente: item.codigo_ingrediente,
    });
    setEditForm(item);
  };

  const handleSave = async () => {
    if (!editingId || !editForm.cantidad_ingrediente) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${editingId.codigo_producto
        }/${editingId.codigo_ingrediente}`,
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

      const updated = JSON.parse(text);

      setRecetas((prev) =>
        prev.map((item) =>
          item.codigo_producto === editingId.codigo_producto &&
            item.codigo_ingrediente === editingId.codigo_ingrediente
            ? { ...item, ...updated }
            : item
        )
      );

      toast({
        title: "Guardado exitoso",
        description: "Los cambios se han guardado correctamente.",
      });

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description:
          "No se pudo guardar los cambios. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (
    codigo_producto: string,
    codigo_ingrediente: string
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL
        }/recetas-normalizada/${codigo_producto}/${codigo_ingrediente}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error();

      setRecetas((prev) =>
        prev.filter(
          (r) =>
            !(
              r.codigo_producto === codigo_producto &&
              r.codigo_ingrediente === codigo_ingrediente
            )
        )
      );

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
    <Layout title="Recetas Detalladas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-pink-50">
              🍲 Recetas Normalizadas - Estructura de Costos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Detalle de insumos utilizados por producto
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate(`/cargarReceta`)}>
                ➕ Agregar Receta
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            {/* Producto */}
            <div className="flex-1">
              <Listbox
                value={productoSeleccionado}
                onChange={setProductoSeleccionado}
              >
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-purple-300 flex items-center justify-between">
                    {productoSeleccionado || "Filtrar por producto"}
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li
                          className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-purple-100 text-purple-800" : ""
                            }`}
                        >
                          Todos los productos
                        </li>
                      )}
                    </ListboxOption>
                    {productos.map((p, i) => (
                      <ListboxOption
                        key={i}
                        value={p.codigo_producto}
                        as={Fragment}
                      >
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active
                              ? "bg-purple-100 text-purple-800"
                              : "text-gray-800"
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
              <Listbox
                value={sectorSeleccionado}
                onChange={setSectorSeleccionado}
              >
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-yellow-300 flex items-center justify-between">
                    {sectorSeleccionado || "Filtrar por sector"}
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li
                          className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-yellow-100 text-yellow-800" : ""
                            }`}
                        >
                          Todos los sectores
                        </li>
                      )}
                    </ListboxOption>
                    {sectores.map((s, i) => (
                      <ListboxOption key={i} value={s} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active
                              ? "bg-yellow-100 text-yellow-800"
                              : "text-gray-800"
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
            <CardTitle>Recetas Normalizadas</CardTitle>
            <CardDescription>
              Incluye cantidades, costos y valor CDR
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Cargando recetas...
              </p>
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
                    <Fragment
                      key={`${r.codigo_producto}-${r.codigo_ingrediente}`}
                    >
                      <TableRow>
                        <TableCell className="font-mono">
                          {r.codigo_producto}
                        </TableCell>
                        <TableCell className="font-mono">
                          {r.codigo_ingrediente}
                        </TableCell>
                        <TableCell>{r.cantidad_ingrediente}</TableCell>
                        <TableCell className="font-mono text-green-700">
                          ${r.costo_ingrediente?.toLocaleString("es-CO") ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-black">
                          ${r.costo_total?.toLocaleString("es-CO") ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-orange-600 font-semibold">
                          ${r.valor_cdr?.toLocaleString("es-CO") ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.ultima_actualizacion
                            ? new Date(
                              r.ultima_actualizacion
                            ).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(r)}
                              >
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
                                    <AlertDialogTitle>
                                      ¿Estás seguro?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará permanentemente la receta del
                                      producto "{r.codigo_producto}" con
                                      ingrediente "{r.codigo_ingrediente}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDelete(
                                          r.codigo_producto,
                                          r.codigo_ingrediente
                                        )
                                      }
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {editingId?.codigo_producto === r.codigo_producto &&
                        editingId?.codigo_ingrediente ===
                        r.codigo_ingrediente && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={canEdit ? 8 : 7}>
                              <Card className="w-full">
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Editando: {r.codigo_producto} -{" "}
                                    {r.codigo_ingrediente}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <Label htmlFor="cantidad">
                                        Cantidad del Ingrediente
                                      </Label>
                                      <Input
                                        id="cantidad"
                                        type="number"
                                        value={
                                          editForm.cantidad_ingrediente || ""
                                        }
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            cantidad_ingrediente: Number(
                                              e.target.value
                                            ),
                                          }))
                                        }
                                        placeholder="Cantidad"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-4 space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleSave}
                                    >
                                      <Save className="h-4 w-4 mr-1" /> Guardar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancel}
                                    >
                                      <X className="h-4 w-4 mr-1" /> Cancelar
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

        {/* Info */}
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="p-4 text-pink-800 text-sm">
            💡 Cada vez que se modifica una receta, el sistema recalcula
            automáticamente los costos y el valor CDR gracias a los triggers
            configurados en la base de datos.
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecetasDetalladas;
