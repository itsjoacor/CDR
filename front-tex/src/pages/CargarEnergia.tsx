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

const CargarEnergia: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [codigoManoObra, setCodigoManoObra] = useState('');
  const [codigoEnergia, setCodigoEnergia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [consumoKwStd, setConsumoKwStd] = useState<number>(0);
  const [valorKw, setValorKw] = useState<number>(89.40);
  const [stdProduccion, setStdProduccion] = useState<number | null>(null);
  
  const [sectores, setSectores] = useState<string[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState('');
  const [inputValue, setInputValue] = useState('');

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

  const handleSave = async () => {
    if (!sectorSeleccionado.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona un sector productivo.",
        variant: "destructive"
      });
      return;
    }

    if (!codigoManoObra.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de mano de obra.",
        variant: "destructive"
      });
      return;
    }

    if (!codigoEnergia.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de energía.",
        variant: "destructive"
      });
      return;
    }

    if (!descripcion.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa la descripción.",
        variant: "destructive"
      });
      return;
    }

    if (consumoKwStd <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un consumo kW válido mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    if (valorKw <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un valor kW válido mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    // Crear el objeto que se enviará al backend
    const matrizEnergiaData = {
      sector_productivo: sectorSeleccionado,
      codigo_mano_obra: codigoManoObra,
      codigo_energia: codigoEnergia,
      descripcion: descripcion,
      consumo_kw_std: consumoKwStd,
      valor_kw: valorKw,
      std_produccion: stdProduccion
    };

    // Mostrar en consola lo que se enviará
    console.log('Datos a enviar al backend:', matrizEnergiaData);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-energia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matrizEnergiaData),
      });

      // Mostrar la respuesta del servidor en consola
      console.log('Respuesta del servidor:', response);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al crear matriz de energía');
      }

      const data = await response.json();
      console.log('Datos recibidos del servidor:', data);

      toast({
        title: "Matriz de energía creada",
        description: `La matriz ${data.codigo_mano_obra} se ha creado exitosamente.`,
      });

      // Reset form
      setCodigoManoObra('');
      setCodigoEnergia('');
      setDescripcion('');
      setConsumoKwStd(0);
      setValorKw(89.40);
      setStdProduccion(null);
      setSectorSeleccionado('');
      setInputValue('');

    } catch (error: any) {
      console.log('Error en la solicitud:', error);
      toast({
        title: "Error",
        description: error.message.includes('Ya existe')
          ? "Ya existe una matriz con este código de mano de obra"
          : "Error al crear la matriz de energía",
        variant: "destructive"
      });
    }
  };

  const filteredSectores = inputValue
    ? sectores.filter((sector) =>
      sector.toLowerCase().includes(inputValue.toLowerCase())
    )
    : sectores;

  const totalPesosStd = consumoKwStd * valorKw;
  const costoEnergiaUnidad = stdProduccion && stdProduccion > 0 
    ? totalPesosStd / stdProduccion 
    : null;

  return (
    <Layout title="Nueva Matriz de Energía">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/matriz-energia')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Matriz Energía</span>
          </Button>
        </div>

        {/* Info Badge */}
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          ⚡ Crear Nueva Matriz de Energía
        </Badge>

        {/* Información de la Matriz */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-xl">⚡</span>
              <span>Información de la Matriz de Energía</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sector Productivo */}
              <div className="space-y-2">
                <Label htmlFor="sector_productivo">Sector Productivo</Label>
                <Listbox value={sectorSeleccionado} onChange={setSectorSeleccionado}>
                  <div className="relative">
                    <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-yellow-300 flex items-center justify-between max-w-80">
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
                              `px-4 py-2 cursor-pointer ${active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <div className={`flex items-center ${selected ? 'font-medium' : 'font-normal'}`}>
                                {sector}
                                {selected && (
                                  <svg className="w-5 h-5 ml-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
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
                  Sector productivo al que pertenece la matriz
                </p>
              </div>

              {/* Código Mano de Obra */}
              <div className="space-y-2">
                <Label htmlFor="codigo_mano_obra">Código Mano de Obra</Label>
                <Input
                  id="codigo_mano_obra"
                  value={codigoManoObra}
                  onChange={(e) => setCodigoManoObra(e.target.value)}
                  placeholder="Ej: MO-001"
                  className="text-lg font-semibold max-w-60"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Código único identificativo de mano de obra (clave primaria)
                </p>
              </div>

              {/* Código Energía */}
              <div className="space-y-2">
                <Label htmlFor="codigo_energia">Código Energía</Label>
                <Input
                  id="codigo_energia"
                  value={codigoEnergia}
                  onChange={(e) => setCodigoEnergia(e.target.value)}
                  placeholder="Ej: EN-001"
                  className="text-lg font-semibold max-w-60"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Código identificativo de energía
                </p>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Consumo energético para proceso de corte"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Descripción detallada del proceso energético
                </p>
              </div>

              {/* Consumo kW STD */}
              <div className="space-y-2">
                <Label htmlFor="consumo_kw_std">Consumo kW STD</Label>
                <Input
                  id="consumo_kw_std"
                  type="number"
                  step="0.01"
                  min="0"
                  value={consumoKwStd}
                  onChange={(e) => setConsumoKwStd(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-lg font-semibold max-w-60"
                />
                <p className="text-xs text-muted-foreground">
                  Consumo estándar en kilovatios
                </p>
              </div>

              {/* Valor kW */}
              <div className="space-y-2">
                <Label htmlFor="valor_kw">Valor kW</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold">$</span>
                  <Input
                    id="valor_kw"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorKw}
                    onChange={(e) => setValorKw(Number(e.target.value))}
                    placeholder="89.40"
                    className="text-lg font-semibold max-w-60"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor por kilovatio (por defecto: $89.40)
                </p>
              </div>

              {/* STD Producción */}
              <div className="space-y-2">
                <Label htmlFor="std_produccion">STD Producción (Opcional)</Label>
                <Input
                  id="std_produccion"
                  type="number"
                  step="0.01"
                  min="0"
                  value={stdProduccion || ''}
                  onChange={(e) => setStdProduccion(e.target.value ? Number(e.target.value) : null)}
                  placeholder="0.00"
                  className="text-lg font-semibold max-w-60"
                />
                <p className="text-xs text-muted-foreground">
                  Estándar de producción (se copiará desde mano de obra si no se especifica)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cálculos Automáticos */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <span className="text-xl">🔢</span>
              <span>Cálculos Automáticos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Total Pesos STD:</span>
                <span className="text-yellow-800 font-semibold">
                  ${totalPesosStd.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Costo Energía por Unidad:</span>
                <span className="text-yellow-800 font-semibold">
                  {costoEnergiaUnidad !== null 
                    ? `$${costoEnergiaUnidad.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                    : 'N/A (requiere STD Producción)'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <span className="text-xl">📋</span>
              <span>Resumen de la Matriz</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Sector:</span>
                <span className="text-yellow-800">{sectorSeleccionado || 'Sin definir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Código M.O.:</span>
                <span className="text-yellow-800 font-mono">{codigoManoObra || 'Sin definir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Código Energía:</span>
                <span className="text-yellow-800 font-mono">{codigoEnergia || 'Sin definir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700 font-medium">Descripción:</span>
                <span className="text-yellow-800">{descripcion || 'Sin definir'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-2 justify-end">
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Guardar Matriz</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CargarEnergia;