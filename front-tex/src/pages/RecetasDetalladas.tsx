import React, { useEffect, useState, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';

const RecetasDetalladas: React.FC = () => {
  interface RecetaNormalizada {
    codigo_producto: string;
    codigo_ingrediente: string;
    cantidad_ingrediente: number;
    costo_ingrediente: number | null;
    costo_mano_obra: number | null;
    costo_matriz_energetica: number | null;
    costo_total: number | null;
    valor_cdr: number | null;
    ultima_actualizacion: string | null;
  }

  interface Producto {
    codigo_producto: string;
    descripcion_producto: string;
    sector_productivo: string;
  }

  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas, setRecetas] = useState<RecetaNormalizada[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sectores, setSectores] = useState<string[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas`);
        const data = await res.json();
        setRecetas(data);
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las recetas desde el servidor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchProductos = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/productos`);
        const data: Producto[] = await res.json();
        setProductos(data);

        const sectoresUnicos: string[] = [...new Set(data.map(p => p.sector_productivo))];
        setSectores(sectoresUnicos);
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los productos',
          variant: 'destructive',
        });
      }
    };

    fetchRecetas();
    fetchProductos();
  }, []);

  const filtered = recetas.filter((r) => {
    const matchProducto = productoSeleccionado ? r.codigo_producto === productoSeleccionado : true;
    const matchSector = sectorSeleccionado
      ? productos.find(p => p.codigo_producto === r.codigo_producto)?.sector_productivo === sectorSeleccionado
      : true;
    return matchProducto && matchSector;
  });

  const handleExport = () => {
    toast({
      title: 'Exportación iniciada',
      description: 'Los datos de recetas se están exportando a Excel...',
    });
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
              Detalle de insumos, mano de obra y energía utilizados por producto
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">📤 Exportar</Button>
            {canEdit && <Button>➕ Agregar Receta</Button>}
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
                    {productoSeleccionado || 'Filtrar por producto'}
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
                    {productos.map((p, i) => (
                      <ListboxOption key={i} value={p.codigo_producto} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active ? 'bg-purple-100 text-purple-800' : 'text-gray-800'
                              } ${selected ? 'font-medium' : ''}`}
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
                    {sectorSeleccionado || 'Filtrar por sector'}
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </ListboxButton>
                  <ListboxOptions className="absolute mt-1 w-full bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
                    <ListboxOption value={null} as={Fragment}>
                      {({ active }) => (
                        <li className={`px-4 py-2 cursor-pointer rounded ${active ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                          Todos los sectores
                        </li>
                      )}
                    </ListboxOption>
                    {sectores.map((s, i) => (
                      <ListboxOption key={i} value={s} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className={`cursor-pointer px-4 py-2 rounded-md ${active ? 'bg-yellow-100 text-yellow-800' : 'text-gray-800'
                              } ${selected ? 'font-medium' : ''}`}
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
            <CardDescription>Incluye cantidades, costos desglosados y valor CDR</CardDescription>
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
                    <TableHead>MO</TableHead>
                    <TableHead>Energía</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>CDR</TableHead>
                    <TableHead>Últ. Modif.</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={`${r.codigo_producto}-${r.codigo_ingrediente}`}>
                      <TableCell className="font-mono">{r.codigo_producto}</TableCell>
                      <TableCell className="font-mono">{r.codigo_ingrediente}</TableCell>
                      <TableCell>{r.cantidad_ingrediente}</TableCell>
                      <TableCell className="font-mono text-green-700">
                        ${r.costo_ingrediente?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-purple-700">
                        ${r.costo_mano_obra?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-blue-700">
                        ${r.costo_matriz_energetica?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-black">
                        ${r.costo_total?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-orange-600 font-semibold">
                        ${r.valor_cdr?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.ultima_actualizacion
                          ? new Date(r.ultima_actualizacion).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="outline" size="sm">✏️</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-pink-50 border-pink-200">
          <CardContent className="p-4 text-pink-800 text-sm">
            💡 Cada vez que se modifica una receta, el sistema recalcula automáticamente los costos y el valor CDR gracias a los triggers configurados en la base de datos.
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecetasDetalladas;
