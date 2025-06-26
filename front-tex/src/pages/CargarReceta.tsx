import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Ingredient {
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
}

const CargarReceta: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [codigoProducto, setCodigoProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [sectorProductivo, setSectorProductivo] = useState('');
  const [descripcionIngrediente, setDescripcionIngrediente] = useState('');
  const [ingredientes, setIngredientes] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    codigo_ingrediente: '',
    cantidad_ingrediente: 0
  });

  // FETCH INFO PRODUCTO
  useEffect(() => {
    if (!codigoProducto.trim()) {
      setDescripcionProducto('');
      setSectorProductivo('');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/productos/${codigoProducto}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setDescripcionProducto(data.descripcion_producto || '');
        setSectorProductivo(data.sector_productivo || '');
      })
      .catch(() => {
        setDescripcionProducto('No encontrado');
        setSectorProductivo('No encontrado');
      });
  }, [codigoProducto]);

  // FETCH INFO INGREDIENTE
  useEffect(() => {
    const codigo = newIngredient.codigo_ingrediente.trim();
    if (!codigo) {
      setDescripcionIngrediente('');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/autocomplete/ingrediente/${codigo}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setDescripcionIngrediente(data.descripcion || 'Sin descripción');
      })
      .catch(() => {
        setDescripcionIngrediente('No encontrado');
      });
  }, [newIngredient.codigo_ingrediente]);

  const addIngredient = () => {
    if (newIngredient.codigo_ingrediente.trim() && newIngredient.cantidad_ingrediente > 0) {
      setIngredientes(prev => [...prev, { ...newIngredient }]);
      setNewIngredient({ codigo_ingrediente: '', cantidad_ingrediente: 0 });
      toast({ title: "Ingrediente agregado", description: "El ingrediente se ha agregado exitosamente." });
    } else {
      toast({
        title: "Error",
        description: "Completa todos los campos del ingrediente.",
        variant: "destructive"
      });
    }
  };

  const removeIngredient = (index: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Ingrediente eliminado" });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    setIngredientes(prev => prev.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const handleSave = async () => {
    if (!codigoProducto.trim()) {
      toast({ title: "Error", description: "Ingresa el código del producto.", variant: "destructive" });
      return;
    }

    if (ingredientes.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un ingrediente.", variant: "destructive" });
      return;
    }

    try {
      await Promise.all(
        ingredientes.map(async (ingrediente) => {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas-normalizada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codigo_producto: codigoProducto,
              codigo_ingrediente: ingrediente.codigo_ingrediente,
              cantidad_ingrediente: ingrediente.cantidad_ingrediente
            }),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Error con ${ingrediente.codigo_ingrediente}`);
          }
        })
      );

      toast({
        title: "Receta creada",
        description: `La receta ${codigoProducto} se guardó con ${ingredientes.length} ingredientes.`,
      });

      setCodigoProducto('');
      setDescripcionProducto('');
      setSectorProductivo('');
      setIngredientes([]);
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Layout title="Nueva Receta">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/receta')} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Recetas</span>
          </Button>
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Guardar Receta</span>
          </Button>
        </div>

        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          ✨ Crear Nueva Receta - Define los ingredientes necesarios
        </Badge>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">🏷️ Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo-producto">Código Producto</Label>
                <Input
                  id="codigo-producto"
                  value={codigoProducto}
                  onChange={(e) => setCodigoProducto(e.target.value)}
                  placeholder="Ej: PRD001"
                  className="uppercase text-lg font-semibold"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className="text-gray-700 text-sm">{descripcionProducto}</span>
                </div>
                <Label className="mt-2">Sector Productivo</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className="text-gray-700 text-sm">{sectorProductivo}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Plus className="h-5 w-5" />
              <span>Agregar Ingrediente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo-ingrediente">Código Ingrediente</Label>
                <Input
                  id="codigo-ingrediente"
                  value={newIngredient.codigo_ingrediente}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, codigo_ingrediente: e.target.value }))}
                  placeholder="Ej: INS001, MO001, ME001"
                  className="uppercase border-blue-300"
                  maxLength={15}
                />
                <p className="text-xs text-blue-600">Puede ser insumo, mano obra o matriz energética</p>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className="text-blue-500 text-sm">{descripcionIngrediente}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="cantidad-ingrediente">Cantidad Ingrediente</Label>
              <div className="flex space-x-2">
                <Input
                  id="cantidad-ingrediente"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newIngredient.cantidad_ingrediente}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, cantidad_ingrediente: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="border-blue-300 max-w-60"
                />
                <Button
                  onClick={addIngredient}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  disabled={!newIngredient.codigo_ingrediente.trim() || newIngredient.cantidad_ingrediente <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ingredientes */}
        {ingredientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                📦 Ingredientes de la Receta <Badge variant="secondary">{ingredientes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredientes.map((ingrediente, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={ingrediente.codigo_ingrediente}
                            onChange={(e) => updateIngredient(index, 'codigo_ingrediente', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={ingrediente.cantidad_ingrediente}
                            onChange={(e) => updateIngredient(index, 'cantidad_ingrediente', Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => removeIngredient(index)} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">ℹ️</span>
              <span className="text-sm text-green-800">
                Cada ingrediente puede ser un producto, insumo, mano de obra o matriz energética. Asegúrate de que ya exista en la base de datos.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CargarReceta;
