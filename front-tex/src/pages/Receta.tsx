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
type CdrCeroMap = Record<string, boolean>;

const Receta: React.FC = () => {
  const token = Cookies.get("token");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [zeroCostMap, setZeroCostMap] = useState<ZeroCostMap>({});
  const [cdrCeroMap, setCdrCeroMap] = useState<CdrCeroMap>({});
  const [sectores, setSectores] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canEdit = user?.role === "admin";

  const verificarCdrCero = async (codigoProducto: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${codigoProducto}/tiene-cdr-cero`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error en la consulta');
      const data = await res.json();
      return data.tieneCdrCero;
    } catch {
      return false;
    }
  };

  const verificarTodosLosCDR = async (productosList: Producto[]) => {
    const codigos = productosList.map(p => p.codigo_producto).join(',');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/batch/cdr-cero?codigos=${encodeURIComponent(codigos)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error en batch CDR');
      const data: Record<string, boolean> = await res.json();
      setCdrCeroMap(data);
    } catch {
      setCdrCeroMap({});
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/productos/con-estado`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al obtener productos");
        const data = await res.json();

        setProductos(data);
        setSectores([...new Set<string>(data.map((p: any) => p.sector_productivo))]);

        const zeroMap: ZeroCostMap = {};
        const cdrMap: CdrCeroMap = {};
        data.forEach((p: any) => {
          zeroMap[p.codigo_producto] = p.tiene_costo_cero;
          cdrMap[p.codigo_producto]  = p.tiene_cdr_cero;
        });
        setZeroCostMap(zeroMap);
        setCdrCeroMap(cdrMap);

      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Fallo al cargar datos.",
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
    navigate(`/detalle-receta?productId=${producto.codigo_producto}`);
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

      // También refrescar estado CDR cero
      const tieneCdrCero = await verificarCdrCero(producto.codigo_producto);
      setCdrCeroMap((prev) => ({
        ...prev,
        [producto.codigo_producto]: tieneCdrCero
      }));

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

  // Función para determinar el color de la fila
  const getRowColor = (producto: Producto): string => {
    const tieneCostoCero = !!zeroCostMap[producto.codigo_producto];
    const tieneCdrCero = !!cdrCeroMap[producto.codigo_producto];

    // PRIORIDAD: CDR cero (rojo) sobre costo cero (rojo)
    if (tieneCdrCero) {
      return "bg-red-50 hover:bg-red-100";
    }
    
    // Si no tiene CDR cero pero tiene costo cero, también rojo
    if (tieneCostoCero) {
      return "bg-red-50 hover:bg-red-100";
    }

    // Si no tiene ni CDR cero ni costo cero, verde
    return "bg-green-50 hover:bg-green-100";
  };

  return (
    <Layout title="Recetas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">

          {/* Agregar componente: Cargar receta */}
          <div className="flex space-x-2">
            <Button
              onClick={() => navigate("/cargarReceta")}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Cargar receta
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
                      <TableHead>Estado</TableHead>
                      <TableHead>Actualizado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {page.map((p) => {
                      const rowColor = getRowColor(p);
                      const tieneCostoCero = !!zeroCostMap[p.codigo_producto];
                      const tieneCdrCero = !!cdrCeroMap[p.codigo_producto];
                      
                      return (
                        <TableRow
                          key={p.codigo_producto}
                          className={rowColor}
                        >
                          <TableCell className="font-medium">
                            {p.codigo_producto}
                          </TableCell>
                          <TableCell>{p.descripcion_producto}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.sector_productivo}</Badge>
                          </TableCell>
                          <TableCell>
                            {tieneCdrCero ? (
                              <Badge variant="destructive" className="bg-red-500">
                                INCOMPLETO
                              </Badge>
                            ) : tieneCostoCero ? (
                              <Badge variant="destructive" className="bg-red-500">
                                Costo Cero
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-green-500">
                                COMPLETO
                              </Badge>
                            )}
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

export default Receta;