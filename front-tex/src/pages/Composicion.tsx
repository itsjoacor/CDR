import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import Cookies from "js-cookie";
import { Edit, Trash2, Search, Filter, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Producto = {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  updated_at: string | null;
};

type ZeroCostMap = Record<string, boolean>;

const Composicion: React.FC = () => {
  const token = Cookies.get("token");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [zeroCostMap, setZeroCostMap] = useState<ZeroCostMap>({});
  const [sectores, setSectores] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canEdit = user?.role === "admin";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1) Productos (base)
        const resProd = await fetch(`${import.meta.env.VITE_API_URL}/productos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resProd.ok) throw new Error("Error al obtener productos");
        const prodData: Producto[] = await resProd.json();
        setProductos(prodData);

        const sectoresUnicos = [
          ...new Set(prodData.map((p) => p.sector_productivo)),
        ];
        setSectores(sectoresUnicos);

        // 2) Flags costo_total 0/null por producto
        const resZero = await fetch(
          `${import.meta.env.VITE_API_URL}/recetas-normalizada/flags/zero-cost`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!resZero.ok) throw new Error("Error al obtener flags de costos");
        const zeroArr: { codigo_producto: string }[] = await resZero.json();

        const map: ZeroCostMap = {};
        zeroArr.forEach((r) => {
          map[r.codigo_producto] = true;
        });
        setZeroCostMap(map);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Fallo al cargar datos.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtros
  const filtered = productos.filter((p) => {
    const matchesSearch =
      p.descripcion_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorSeleccionado
      ? p.sector_productivo === sectorSeleccionado
      : true;
    return matchesSearch && matchesSector;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const page = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (producto: Producto) => {
    // Abre detalle con SELECT * de recetas_normalizada por producto
    navigate(`/detalle-composicion?productId=${producto.codigo_producto}`);
  };

  const handleDelete = async (producto: Producto) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/por-producto/${producto.codigo_producto}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Error al eliminar la receta completa (${producto.codigo_producto}): ${body}`
        );
      }

      // Refrescar flag del producto eliminado
      const check = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/flags/zero-cost?codigo=${encodeURIComponent(
          producto.codigo_producto
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (check.ok) {
        const arr: { codigo_producto: string }[] = await check.json();
        setZeroCostMap((prev) => ({
          ...prev,
          [producto.codigo_producto]: arr.length > 0,
        }));
      } else {
        setZeroCostMap((prev) => ({ ...prev, [producto.codigo_producto]: false }));
      }

      toast({
        title: "Eliminado",
        description: `Se eliminaron todas las filas de la receta ${producto.codigo_producto}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudo eliminar la receta.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Composicion">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Composición por Producto
            </h1>
            <p className="text-sm text-muted-foreground">
              Lista basada en <b>productos</b>. Los productos con ingredientes
              con <b>costo_total = 0</b> se muestran en <b className="text-red-600">rojo</b>.
            </p>
          </div>

          {/* Agregar componente: Cargar composición */}
          <div className="flex space-x-2">
            <Button
              onClick={() => navigate("/cargarComposicion")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Cargar composición
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded-md px-2 h-9"
                value={sectorSeleccionado || ""}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSectorSeleccionado(e.target.value || null);
                }}
              >
                <option value="">Todos los sectores</option>
                {sectores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Actualizado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {page.map((p) => {
                      const red = !!zeroCostMap[p.codigo_producto];
                      return (
                        <TableRow
                          key={p.codigo_producto}
                          className={
                            red
                              ? "bg-red-50 hover:bg-red-100"
                              : "bg-white hover:bg-muted/30"
                          }
                        >
                          <TableCell className="font-medium">
                            {p.codigo_producto}
                          </TableCell>
                          <TableCell>{p.descripcion_producto}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.sector_productivo}</Badge>
                          </TableCell>
                          <TableCell>
                            {p.updated_at
                              ? new Date(p.updated_at).toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(p)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>

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
                                    <AlertDialogTitle>
                                      Eliminar receta completa
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esto eliminará <b>todas</b> las filas de
                                      la receta del producto{" "}
                                      <b>{p.codigo_producto}</b>. ¿Deseás
                                      continuar?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(p)}
                                    >
                                      Sí, eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {/* Paginación */}
            {!loading && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} — {filtered.length}{" "}
                  productos
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
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

export default Composicion;
