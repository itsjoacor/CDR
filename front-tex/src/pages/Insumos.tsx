
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface InsumoItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  precioUnitario: number;
  unidadMedida: string;
  stock: number;
  stockMinimo: number;
  fechaActualizacion: string;
  estado: 'disponible' | 'agotado' | 'descontinuado';
}

const Insumos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [insumos] = useState<InsumoItem[]>([
    {
      id: '1',
      codigo: 'TEL-ALG-001',
      nombre: 'Tela algodón 100%',
      categoria: 'Telas',
      proveedor: 'Textiles del Valle',
      precioUnitario: 35000,
      unidadMedida: 'metro',
      stock: 150,
      stockMinimo: 50,
      fechaActualizacion: '2024-06-10',
      estado: 'disponible'
    },
    {
      id: '2',
      codigo: 'HIL-POL-002',
      nombre: 'Hilo poliéster reforzado',
      categoria: 'Hilos',
      proveedor: 'Hilanderías S.A.',
      precioUnitario: 800,
      unidadMedida: 'metro',
      stock: 2500,
      stockMinimo: 500,
      fechaActualizacion: '2024-06-08',
      estado: 'disponible'
    },
    {
      id: '3',
      codigo: 'TEL-DEN-003',
      nombre: 'Tela denim 14oz',
      categoria: 'Telas',
      proveedor: 'Denim Express',
      precioUnitario: 45000,
      unidadMedida: 'metro',
      stock: 80,
      stockMinimo: 30,
      fechaActualizacion: '2024-06-12',
      estado: 'disponible'
    },
    {
      id: '4',
      codigo: 'CRE-MET-004',
      nombre: 'Cremallera metálica 20cm',
      categoria: 'Accesorios',
      proveedor: 'Accesorios Premium',
      precioUnitario: 3500,
      unidadMedida: 'pieza',
      stock: 200,
      stockMinimo: 100,
      fechaActualizacion: '2024-06-11',
      estado: 'disponible'
    },
    {
      id: '5',
      codigo: 'BOT-PLA-005',
      nombre: 'Botones plásticos 15mm',
      categoria: 'Accesorios',
      proveedor: 'Botones & Más',
      precioUnitario: 250,
      unidadMedida: 'pieza',
      stock: 15,
      stockMinimo: 50,
      fechaActualizacion: '2024-06-09',
      estado: 'agotado'
    },
    {
      id: '6',
      codigo: 'ETI-IMP-006',
      nombre: 'Etiquetas impresas',
      categoria: 'Etiquetas',
      proveedor: 'Etiquetas del Norte',
      precioUnitario: 450,
      unidadMedida: 'pieza',
      stock: 500,
      stockMinimo: 200,
      fechaActualizacion: '2024-06-07',
      estado: 'disponible'
    }
  ]);

  const filteredInsumos = insumos.filter(insumo =>
    insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de insumos se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'default';
      case 'agotado': return 'destructive';
      case 'descontinuado': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Telas': return 'bg-blue-100 text-blue-800';
      case 'Hilos': return 'bg-green-100 text-green-800';
      case 'Accesorios': return 'bg-purple-100 text-purple-800';
      case 'Etiquetas': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isStockBajo = (stock: number, stockMinimo: number) => stock <= stockMinimo;

  return (
    <Layout title="Gestión de Insumos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-purple-50">
              📦 Insumos - Materiales Externos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Catálogo de materiales comprados externamente con precios actualizados
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button>
                ➕ Nuevo Insumo
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">6</div>
              <div className="text-sm text-muted-foreground">Total Insumos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-muted-foreground">Disponibles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-muted-foreground">Stock Bajo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <Input
                placeholder="Buscar por nombre, código o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Insumos</CardTitle>
            <CardDescription>
              Materiales externos con precios actualizados para el cálculo del CDR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código/Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  {canEdit && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsumos.map((insumo) => (
                  <TableRow key={insumo.id} className={isStockBajo(insumo.stock, insumo.stockMinimo) ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{insumo.nombre}</div>
                        <div className="text-sm text-muted-foreground font-mono">{insumo.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(insumo.categoria)}>
                        {insumo.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {insumo.proveedor}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      ${insumo.precioUnitario.toLocaleString('es-CO')}
                      <div className="text-xs text-muted-foreground">por {insumo.unidadMedida}</div>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${isStockBajo(insumo.stock, insumo.stockMinimo) ? 'text-red-600' : 'text-green-600'}`}>
                        {insumo.stock} {insumo.unidadMedida}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {insumo.stockMinimo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(insumo.estado)}>
                        {insumo.estado}
                      </Badge>
                      {isStockBajo(insumo.stock, insumo.stockMinimo) && (
                        <div className="text-xs text-red-600 mt-1">⚠️ Stock bajo</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {insumo.fechaActualizacion}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button variant="outline" size="sm">
                          ✏️ Editar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">💡</span>
              <span className="text-sm text-purple-800">
                Los precios de los insumos se actualizan automáticamente en el cálculo del CDR. 
                Mantén los precios actualizados para obtener costos precisos de reposición.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Insumos;
