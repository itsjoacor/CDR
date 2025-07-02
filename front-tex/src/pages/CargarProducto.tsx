import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';

const CargarProducto: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [codigoProducto, setCodigoProducto] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [sectores, setSectores] = useState<string[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [productoExistente, setProductoExistente] = useState(false);
  const [validatingCodigo, setValidatingCodigo] = useState(false);

  // Fetch sectores productivos on component mount
  useEffect(() => {
    const fetchSectores = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos`);
        if (!response.ok) {
          throw new Error('Error al cargar sectores productivos');
        }
        const data = await response.json();
        setSectores(data.map((sector: any) => sector.nombre));
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los sectores productivos",
          variant: "destructive"
        });
      }
    };

    fetchSectores();
  }, []);

  // Validate product code when it changes
  useEffect(() => {
    const validarCodigoProducto = async () => {
      if (!codigoProducto.trim()) {
        setProductoExistente(false);
        return;
      }

      setValidatingCodigo(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/productos/exists/${encodeURIComponent(codigoProducto)}`
        );

        if (!response.ok) {
          throw new Error('Error en la validación');
        }

        const data = await response.json();
        setProductoExistente(data.exists);
      } catch (error) {
        console.error("Error validando código de producto:", error);
        setProductoExistente(false);
      } finally {
        setValidatingCodigo(false);
      }
    };

    const timer = setTimeout(validarCodigoProducto, 500);
    return () => clearTimeout(timer);
  }, [codigoProducto]);

  const handleSave = async () => {
    if (!codigoProducto.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código del producto.",
        variant: "destructive"
      });
      return;
    }

    if (productoExistente) {
      toast({
        title: "Error",
        description: "Ya existe un producto con este código.",
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

    if (!sectorSeleccionado.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona un sector productivo.",
        variant: "destructive"
      });
      return;
    }

    const productoData = {
      codigo_producto: codigoProducto,
      descripcion_producto: descripcionProducto,
      sector_productivo: sectorSeleccionado
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("🔴 Error backend:", errorData);

        const message =
          typeof errorData.message === 'string'
            ? errorData.message
            : Array.isArray(errorData.message)
              ? errorData.message[0]
              : 'Error desconocido al crear producto';

        throw new Error(message);
      }

      const data = await response.json();

      toast({
        title: "Producto creado",
        description: `El producto ${data.codigo_producto} se ha creado exitosamente.`,
      });

      // Reset form
      setCodigoProducto('');
      setDescripcionProducto('');
      setSectorSeleccionado('');
      setInputValue('');
      setProductoExistente(false);

    } catch (error: any) {
      console.error("🟠 error.message:", error.message);

      if (
        error.message?.includes('duplicate key value') ||
        error.message === 'Código de producto ya existente' ||
        error.message === 'El código de producto ya existe'
      ) {
        const codigoInput = document.getElementById('codigo_producto');
        codigoInput?.focus();
        toast({
          title: "Error",
          description: "El código de producto ya existe en la base de datos.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Error",
        description: error.message || 'Error al crear el producto',
        variant: "destructive"
      });
    }
  };

  const filteredSectores = inputValue
    ? sectores.filter((sector) =>
      sector.toLowerCase().includes(inputValue.toLowerCase())
    )
    : sectores;

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
                <div className="flex items-center gap-2">
                  <Input
                    id="codigo_producto"
                    value={codigoProducto}
                    onChange={(e) => setCodigoProducto(e.target.value)}
                    placeholder="Ej: PROD-001"
                    className="text-lg font-semibold max-w-60"
                    maxLength={20}
                  />
                  {codigoProducto && (
                    <span className={productoExistente ? "text-red-500" : "text-green-500"}>
                      {validatingCodigo ? "..." : (productoExistente ? "Código inválido" : "Código válido")}
                    </span>
                  )}
                </div>
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
                <Listbox value={sectorSeleccionado} onChange={setSectorSeleccionado}>
                  <div className="relative">
                    <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-green-300 flex items-center justify-between">
                      {sectorSeleccionado || 'Seleccionar sector...'}
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </ListboxButton>
                    <ListboxOptions className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto">
                      <input
                        type="text"
                        className="w-full px-4 py-2 border-b focus:outline-none"
                        placeholder="Buscar sector..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />
                      {filteredSectores.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No se encontraron sectores</div>
                      ) : (
                        filteredSectores.map((sector) => (
                          <ListboxOption
                            key={sector}
                            value={sector}
                            className={({ active }) =>
                              `px-4 py-2 cursor-pointer ${active ? 'bg-green-100 text-green-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <div className={`flex items-center ${selected ? 'font-medium' : 'font-normal'}`}>
                                {sector}
                                {selected && (
                                  <svg className="w-5 h-5 ml-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </ListboxOption>
                        ))
                      )}
                    </ListboxOptions>
                  </div>
                </Listbox>
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
                <span className="text-green-800">{sectorSeleccionado || 'Sin definir'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex space-x-2 justify-end">
          <Button
            onClick={handleSave}
            className="flex items-center space-x-2"
            disabled={validatingCodigo || productoExistente}
          >
            <Save className="h-4 w-4" />
            <span>Guardar Producto</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CargarProducto;