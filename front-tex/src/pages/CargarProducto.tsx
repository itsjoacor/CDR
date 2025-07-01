import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const CargarProducto: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [codigoProducto, setCodigoProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [sectorProductivo, setSectorProductivo] = useState('');

  const handleSave = () => {
    if (!codigoProducto.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código del producto.",
        variant: "destructive"
      });
      return;
    }

    if (!descripcionProducto.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa la descripción del producto.",
        variant: "destructive"
      });
      return;
    }

    if (!sectorProductivo.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el sector productivo.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Producto creado",
      description: `El producto ${codigoProducto} se ha creado exitosamente.`,
    });
    
    // Here you would typically save to your database
    console.log('Nuevo producto:', { codigoProducto, descripcionProducto, sectorProductivo });
  };

  return (
    <Layout title="Nuevo Producto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/producto')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Productos</span>
          </Button>
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Guardar Producto</span>
            </Button>
          </div>
        </div>

        {/* Info Badge */}
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          🏭 Crear Nuevo Producto
        </Badge>

        {/* Información del Producto */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-xl">🏭</span>
              <span>Información del Producto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Código Producto */}
              <div className="space-y-2">
                <Label htmlFor="codigo_producto">Código Producto</Label>
                <Input
                  id="codigo_producto"
                  value={codigoProducto}
                  onChange={(e) => setCodigoProducto(e.target.value)}
                  placeholder="Ej: PROD-001"
                  className="text-lg font-semibold max-w-60"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Código único identificativo del producto
                </p>
              </div>

              {/* Descripción Producto */}
              <div className="space-y-2">
                <Label htmlFor="descripcion_producto">Descripción Producto</Label>
                <Input
                  id="descripcion_producto"
                  value={descripcionProducto}
                  onChange={(e) => setDescripcionProducto(e.target.value)}
                  placeholder="Ej: Camisa de algodón para hombre"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Descripción detallada del producto
                </p>
              </div>

              {/* Sector Productivo */}
              <div className="space-y-2">
                <Label htmlFor="sector_productivo">Sector Productivo</Label>
                <Input
                  id="sector_productivo"
                  value={sectorProductivo}
                  onChange={(e) => setSectorProductivo(e.target.value)}
                  placeholder="Ej: Confección, Textil"
                  className="text-lg font-semibold max-w-80"
                />
                <p className="text-xs text-muted-foreground">
                  Sector productivo al que pertenece el producto
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <span className="text-xl">📋</span>
              <span>Resumen del Producto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">Código:</span>
                <span className="text-green-800 font-mono">{codigoProducto || 'Sin definir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">Descripción:</span>
                <span className="text-green-800">{descripcionProducto || 'Sin definir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">Sector Productivo:</span>
                <span className="text-green-800">{sectorProductivo || 'Sin definir'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">ℹ️</span>
              <span className="text-sm text-green-800">
                Los productos son los elementos finales que se fabrican. 
                El sector productivo debe corresponder a uno existente en el sistema.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CargarProducto;