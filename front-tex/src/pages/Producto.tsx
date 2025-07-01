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
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    sectores: new Set<string>()
  });

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/productos`);
        if (!response.ok) {
          throw new Error('Error al cargar productos');
        }
        const data = await response.json();

        const productosData = data.map((item: any) => ({
          codigo_producto: item.codigo_producto,
          descripcion_producto: item.descripcion_producto,
          sector_productivo: item.sector_productivo,
          created_at: new Date(item.created_at).toLocaleDateString('es-CO'),
          estado: 'activo'
        }));


        // Calcular estadísticas
        const sectores = new Set<string>(data.map((p: any) => p.sector_productivo));
        setStats({
          total: data.length,
          activos: data.length,
          sectores: sectores
        });


        setProductos(productosData);
        setProductosLista(productosData);
        setSectores(Array.from(sectores));

      } catch (error) {
        console.error('Error fetching productos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive"
        });
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

    const matchesSector = sectorSeleccionado
      ? producto.sector_productivo === sectorSeleccionado
      : true;

    const matchesProducto = productoSeleccionado
      ? producto.codigo_producto === productoSeleccionado
      : true;

    return matchesSearch && matchesSector && matchesProducto;
  });

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de productos se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'Confección': return 'bg-blue-100 text-blue-800';
      case 'Textil': return 'bg-green-100 text-green-800';
      case 'Marroquinería': return 'bg-purple-100 text-purple-800';
      case 'Calzado': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button onClick={() => navigate('/cargarProducto')}>
                ➕ Agregar producto
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 justify-center max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Productos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.activos}
              </div>
              <div className="text-sm text-muted-foreground">Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.sectores.size}
              </div>
              <div className="text-sm text-muted-foreground">Sectores</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            {/* Búsqueda general */}
            <div className="flex-1">
              <Input
                placeholder="Buscar por código, descripción o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filtro por producto */}
            <div className="flex-1">
              <Listbox value={productoSeleccionado} onChange={setProductoSeleccionado}>
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-purple-300 flex items-center justify-between">
                    {productoSeleccionado
                      ? productos.find(p => p.codigo_producto === productoSeleccionado)?.codigo_producto + ' - ' +
                      productos.find(p => p.codigo_producto === productoSeleccionado)?.descripcion_producto
                      : 'Filtrar por producto'}
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li className={`px-4 py-2 cursor-pointer rounded ${active ? 'bg-purple-100 text-purple-800' : ''}`}>
                          Todos los productos
                        </li>
                      )}
                    </ListboxOption>
                    {productosLista.map((producto, i) => (
                      <ListboxOption key={i} value={producto.codigo_producto} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active ? 'bg-purple-100 text-purple-800' : 'text-gray-800'
                              } ${selected ? 'font-medium' : ''}`}
                          >
                            {producto.codigo_producto} - {producto.descripcion_producto}
                          </li>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Filtro por sector */}
            <div className="flex-1">
              <Listbox value={sectorSeleccionado} onChange={setSectorSeleccionado}>
                <div className="relative w-full">
                  <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-green-300 flex items-center justify-between">
                    {sectorSeleccionado || 'Filtrar por sector'}
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li className={`px-4 py-2 cursor-pointer rounded ${active ? 'bg-green-100 text-green-800' : ''}`}>
                          Todos los sectores
                        </li>
                      )}
                    </ListboxOption>
                    {sectores.map((sector, i) => (
                      <ListboxOption key={i} value={sector} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active ? 'bg-green-100 text-green-800' : 'text-gray-800'
                              } ${selected ? 'font-medium' : ''}`}
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
          </CardContent>
        </Card>

        {/* Main Table */}
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
                    <TableHead>Sector Productivo</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductos.map((producto) => (
                    <TableRow key={producto.codigo_producto}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{producto.descripcion_producto}</div>
                          <div className="text-sm text-muted-foreground font-mono">{producto.codigo_producto}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSectorColor(producto.sector_productivo)}>
                          {producto.sector_productivo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {producto.created_at}
                      </TableCell>
                      <TableCell>
                        <Badge variant={producto.estado === 'activo' ? 'default' : 'secondary'}>
                          {producto.estado}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/editar-producto/${producto.codigo_producto}`)}
                          >
                            ✏️ Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">💡</span>
              <span className="text-sm text-green-800">
                Los productos representan los elementos finales que se fabrican.
                Cada producto debe estar asociado a un sector productivo válido del sistema.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Producto;