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
import Cookies from 'js-cookie';

interface Ingredient {
  codigo_ingrediente: string;
  cantidad_ingrediente: number;
}

interface SearchOption {
  codigo: string;
  descripcion: string;
  tipo: 'Insumo' | 'Producto' | 'Mano Obra' | 'Energía';
}

const TIPO_COLORS: Record<string, string> = {
  'Insumo': 'bg-purple-100 text-purple-700',
  'Producto': 'bg-blue-100 text-blue-700',
  'Mano Obra': 'bg-orange-100 text-orange-700',
  'Energía': 'bg-yellow-100 text-yellow-700',
};

const CargarReceta: React.FC = () => {

  const navigate = useNavigate();
  const { toast } = useToast();

  const [codigoProducto, setCodigoProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [sectorProductivo, setSectorProductivo] = useState('');
  const [descripcionIngrediente, setDescripcionIngrediente] = useState('');

  // Catálogos cargados una sola vez para predicción local (0 requests al escribir)
  const [allProductos, setAllProductos] = useState<SearchOption[]>([]);
  const [allIngredientes, setAllIngredientes] = useState<SearchOption[]>([]);
  const [showProdSugg, setShowProdSugg] = useState(false);
  const [showIngSugg, setShowIngSugg] = useState(false);

  const [ingredientes, setIngredientes] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    codigo_ingrediente: '',
    cantidad_ingrediente: 0
  });
  const [productoValido, setProductoValido] = useState(false);
  const [ingredienteValido, setIngredienteValido] = useState(false);


  const token = Cookies.get('token') || '';

  // Carga independiente de cada tabla para predicción local
  useEffect(() => {
    if (!token) return;
    const h = { headers: { Authorization: `Bearer ${token}` } };
    const base = import.meta.env.VITE_API_URL;

    const safeFetch = async (url: string): Promise<any[]> => {
      try {
        const res = await fetch(url, h);
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    };

    const load = async () => {
      const [prods, insumos, manos, energias] = await Promise.all([
        safeFetch(`${base}/productos`),
        safeFetch(`${base}/insumos`),
        safeFetch(`${base}/matriz-mano`),
        safeFetch(`${base}/matriz-energia`),
      ]);

      setAllProductos(
        prods.map((p: any) => ({
          codigo: p.codigo_producto,
          descripcion: p.descripcion_producto ?? '',
          tipo: 'Producto' as const,
        }))
      );

      const ing: SearchOption[] = [];
      for (const r of insumos)  ing.push({ codigo: r.codigo, descripcion: r.detalle ?? '', tipo: 'Insumo' });
      for (const r of prods)    ing.push({ codigo: r.codigo_producto, descripcion: r.descripcion_producto ?? '', tipo: 'Producto' });
      for (const r of manos)    ing.push({ codigo: r.codigo_mano_obra, descripcion: r.descripcion ?? '', tipo: 'Mano Obra' });
      for (const r of energias) ing.push({ codigo: r.codigo_energia, descripcion: r.descripcion ?? '', tipo: 'Energía' });

      console.log('[CargarReceta] Catálogos cargados:', {
        productos: prods.length,
        insumos: insumos.length,
        mano_obra: manos.length,
        energia: energias.length,
        total: ing.length,
      });
      setAllIngredientes(ing);
    };
    load();
  }, [token]);

  // Filtro local de sugerencias
  const prodSuggestions = codigoProducto.length > 0
    ? allProductos.filter(p =>
        p.codigo.toLowerCase().includes(codigoProducto.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(codigoProducto.toLowerCase())
      ).slice(0, 8)
    : [];

  const ingSuggestions = newIngredient.codigo_ingrediente.length > 0
    ? allIngredientes.filter(i =>
        i.codigo.toLowerCase().includes(newIngredient.codigo_ingrediente.toLowerCase()) ||
        i.descripcion.toLowerCase().includes(newIngredient.codigo_ingrediente.toLowerCase())
      ).slice(0, 8)
    : [];

  // FETCH INFO PRODUCTO
  useEffect(() => {
    const codigo = codigoProducto.trim().toUpperCase();
    if (!codigo) {
      setDescripcionProducto('');
      setSectorProductivo('');
      setProductoValido(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/productos/${codigo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setDescripcionProducto(data.descripcion_producto || '');
        setSectorProductivo(data.sector_productivo || '');
        setProductoValido(true);
      })
      .catch(() => {
        setDescripcionProducto('No encontrado');
        setSectorProductivo('No encontrado');
        setProductoValido(false);
      });
  }, [codigoProducto, token]);

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
      fetch(`${import.meta.env.VITE_API_URL}/api/autocomplete/ingrediente/${codigo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('No encontrado');
          return res.json();
        })
        .then((data) => {
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
  }, [newIngredient.codigo_ingrediente, token]);


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
        description: "Este componente ya está en la lista",
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

    toast({ title: "Componente agregado", variant: "default" });
  };

  const removeIngredient = (index: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Componente eliminado" });
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
        title: "Guardando componente...",
        description: "Validando componente",
        variant: "default",
        duration: Infinity
      });

      const results = await Promise.allSettled(
        ingredientes.map(async (ingrediente) => {
          const codigoIngrediente = ingrediente.codigo_ingrediente.trim().toUpperCase();

          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas-normalizada`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' ,
                Authorization : `Bearer ${token}`
              },
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
          `\n${mensajesError.slice(0, 3).join('\n- ')}` +
          (mensajesError.length > 3 ? `\n- y ${mensajesError.length - 3} más...` : '')
        );
      }

      // Éxito
      toast({
        title: "✅ Receta guardada",
        description: `La receta se guardó correctamente con ${ingredientes.length} componentes`,
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
            <span>Volver atrás</span>
          </Button>
        </div>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">🏷️ Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo-producto">Código Producto</Label>
                <div className="relative">
                  <Input
                    id="codigo-producto"
                    value={codigoProducto}
                    onChange={(e) => { setCodigoProducto(e.target.value.toUpperCase()); setShowProdSugg(true); }}
                    onFocus={() => codigoProducto && setShowProdSugg(true)}
                    onBlur={() => setTimeout(() => setShowProdSugg(false), 150)}
                    placeholder="Ej: PRD001"
                    className="uppercase text-lg font-semibold"
                    maxLength={15}
                  />
                  {showProdSugg && prodSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                      {prodSuggestions.map((p) => (
                        <div
                          key={p.codigo}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                          onMouseDown={() => { setCodigoProducto(p.codigo); setShowProdSugg(false); }}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>
                          <span className="ml-2">{p.descripcion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              <span>Agregar Componente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo-ingrediente">Código Ingrediente</Label>
                <div className="relative">
                  <Input
                    id="codigo-ingrediente"
                    value={newIngredient.codigo_ingrediente}
                    onChange={(e) => {
                      setNewIngredient(prev => ({ ...prev, codigo_ingrediente: e.target.value.toUpperCase() }));
                      setShowIngSugg(true);
                    }}
                    onFocus={() => newIngredient.codigo_ingrediente && setShowIngSugg(true)}
                    onBlur={() => setTimeout(() => setShowIngSugg(false), 150)}
                    placeholder="Buscar insumo, producto, mano obra o energía..."
                    className="uppercase border-blue-300"
                  />
                  {showIngSugg && ingSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {ingSuggestions.map((i) => (
                        <div
                          key={`${i.tipo}-${i.codigo}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0 flex items-center"
                          onMouseDown={() => {
                            setNewIngredient(prev => ({ ...prev, codigo_ingrediente: i.codigo }));
                            setShowIngSugg(false);
                          }}
                        >
                          <span className="font-mono text-xs text-muted-foreground min-w-[100px]">{i.codigo}</span>
                          <span className="ml-2 flex-1 truncate">{i.descripcion}</span>
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TIPO_COLORS[i.tipo]}`}>
                            {i.tipo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-600">Puede ser insumo, producto, mano obra o matriz energética</p>

                {!ingredienteValido && newIngredient.codigo_ingrediente && descripcionIngrediente !== 'Buscando...' && (
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
                  inputMode="decimal"
                  value={newIngredient.cantidad_ingrediente ?? ''}
                  onChange={(e) => setNewIngredient(prev => ({
                    ...prev,
                    cantidad_ingrediente: e.target.value === '' ? null : Number(e.target.value)
                  }))}
                  placeholder="0.00"
                  className="max-w-60 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ MozAppearance: 'textfield' }} // Firefox
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
        <div className="flex space-x-2 justify-end">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Guardar Componente</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CargarReceta;