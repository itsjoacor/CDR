import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Users, Clock, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';

const CargarManoObra: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sectorProductivo, setSectorProductivo] = useState('');
  const [codigoManoObra, setCodigoManoObra] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [consumoKwStd, setConsumoKwStd] = useState<number>(0);
  const [stdProduccion, setStdProduccion] = useState<number>(0);
  const [horasHombreStd, setHorasHombreStd] = useState<number>(0);
  const [valorHoraHombre, setValorHoraHombre] = useState<number>(3000);
  const [horasPorTurno, setHorasPorTurno] = useState<number>(8);
  const [productoCalculadoStd, setProductoCalculadoStd] = useState<string>('');

  const [sectores, setSectores] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [manoObraExistente, setManoObraExistente] = useState(false);
  const [validatingCodigoManoObra, setValidatingCodigoManoObra] = useState(false);

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

  // Validate mano_obra code when it changes
  useEffect(() => {
    const validarCodigoManoObra = async () => {
      if (!codigoManoObra.trim()) {
        setManoObraExistente(false);
        return;
      }

      setValidatingCodigoManoObra(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/matriz-mano/exists/${encodeURIComponent(codigoManoObra)}`
        );

        if (!response.ok) {
          throw new Error('Error en la validación');
        }

        const data = await response.json();
        setManoObraExistente(data.exists);
      } catch (error) {
        console.error("Error validando código de mano de obra:", error);
        setManoObraExistente(false);
      } finally {
        setValidatingCodigoManoObra(false);
      }
    };

    const timer = setTimeout(validarCodigoManoObra, 500);
    return () => clearTimeout(timer);
  }, [codigoManoObra]);

  const handleSave = async () => {
    if (!sectorProductivo.trim()) {
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

    if (manoObraExistente) {
      toast({
        title: "Error",
        description: "Ya existe una matriz con ese código de mano de obra.",
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

    if (consumoKwStd < 0) {
      toast({
        title: "Error",
        description: "El consumo kW STD no puede ser negativo.",
        variant: "destructive"
      });
      return;
    }

    if (stdProduccion <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un STD de producción válido mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    if (horasHombreStd <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa horas hombre STD válidas mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    if (valorHoraHombre <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un valor por hora hombre válido mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    if (horasPorTurno <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa horas por turno válidas mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    const matrizManoData = {
      sector_productivo: sectorProductivo,
      codigo_mano_obra: codigoManoObra,
      descripcion: descripcion,
      consumo_kw_std: consumoKwStd,
      std_produccion: stdProduccion,
      horas_hombre_std: horasHombreStd,
      valor_hora_hombre: valorHoraHombre,
      horas_por_turno: horasPorTurno,
      producto_calculado_std: productoCalculadoStd || null
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matrizManoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("🔴 Error backend:", errorData);

        const message =
          typeof errorData.message === 'string'
            ? errorData.message
            : Array.isArray(errorData.message)
              ? errorData.message[0]
              : 'Error desconocido al crear matriz de mano de obra';

        throw new Error(message);
      }

      const data = await response.json();

      toast({
        title: "Matriz de mano de obra creada",
        description: `La matriz ${data.codigo_mano_obra} se ha creado exitosamente.`,
      });

      // Reset form
      setSectorProductivo('');
      setCodigoManoObra('');
      setDescripcion('');
      setConsumoKwStd(0);
      setStdProduccion(0);
      setHorasHombreStd(0);
      setValorHoraHombre(3000);
      setHorasPorTurno(8);
      setProductoCalculadoStd('');
      setManoObraExistente(false);

    } catch (error: any) {
      console.error("🟠 error.message:", error.message);

      if (
        error.message?.includes('duplicate key value') ||
        error.message === 'Código de mano de obra ya existente' ||
        error.message === 'El código de mano de obra ya existe'
      ) {
        const codigoInput = document.getElementById('codigo_mano_obra');
        codigoInput?.focus();
        toast({
          title: "Error",
          description: "El código de mano de obra ya existe en la base de datos.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Error",
        description: error.message || 'Error al crear la matriz de mano de obra',
        variant: "destructive"
      });
    }
  };

  // Calculated values (matching the database generated columns)
  const costoManoObra = stdProduccion > 0
    ? (horasHombreStd * valorHoraHombre) / stdProduccion
    : null;

  const cantidadPersonalEstimado = horasPorTurno > 0
    ? horasHombreStd / horasPorTurno
    : null;

  const totalCostoManoObra = horasHombreStd * valorHoraHombre;

  const filteredSectores = inputValue
    ? sectores.filter((sector) =>
      sector.toLowerCase().includes(inputValue.toLowerCase())
    )
    : sectores;

  return (
    <Layout title="Nueva Matriz de Mano de Obra">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/matriz-mano')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Matriz Mano de Obra</span>
          </Button>
        </div>

        {/* Información Básica */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Información Básica</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sector Productivo */}
              <div className="space-y-2">
                <Label htmlFor="sector_productivo">Sector Productivo</Label>
                <Listbox value={sectorProductivo} onChange={setSectorProductivo}>
                  <div className="relative">
                    <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:ring-2 ring-blue-300 flex items-center justify-between">
                      {sectorProductivo || 'Seleccionar sector...'}
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
                              `px-4 py-2 cursor-pointer ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                            }
                          >
                            {({ selected }) => (
                              <div className={`flex items-center ${selected ? 'font-medium' : 'font-normal'}`}>
                                {sector}
                                {selected && (
                                  <svg className="w-5 h-5 ml-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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
                <div className="flex items-center gap-2">
                  <Input
                    id="codigo_mano_obra"
                    value={codigoManoObra}
                    onChange={(e) => setCodigoManoObra(e.target.value)}
                    placeholder="Ej: MO-001"
                    className="text-lg font-semibold"
                    maxLength={20}
                  />
                  {codigoManoObra && (
                    <span className={manoObraExistente ? "text-red-500" : "text-green-500"}>
                      {validatingCodigoManoObra ? "..." : (manoObraExistente ? "Ya existe" : "Disponible")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Código único identificativo (clave primaria)
                </p>
              </div>

              {/* Descripción */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Operación de ensamblaje principal"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Descripción detallada del proceso de mano de obra
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parámetros de Producción */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span>Parámetros de Producción</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Consumo estándar en kilovatios
                </p>
              </div>

              {/* STD Producción */}
              <div className="space-y-2">
                <Label htmlFor="std_produccion">STD Producción</Label>
                <Input
                  id="std_produccion"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={stdProduccion}
                  onChange={(e) => setStdProduccion(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Estándar de producción por unidad
                </p>
              </div>

              {/* Producto Calculado STD */}
              <div className="space-y-2">
                <Label htmlFor="producto_calculado_std">Producto Calculado STD (Opcional)</Label>
                <Input
                  id="producto_calculado_std"
                  value={productoCalculadoStd}
                  onChange={(e) => setProductoCalculadoStd(e.target.value)}
                  placeholder="Ej: Unidades por hora"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Producto o resultado calculado estándar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parámetros de Mano de Obra */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span>Parámetros de Mano de Obra</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Horas Hombre STD */}
              <div className="space-y-2">
                <Label htmlFor="horas_hombre_std">Horas Hombre STD</Label>
                <Input
                  id="horas_hombre_std"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={horasHombreStd}
                  onChange={(e) => setHorasHombreStd(Number(e.target.value))}
                  placeholder="0.00"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Horas hombre estándar requeridas
                </p>
              </div>

              {/* Valor Hora Hombre */}
              <div className="space-y-2">
                <Label htmlFor="valor_hora_hombre">Valor Hora Hombre</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold">$</span>
                  <Input
                    id="valor_hora_hombre"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valorHoraHombre}
                    onChange={(e) => setValorHoraHombre(Number(e.target.value))}
                    placeholder="3000.00"
                    className="text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor por hora hombre (por defecto: $3,000)
                </p>
              </div>

              {/* Horas por Turno */}
              <div className="space-y-2">
                <Label htmlFor="horas_por_turno">Horas por Turno</Label>
                <Input
                  id="horas_por_turno"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={horasPorTurno}
                  onChange={(e) => setHorasPorTurno(Number(e.target.value))}
                  placeholder="8.00"
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-muted-foreground">
                  Horas por turno de trabajo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cálculos Automáticos */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Calculator className="h-5 w-5" />
              <span>Cálculos Automáticos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Total Costo Mano de Obra:</span>
                  <span className="text-blue-800 font-semibold">
                    ${totalCostoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Costo M.O. por Unidad:</span>
                  <span className="text-blue-800 font-semibold">
                    {costoManoObra !== null
                      ? `$${costoManoObra.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`
                      : 'N/A (requiere STD Producción > 0)'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Personal Estimado:</span>
                  <span className="text-blue-800 font-semibold">
                    {cantidadPersonalEstimado !== null
                      ? `${cantidadPersonalEstimado.toFixed(2)} personas`
                      : 'N/A (requiere Horas por Turno > 0)'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-800">
              <span className="text-xl">📋</span>
              <span>Resumen de la Matriz</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Sector:</span>
                  <span className="text-slate-800">{sectorProductivo || 'Sin definir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Código M.O.:</span>
                  <span className="text-slate-800 font-mono">{codigoManoObra || 'Sin definir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Descripción:</span>
                  <span className="text-slate-800">{descripcion || 'Sin definir'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Horas H-H STD:</span>
                  <span className="text-slate-800">{horasHombreStd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">STD Producción:</span>
                  <span className="text-slate-800">{stdProduccion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">Valor Hora:</span>
                  <span className="text-slate-800">${valorHoraHombre.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-2 justify-end">
          <Button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            disabled={validatingCodigoManoObra || manoObraExistente}
          >
            <Save className="h-4 w-4" />
            <span>Guardar Matriz</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CargarManoObra;