import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

interface Ingredient {
  codigo_ingrediente: string;
  descripcion_ingrediente: string;
  cantidad_ingrediente: number;
}

interface RecetaData {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  ingredientes: Ingredient[];
}

const EditarReceta: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { codigo_producto } = useParams<{ codigo_producto: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [receta, setReceta] = useState<RecetaData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch recipe data from API
useEffect(() => {
  const fetchReceta = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas?codigo_producto=${codigo_producto}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Handle both array response and single object response
      const recipeData = Array.isArray(data) 
        ? data.find(r => r.codigo_producto === codigo_producto)
        : data;

      if (!recipeData) {
        throw new Error('Receta no encontrada');
      }

      setReceta({
        codigo_producto: recipeData.codigo_producto,
        descripcion_producto: recipeData.descripcion_producto,
        sector_productivo: recipeData.sector_productivo,
        ingredientes: recipeData.ingredientes || []
      });

    } catch (err) {
      console.error('Fetch error:', err);
      toast({
        title: "Error",
        description: "No se pudo cargar la receta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchReceta();
}, [codigo_producto]);

  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    codigo_ingrediente: '',
    descripcion_ingrediente: '',
    cantidad_ingrediente: 0,
  });

  const handleTitleChange = (field: keyof RecetaData, value: string) => {
    setReceta(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    setReceta(prev => {
      if (!prev) return null;
      const updatedIngredients = [...prev.ingredientes];
      updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
      return { ...prev, ingredientes: updatedIngredients };
    });
  };

  const addNewIngredient = () => {
    if (newIngredient.codigo_ingrediente.trim() && 
        newIngredient.descripcion_ingrediente.trim() && 
        receta) {
      setReceta(prev => prev ? {
        ...prev,
        ingredientes: [...prev.ingredientes, { ...newIngredient }],
      } : null);
      setNewIngredient({ 
        codigo_ingrediente: '', 
        descripcion_ingrediente: '', 
        cantidad_ingrediente: 0 
      });
      toast({
        title: "Ingrediente agregado",
        description: "El ingrediente se ha agregado exitosamente.",
      });
    }
  };

  const handleSave = async () => {
    if (!receta) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas/${codigo_producto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
         },
        body: JSON.stringify(receta),
      });

      if (!res.ok) throw new Error('Error al guardar');

      toast({
        title: "✅ Receta guardada",
        description: "Los cambios se han guardado exitosamente.",
        className: "bg-green-100 text-green-800",
      });
      navigate('/receta');
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo guardar la receta",
        variant: "destructive",
      });
    }
  };

  if (loading || !receta) {
    return <Layout title="Cargando receta...">Loading...</Layout>;
  }

  return (
    <Layout title={`Editar Receta: ${receta.codigo_producto}`}>
      <div className="space-y-6">
        {/* Header Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/receta')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>

        {/* Recipe Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Información de la Receta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código Producto</Label>
                <Input
                  value={receta.codigo_producto}
                  onChange={(e) => handleTitleChange('codigo_producto', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={receta.descripcion_producto}
                  onChange={(e) => handleTitleChange('descripcion_producto', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sector Productivo</Label>
                <Input
                  value={receta.sector_productivo}
                  onChange={(e) => handleTitleChange('sector_productivo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receta.ingredientes.map((ingrediente, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={ingrediente.codigo_ingrediente}
                          onChange={(e) => updateIngredient(index, 'codigo_ingrediente', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={ingrediente.descripcion_ingrediente}
                          onChange={(e) => updateIngredient(index, 'descripcion_ingrediente', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={ingrediente.cantidad_ingrediente}
                          onChange={(e) => updateIngredient(index, 'cantidad_ingrediente', Number(e.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Add New Ingredient */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Agregar Nuevo Ingrediente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 space-y-2">
                <Label>Código</Label>
                <Input
                  value={newIngredient.codigo_ingrediente}
                  onChange={(e) => setNewIngredient({...newIngredient, codigo_ingrediente: e.target.value})}
                />
              </div>
              <div className="col-span-5 space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={newIngredient.descripcion_ingrediente}
                  onChange={(e) => setNewIngredient({...newIngredient, descripcion_ingrediente: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newIngredient.cantidad_ingrediente}
                  onChange={(e) => setNewIngredient({...newIngredient, cantidad_ingrediente: Number(e.target.value)})}
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button 
                  onClick={addNewIngredient}
                  className="w-full"
                  disabled={!newIngredient.codigo_ingrediente.trim() || !newIngredient.descripcion_ingrediente.trim()}
                >
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditarReceta;