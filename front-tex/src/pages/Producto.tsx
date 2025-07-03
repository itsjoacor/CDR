import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { Edit, Trash2, Save, X } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface ProductoItem {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  created_at: string;
  estado: 'activo' | 'inactivo';
}

const Producto: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoItem[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductoItem>>({});
  const [stats, setStats] = useState({ total: 0, activos: 0, sectores: new Set<string>() });

  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();

        const productosData = data.map((item: any) => ({
          codigo_producto: item.codigo_producto,
          descripcion_producto: item.descripcion_producto,
          sector_productivo: item.sector_productivo,
          created_at: new Date(item.created_at).toLocaleDateString('es-CO'),
          estado: 'activo'
        }));

        const sectores = new Set<string>(data.map((p: any) => p.sector_productivo));
        setStats({ total: data.length, activos: data.length, sectores });
        setProductos(productosData);
        setProductosLista(productosData);
        setSectores(Array.from(sectores));
      } catch (error) {
        console.error('Error fetching productos:', error);
        toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const filteredProductos = productos.filter(producto => {
    const matchesSearch =
      producto.descripcion_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sector_productivo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorSeleccionado ? producto.sector_productivo === sectorSeleccionado : true;
    const matchesProducto = productoSeleccionado ? producto.codigo_producto === productoSeleccionado : true;
    return matchesSearch && matchesSector && matchesProducto;
  });

  const handleExport = () => {
    toast({ title: "Exportación iniciada", description: "Los datos de productos se están exportando a Excel..." });
  };

  const handleEdit = (item: ProductoItem) => {
    setEditingId(item.codigo_producto);
    setEditForm(item);
  };

  const handleSave = () => {
    if (!editForm.descripcion_producto || !editForm.sector_productivo) {
      toast({ title: "Error", description: "Por favor completa todos los campos requeridos.", variant: "destructive" });
      return;
    }
    setProductos(prev => prev.map(item => item.codigo_producto === editingId ? { ...item, ...editForm } as ProductoItem : item));
    toast({ title: "Guardado exitoso", description: "Los cambios se han guardado correctamente." });
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (codigo: string) => {
    setProductos(prev => prev.filter(item => item.codigo_producto !== codigo));
    toast({ title: "Eliminado", description: "El registro se ha eliminado correctamente." });
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'Confección': return 'bg-blue-100 text-blue-800';
      case 'Textil': return 'bg-green-100 text-green-800';
      case 'Marroquinería': return 'bg-purple-100 text-purple-800';
      case 'Calzado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoBadgeVariant = (estado: string) => estado === 'activo' ? 'default' : 'secondary';

  return (
    <Layout title="Gestión de Productos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-green-50">🏭 Productos - Productos Finales</Badge>
            <p className="text-sm text-muted-foreground mt-2">Catálogo de productos finales organizados por sector productivo</p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate('/cargarProducto')}>➕ Agregar producto</Button>
            )}
            <Button onClick={handleExport} variant="outline">📤 Exportar</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.total}</div><div className="text-sm text-muted-foreground">Total</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">{loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.activos}</div><div className="text-sm text-muted-foreground">Activos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-gray-600">{loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.total - stats.activos}</div><div className="text-sm text-muted-foreground">Inactivos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.sectores.size}</div><div className="text-sm text-muted-foreground">Sectores</div></CardContent></Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <Input placeholder="Buscar por código, descripción o sector..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full" />
          </CardContent>
        </Card>

        {/* Tabla principal */}
        <Card>
          <CardHeader><CardTitle>Catálogo de Productos</CardTitle><CardDescription>Productos finales organizados por sector productivo</CardDescription></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
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
                    <TableRow key={producto.codigo_producto}>
                      <TableCell>
                        {editingId === producto.codigo_producto ? (
                          <div className="space-y-2">
                            <Input value={editForm.descripcion_producto || ''} onChange={(e) => setEditForm(p => ({ ...p, descripcion_producto: e.target.value }))} />
                            <div className="text-sm text-muted-foreground font-mono">{producto.codigo_producto}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{producto.descripcion_producto}</div>
                            <div className="text-sm text-muted-foreground font-mono">{producto.codigo_producto}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === producto.codigo_producto ? (
                          <Input value={editForm.sector_productivo || ''} onChange={(e) => setEditForm(p => ({ ...p, sector_productivo: e.target.value }))} />
                        ) : (
                          <Badge className={getSectorColor(producto.sector_productivo)}>{producto.sector_productivo}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(producto.estado)}>{producto.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{producto.created_at}</TableCell>
                      {canEdit && (
                        <TableCell>
                          {editingId === producto.codigo_producto ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(producto)}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>Se eliminará el producto "{producto.descripcion_producto}". Esta acción no se puede deshacer.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(producto.codigo_producto)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info final */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">💡</span>
              <span className="text-sm text-green-800">
                Los productos representan los elementos finales que se fabrican. Cada producto debe estar asociado a un sector productivo válido del sistema.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Producto;
