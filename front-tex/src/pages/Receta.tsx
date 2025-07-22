import React, { useState, useEffect, Fragment } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Save, X, Search, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

import { Plus, BarChart3 } from "lucide-react";
import Cookies from 'js-cookie';
import { Skeleton } from "@/components/ui/skeleton";



interface RecetaItem {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  ingredientes: {
    codigo_ingrediente: string;
    descripcion_ingrediente: string;
    cantidad_ingrediente: number;
    costo_ingrediente?: number;
  }[];
  costo_mano_obra?: number;
  costo_matriz_energetica?: number;
  costo_total?: number;
  fecha_creacion: string;
}

const Receta: React.FC = () => {
  const token = Cookies.get('token');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recetas, setRecetas] = useState<RecetaItem[]>([]);
  const [productosLista, setProductosLista] = useState<any[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cdrValues, setCdrValues] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecetaItem>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<
    string | null
  >(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canEdit = user?.role === "admin";

  // Helper function to check if all ingredients have valid costs
  const hasValidIngredientCosts = (receta: RecetaItem): boolean => {
    if (!receta.ingredientes || receta.ingredientes.length === 0) return false;
    return receta.ingredientes.every(
      (ing) =>
        ing.costo_ingrediente !== null &&
        ing.costo_ingrediente !== undefined &&
        ing.costo_ingrediente > 0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch productos first to get sectors and product list
        const productosResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/productos`
        );
        if (!productosResponse.ok)
          throw new Error("Error al obtener productos");
        const productosData = await productosResponse.json();

        // Extract unique sectors
        const sectoresUnicos = [
          ...new Set(productosData.map((p: any) => p.sector_productivo)),
        ] as string[];
        setSectores(sectoresUnicos);
        setProductosLista(productosData);

        const recetasResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/recetas-normalizada`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!recetasResponse.ok) throw new Error("Error al obtener recetas");
        const recetasData = await recetasResponse.json();

        const recetasGrouped: Record<string, RecetaItem> = {};

        for (const item of recetasData) {
          if (!recetasGrouped[item.codigo_producto]) {
            const prod = productosData.find(
              (p: any) =>
                p.codigo_producto?.toString().trim().toLowerCase() ===
                item.codigo_producto?.toString().trim().toLowerCase()
            );

            recetasGrouped[item.codigo_producto] = {
              codigo_producto: item.codigo_producto,
              descripcion_producto:
                prod?.descripcion_producto || "Producto no encontrado",
              sector_productivo: prod?.sector_productivo || "Desconocido",
              ingredientes: [],
              costo_mano_obra: item.costo_mano_obra,
              costo_matriz_energetica: item.costo_matriz_energetica,
              costo_total: item.costo_total,
              fecha_creacion:
                item.fecha_creacion || new Date().toISOString().split("T")[0],
            };
          }

          recetasGrouped[item.codigo_producto].ingredientes.push({
            codigo_ingrediente: item.codigo_ingrediente,
            descripcion_ingrediente: item.descripcion_ingrediente,
            cantidad_ingrediente: item.cantidad_ingrediente,
            costo_ingrediente: item.costo_ingrediente,
          });
        }

        const recetasArray = Object.values(recetasGrouped);
        setRecetas(recetasArray);

        const cdrMap: Record<string, number> = {};
        await Promise.all(
          recetasArray.map(async (receta) => {
            try {
              const cdrRes = await fetch(
                `${import.meta.env.VITE_API_URL}/resultados-cdr/${receta.codigo_producto
                }/base`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (!cdrRes.ok) return;
              const cdrData = await cdrRes.json();
              cdrMap[receta.codigo_producto] = cdrData.base_cdr || 0;
            } catch (_) {
              cdrMap[receta.codigo_producto] = 0;
            }
          })
        );

        setCdrValues(cdrMap);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Fallo en la carga de datos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecetas = recetas.filter((receta) => {
    const matchesSearch =
      receta.descripcion_producto
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      receta.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProducto = productoSeleccionado
      ? receta.codigo_producto === productoSeleccionado
      : true;
    const matchesSector = sectorSeleccionado
      ? receta.sector_productivo === sectorSeleccionado
      : true;
    return matchesSearch && matchesProducto && matchesSector;
  });

  const totalPages = Math.ceil(filteredRecetas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecetas = filteredRecetas.slice(
    startIndex,
    startIndex + itemsPerPage
  );


  const handleEdit = (receta: RecetaItem) => {
    navigate(`/detalle-recetas?productId=${receta.codigo_producto}`);
  };
  const handleView = (receta: RecetaItem) => {
    navigate(`/detalle-recetas?productId=${receta.codigo_producto}`);
  };

  const handleSave = () => {
    if (!editForm.descripcion_producto) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    setRecetas((prev) =>
      prev.map((item) =>
        item.codigo_producto === editingId
          ? ({ ...item, ...editForm } as RecetaItem)
          : item
      )
    );

    toast({
      title: "Guardado exitoso",
      description: "Los cambios se han guardado correctamente.",
    });

    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (
    codigo_producto: string,
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL
        }/recetas-normalizada/${codigo_producto}`,
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
              r.codigo_producto === codigo_producto
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

  const handleNewReceta = () => {
    navigate("/cargarReceta");
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "Confección":
        return "bg-blue-100 text-blue-800";
      case "Textil":
        return "bg-green-100 text-green-800";
      case "Marroquinería":
        return "bg-purple-100 text-purple-800";
      case "Calzado":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Replace the current loading state in Receta.tsx with this:

  // Replace the current loading state in Receta.tsx with this:


  return (
    <Layout title="Gestión de Recetas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50">
              📋 Recetas - Corazón del cálculo CDR
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Define materiales, cantidades, mano de obra y energía necesarios
              para fabricar productos
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button
                onClick={handleNewReceta}
                className="bg-green-100 text-green-900 hover:bg-green-200 border border-green-300"
              >
                <Plus className="w-4 h-4 mr-2 text-emerald-600" />
                Nueva Receta
              </Button>

            )}
            <Button
              onClick={() => {
                if (productoSeleccionado) {
                  navigate(`/detalle-recetas?productId=${productoSeleccionado}`);
                } else {
                  navigate("/detalle-recetas");
                }
              }}
              variant="outline"
              className="border text-black"
            >
              <BarChart3 className="w-4 h-4 mr-2 text-[#6c63ff]" />
              Ver Detallado
            </Button>
          </div>

        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            {/* Filtro por Producto */}
            <div className="flex-1">
              <Listbox
                value={productoSeleccionado}
                onChange={setProductoSeleccionado}
              >
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-blue-300 flex items-center justify-between">
                    {productoSeleccionado
                      ? productosLista.find(
                        (p) => p.codigo_producto === productoSeleccionado
                      )?.descripcion_producto || productoSeleccionado
                      : "Filtrar por producto"}
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
                          className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-blue-100 text-blue-800" : ""
                            }`}
                        >
                          Todos los productos
                        </li>
                      )}
                    </ListboxOption>
                    {productosLista.map((p, i) => (
                      <ListboxOption
                        key={i}
                        value={p.codigo_producto}
                        as={Fragment}
                      >
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active
                              ? "bg-blue-100 text-blue-800"
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

            {/* Filtro por Sector */}
            <div className="flex-1">
              <Listbox
                value={sectorSeleccionado}
                onChange={setSectorSeleccionado}
              >
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-green-300 flex items-center justify-between">
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
                          className={`px-4 py-2 cursor-pointer rounded ${active ? "bg-green-100 text-green-800" : ""
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
                              ? "bg-green-100 text-green-800"
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lista de Recetas</CardTitle>
                <CardDescription>
                  Mostrando {paginatedRecetas.length} de{" "}
                  {filteredRecetas.length} recetas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>CDR</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecetas.map((receta) => (
                      <React.Fragment key={receta.codigo_producto}>
                        <TableRow
                          className={
                            editingId === receta.codigo_producto
                              ? "bg-blue-50"
                              : hasValidIngredientCosts(receta)
                                ? "bg-green-50 hover:bg-green-100"
                                : "bg-red-50 hover:bg-red-100"
                          }
                        >
                          <TableCell className="font-medium">
                            {receta.codigo_producto}
                          </TableCell>
                          <TableCell>
                            {editingId === receta.codigo_producto ? (
                              <Input
                                value={editForm.descripcion_producto || ""}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    descripcion_producto: e.target.value,
                                  }))
                                }
                                className="min-w-[250px]"
                              />
                            ) : (
                              <div className="max-w-[250px] truncate">
                                {receta.descripcion_producto}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getSectorColor(receta.sector_productivo)}
                            >
                              {receta.sector_productivo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              $
                              {cdrValues[receta.codigo_producto]?.toFixed(2) ||
                                "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {receta.fecha_creacion}
                          </TableCell>
                          <TableCell className="text-center">
                            {canEdit ? (
                              <div className="flex space-x-2 justify-center">
                                {editingId === receta.codigo_producto ? (
                                  <>
                                    <Button variant="outline" size="sm" onClick={handleSave}>
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(receta)}>
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
                                            Esta acción no se puede deshacer. Se eliminará permanentemente la receta "{receta.descripcion_producto}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(receta.codigo_producto)}>
                                            Eliminar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <Button variant="outline" size="sm" onClick={() => handleView(receta)}>
                                  <Search className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>

                        {editingId === receta.codigo_producto && (
                          <TableRow className="bg-blue-50">
                            <TableCell colSpan={canEdit ? 7 : 6}>
                              <div className="p-4 space-y-4">
                                <div className="grid md:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-blue-700">
                                      COSTOS
                                    </h4>
                                    <div className="space-y-1">
                                      <div className="text-xs">
                                        💰 Mano de obra: $
                                        {receta.costo_mano_obra?.toFixed(2) ||
                                          "0.00"}
                                      </div>
                                      <div className="text-xs">
                                        ⚡ Matriz energética: $
                                        {receta.costo_matriz_energetica?.toFixed(
                                          2
                                        ) || "0.00"}
                                      </div>
                                      <div className="text-xs font-semibold">
                                        🏷️ Total: $
                                        {receta.costo_total?.toFixed(2) || "0.00"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-blue-700">
                                      INGREDIENTES
                                    </h4>
                                    <div className="space-y-1">
                                      {receta.ingredientes.map(
                                        (ingrediente, index) => (
                                          <div key={index} className="text-xs">
                                            📦{" "}
                                            {ingrediente.descripcion_ingrediente}:{" "}
                                            {ingrediente.cantidad_ingrediente} ($
                                            {ingrediente.costo_ingrediente?.toFixed(
                                              2
                                            ) || "0.00"}
                                            )
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </Layout>
  );
};

export default Receta;
