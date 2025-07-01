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
  const [productoValido, setProductoValido] = useState(false);
  const [ingredienteValido, setIngredienteValido] = useState(false);


  console.log('Datos a enviar:', {
    codigo_producto: codigoProducto,
    codigo_ingrediente: newIngredient.codigo_ingrediente,
    cantidad_ingrediente: newIngredient.cantidad_ingrediente
  });
  // FETCH INFO PRODUCTO
  useEffect(() => {
    const codigo = codigoProducto.trim().toUpperCase();
    if (!codigo) {
      setDescripcionProducto('');
      setSectorProductivo('');
      setProductoValido(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/productos/${codigo}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setDescripcionProducto(data.descripcion_producto || '');
        setSectorProductivo(data.sector_productivo || '');
        setProductoValido(true);
      })
      .catch(() => {
        setDescripcionProducto('No encontrado');
        setSectorProductivo('No encontrado');
        setProductoValido(false);
      });
  }, [codigoProducto]);

  // FETCH INFO INGREDIENTE
  useEffect(() => {
    const codigo = newIngredient.codigo_ingrediente.trim().toUpperCase();

    if (!codigo) {
      setDescripcionIngrediente('');
      setIngredienteValido(false);
      return;
    }

    setDescripcionIngrediente('Buscando...');

    const timer = setTimeout(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/autocomplete/ingrediente/${codigo}`)
        .then(res => {
          if (!res.ok) throw new Error('No encontrado');
          return res.json();
        })
        .then(data => {
          if (data && data.descripcion) {
            setDescripcionIngrediente(data.descripcion.trim());
            setIngredienteValido(true);
          } else {
            throw new Error('Sin datos');
          }
        })
        .catch(() => {
          setDescripcionIngrediente('Ingrediente no encontrado');
          setIngredienteValido(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [newIngredient.codigo_ingrediente]);


  const addIngredient = () => {
    if (!productoValido) {
      toast({
        title: "Error",
        description: `Producto no existente (${codigoProducto}), primero deberías cargarlo`,
        variant: "destructive"
      });
      return;
    }

    if (!ingredienteValido || descripcionIngrediente === 'Ingrediente no encontrado') {
      const codigo = newIngredient.codigo_ingrediente.trim().toUpperCase();
      toast({
        title: "Error",
        description: `Ingrediente no existente (${codigo}), primero deberías cargarlo`,
        variant: "destructive"
      });
      return;
    }

    if (newIngredient.cantidad_ingrediente <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a cero",
        variant: "destructive"
      });
      return;
    }

    // Verificar si ya existe en la lista actual
    const existeEnLista = ingredientes.some(
      ing => ing.codigo_ingrediente === newIngredient.codigo_ingrediente.trim().toUpperCase()
    );

    if (existeEnLista) {
      toast({
        title: "Error",
        description: "Este ingrediente ya está en la lista",
        variant: "destructive"
      });
      return;
    }

    setIngredientes(prev => [...prev, {
      codigo_ingrediente: newIngredient.codigo_ingrediente.trim().toUpperCase(),
      cantidad_ingrediente: newIngredient.cantidad_ingrediente
    }]);

    setNewIngredient({ codigo_ingrediente: '', cantidad_ingrediente: 0 });
    setDescripcionIngrediente('');

    toast({ title: "Ingrediente agregado", variant: "default" });
  };

  const removeIngredient = (index: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Ingrediente eliminado" });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    setIngredientes(prev => prev.map((ing, i) =>
      i === index ? {
        ...ing,
        [field]: field === 'codigo_ingrediente' ? value.toUpperCase() : value
      } : ing
    ));
  };

  const handleSave = async () => {
    const codigoProductoUpper = codigoProducto.trim().toUpperCase();

    // Validaciones básicas
    if (!codigoProductoUpper) {
      toast({ title: "Error", description: "Ingresa el código del producto.", variant: "destructive" });
      return;
    }

    if (!productoValido) {
      toast({
        title: "Error",
        description: `Producto no existente (${codigoProductoUpper}), primero deberías cargarlo`,
        variant: "destructive"
      });
      return;
    }

    if (ingredientes.length === 0) {
      toast({ title: "Error", description: "Agrega al menos un ingrediente válido.", variant: "destructive" });
      return;
    }

    try {
      const loadingToast = toast({
        title: "Guardando receta...",
        description: "Validando ingredientes",
        variant: "default",
        duration: Infinity
      });

      const results = await Promise.allSettled(
        ingredientes.map(async (ingrediente) => {
          const codigoIngrediente = ingrediente.codigo_ingrediente.trim().toUpperCase();

          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas-normalizada`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                codigo_producto: codigoProductoUpper,
                codigo_ingrediente: codigoIngrediente,
                cantidad_ingrediente: ingrediente.cantidad_ingrediente
              }),
            });

            // Manejar respuesta vacía
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (!res.ok) {
              let errorMessage = data.message || 'Error desconocido';

              // Manejar diferentes códigos de error
              switch (res.status) {
                case 400:
                  errorMessage = data.error || 'Datos inválidos';
                  break;
                case 404:
                  errorMessage = 'Recurso no encontrado';
                  break;
                case 409:
                  errorMessage = 'Combinación ya existe';
                  break;
                case 500:
                  errorMessage = 'Error interno del servidor';
                  break;
              }

              throw new Error(`${codigoIngrediente}: ${errorMessage}`);
            }

            return data;
          } catch (error) {
            if (error instanceof SyntaxError) {
              throw new Error(`${codigoIngrediente}: Respuesta inválida del servidor`);
            }
            throw error;
          }
        })
      );

      loadingToast.dismiss();

      // Procesar resultados
      const errores = results.filter(r => r.status === 'rejected');
      if (errores.length > 0) {
        const mensajesError = errores.map((e: any) => {
          // Extraer solo la parte del mensaje después del código
          const msg = e.reason.message;
          return msg.includes(': ') ? msg.split(': ')[1] : msg;
        });

        throw new Error(
          `\n ${mensajesError.slice(0, 3).join('\n- ')}` +
          (mensajesError.length > 3 ? `\n- y ${mensajesError.length - 3} más...` : '')
        );
      }

      // Éxito
      toast({
        title: "✅ Receta guardada",
        description: `La receta se guardó correctamente con ${ingredientes.length} ingredientes`,
        variant: 'default'
      });

      // Resetear formulario
      setCodigoProducto('');
      setDescripcionProducto('');
      setSectorProductivo('');
      setIngredientes([]);
      setProductoValido(false);

    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error.message || 'Ocurrió un error inesperado',
        variant: 'destructive',
        duration: 8000
      });

      console.error('Error detallado:', error);
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
        </div>

        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          ✨ Cargar Nueva Receta - Define los ingredientes necesarios. Puedes agregar ingredientes y luego cargarlos todos juntos.
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
                  onChange={(e) => setCodigoProducto(e.target.value.toUpperCase())}
                  placeholder="Ej: PRD001"
                  className="uppercase text-lg font-semibold"
                  maxLength={15}
                />
                {!productoValido && codigoProducto && (
                  <p className="text-xs text-red-500">Producto no encontrado</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className={`text-sm ${descripcionProducto === 'No encontrado' ? 'text-red-500' : 'text-gray-700'
                    }`}>
                    {descripcionProducto}
                  </span>
                </div>
                <Label className="mt-2">Sector Productivo</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className={`text-sm ${sectorProductivo === 'No encontrado' ? 'text-red-500' : 'text-gray-700'
                    }`}>
                    {sectorProductivo}
                  </span>
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
                  onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    codigo_ingrediente: e.target.value.toUpperCase()
                  }))}
                  placeholder="Ej: INS001, MO001, ME001"
                  className="uppercase border-blue-300"
                  maxLength={15}
                />
                <p className="text-xs text-blue-600">Puede ser insumo, mano obra o matriz energética</p>

                {/* Mensaje de error IDÉNTICO al del producto */}
                {!ingredienteValido && newIngredient.codigo_ingrediente && (
                  <p className="text-xs text-red-500">Ingrediente no encontrado</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <div className="p-2 bg-white rounded border min-h-[40px] flex items-center">
                  <span className={`text-sm ${descripcionIngrediente === 'Ingrediente no encontrado' ? 'text-red-500' :
                    descripcionIngrediente === 'Buscando...' ? 'text-blue-500 italic' :
                      'text-gray-700'
                    }`}>
                    {descripcionIngrediente || ' '}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="cantidad-ingrediente">Cantidad Ingrediente</Label>
              <div className="flex space-x-2">
                <Input
                  id="cantidad-ingrediente"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newIngredient.cantidad_ingrediente}
                  onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    cantidad_ingrediente: Number(e.target.value)
                  }))}
                  placeholder="0.00"
                  className="border-blue-300 max-w-60"
                />
                <Button
                  onClick={addIngredient}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                  disabled={
                    !newIngredient.codigo_ingrediente.trim() ||
                    newIngredient.cantidad_ingrediente <= 0 ||
                    !ingredienteValido ||
                    !productoValido
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                            value={ingrediente.codigo_ingrediente} disabled
                            onChange={(e) => updateIngredient(index, 'codigo_ingrediente', e.target.value)}
                            className="uppercase cursor-not-allowed"
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
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Guardar Receta</span>
        </Button>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">ℹ️</span>
              <span className="text-sm text-green-800">
                Cada ingrediente puede ser un producto, insumo, mano de obra o matriz energética.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CargarReceta;