import React, { useState, useEffect, Fragment } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Edit, Trash2, Save, X } from "lucide-react";
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

interface ProductoItem {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  updated_at: string;
  estado: "activo" | "inactivo";
}

const Producto: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductoItem>>({});
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    sectores: new Set<string>(),
  });

  const canEdit = user?.role === "admin";

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/productos`
        );
        if (!response.ok) throw new Error("Error al cargar productos");
        const data = await response.json();

        const productosData = data.map((item: any) => ({
          codigo_producto: item.codigo_producto,
          descripcion_producto: item.descripcion_producto,
          sector_productivo: item.sector_productivo,
          updated_at: new Date(item.updated_at).toLocaleDateString("es-CO"),
          estado: "activo",
        }));

        setStats({
          total: data.length,
          activos: data.length,
          sectores: new Set(data.map((p: any) => p.sector_productivo)),
        });

        setProductos(productosData);
        setProductosLista(productosData);
      } catch (error) {
        console.error("Error fetching productos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  useEffect(() => {
    const fetchSectores = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/sectores-productivos`
        );
        if (!response.ok) throw new Error("Error al cargar sectores");
        const data = await response.json();
        setSectores(data.map((s: any) => s.nombre));
      } catch (error) {
        console.error("Error fetching sectores:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los sectores productivos",
          variant: "destructive",
        });
      }
    };

    fetchSectores();
  }, []);

  const filteredProductos = productos.filter((producto) => {
    const matchesSearch =
      producto.descripcion_producto
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      producto.codigo_producto
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      producto.sector_productivo
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesSector = sectorSeleccionado
      ? producto.sector_productivo === sectorSeleccionado
      : true;
    const matchesProducto = productoSeleccionado
      ? producto.codigo_producto === productoSeleccionado
      : true;
    return matchesSearch && matchesSector && matchesProducto;
  });

  const handleEdit = (item: ProductoItem) => {
    setEditingId(item.codigo_producto);
    setEditForm(item);
  };

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de productos se están exportando a Excel...",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editForm.descripcion_producto || !editForm.sector_productivo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/productos/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            descripcion_producto: editForm.descripcion_producto,
            sector_productivo: editForm.sector_productivo,
          }),
        }
      );

      const text = await response.text();
      if (!response.ok) throw new Error(`Error al guardar: ${text}`);

      const updated = JSON.parse(text);

      setProductos((prev) =>
        prev.map((item) =>
          item.codigo_producto === editingId ? { ...item, ...updated } : item
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
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (codigo: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/productos/${codigo}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Error al eliminar");

      setProductos((prev) =>
        prev.filter((item) => item.codigo_producto !== codigo)
      );
      toast({
        title: "Eliminado",
        description: "El registro se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
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

  const getEstadoBadgeVariant = (estado: string) =>
    estado === "activo" ? "default" : "secondary";

  return (
    <Layout title="Gestión de Productos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-green-50">
              🏭 Productos - Productos Finales
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Catálogo de productos finales organizados por sector productivo
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate("/cargarProducto")}>
                ➕ Agregar producto
              </Button>
            )}
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
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

        {/* Tabla principal */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Productos</CardTitle>
            <CardDescription>
              Productos finales organizados por sector productivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código/Descripción</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creación</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductos.map((producto) => (
                    <React.Fragment key={producto.codigo_producto}>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">
                            {producto.descripcion_producto}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {producto.codigo_producto}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSectorColor(producto.sector_productivo)}>
                            {producto.sector_productivo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getEstadoBadgeVariant(producto.estado)}>
                            {producto.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {producto.updated_at}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(producto)}
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
                                      Se eliminará el producto "
                                      {producto.descripcion_producto}". Esta
                                      acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDelete(producto.codigo_producto)
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

                      {editingId === producto.codigo_producto && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={canEdit ? 5 : 4}>
                            <Card className="w-full">
                              <CardHeader>
                                <CardTitle className="text-lg">Editando: {producto.descripcion_producto}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label htmlFor="descripcion">Descripción del Producto</Label>
                                    <Input
                                      id="descripcion"
                                      value={editForm.descripcion_producto || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, descripcion_producto: e.target.value }))}
                                      placeholder="Descripción del producto"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="sector">Sector Productivo</Label>
                                    <Listbox
                                      value={editForm.sector_productivo || ''}
                                      onChange={(value) => setEditForm(prev => ({ ...prev, sector_productivo: value }))}
                                    >
                                      <div className="relative">
                                        <ListboxButton className="w-full px-3 py-2 border rounded-md bg-white text-left text-sm">
                                          {editForm.sector_productivo || "Seleccionar sector"}
                                        </ListboxButton>
                                        <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto">
                                          {sectores.map((sector, i) => (
                                            <ListboxOption
                                              key={i}
                                              value={sector}
                                              as={Fragment}
                                            >
                                              {({ active, selected }) => (
                                                <li
                                                  className={`cursor-pointer px-4 py-2 rounded-md ${active
                                                      ? "bg-gray-100 text-gray-900"
                                                      : "text-gray-800"
                                                    } ${selected ? "font-medium" : ""}`}
                                                >
                                                  {sector}
                                                </li>
                                              )}
                                            </ListboxOption>
                                          ))}
                                        </ListboxOptions>
                                      </div>
                                    </Listbox>
                                  </div>
                                </div>
                                <div className="flex justify-end mt-4 space-x-2">
                                  <Button variant="outline" size="sm" onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-1" /> Guardar
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={handleCancel}>
                                    <X className="h-4 w-4 mr-1" /> Cancelar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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

export default Producto;