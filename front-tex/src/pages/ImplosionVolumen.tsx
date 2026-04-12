import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Lock,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

interface ImportResult {
  periodo: string;
  productos_importados: number;
  filas_calculadas: number;
}

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const now = new Date();
const AÑOS = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i));

const ImplosionVolumen: React.FC = () => {
  const token = Cookies.get('token') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [anio, setAnio] = useState(String(now.getFullYear()));
  const [mes, setMes] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [periodosExistentes, setPeriodosExistentes] = useState<string[]>([]);

  const periodo = `${anio}-${mes}`;
  const periodoYaExiste = periodosExistentes.includes(periodo);

  // Cargar periodos ya importados
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/implosion/periodos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setPeriodosExistentes((data ?? []).map((p: any) => p.periodo)))
      .catch(() => {});
  }, []);

  // Limpiar resultado al cambiar periodo
  useEffect(() => {
    setResult(null);
  }, [anio, mes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'Error', description: 'Seleccioná un archivo Excel', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/implosion/import?periodo=${encodeURIComponent(periodo)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al importar');

      setResult(data);
      // Agregar el periodo a la lista de existentes
      setPeriodosExistentes(prev => [...prev, periodo]);

      toast({
        title: 'Implosión importada',
        description: `${data.filas_calculadas} filas calculadas para ${data.productos_importados} productos`,
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Implosión Volumen">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')} disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/resultados-volumen')}
            className="text-teal-700 border-teal-300"
          >
            Ver Resultados
          </Button>
        </div>

        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
          Implosión Volumen — Carga mensual de producción
        </Badge>

        {/* Formato del Excel */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <FileSpreadsheet className="h-5 w-5" />
              Formato del Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              El archivo debe ser <strong>.xlsx</strong> con estas columnas:
            </p>
            <table className="text-sm border rounded-md w-auto">
              <thead className="bg-teal-50">
                <tr>
                  <th className="px-4 py-2 border-r font-semibold text-teal-800">codigo</th>
                  <th className="px-4 py-2 border-r font-semibold text-teal-800">descripcion</th>
                  <th className="px-4 py-2 font-semibold text-teal-800">volumen</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 border-r font-mono text-xs">004703112501</td>
                  <td className="px-4 py-2 border-r text-xs">ROLLO T. PISO COSTURADO BLANCO STAR</td>
                  <td className="px-4 py-2 font-mono text-xs">100</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="px-4 py-2 border-r font-mono text-xs">005800001000</td>
                  <td className="px-4 py-2 border-r text-xs">OTRO PRODUCTO</td>
                  <td className="px-4 py-2 font-mono text-xs">250</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>descripcion</strong> es solo referencia — los nombres vienen de la base de datos.
              Calcula <em>cantidad_producida = cantidad_ingrediente × volumen</em> y{' '}
              <em>cdr_volumen = costo_ingrediente × cantidad_producida</em>.
            </p>
          </CardContent>
        </Card>

        {/* Formulario */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar Implosión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Selectores año + mes */}
            <div className="space-y-2">
              <Label>Periodo *</Label>
              <div className="flex items-center gap-3">
                <Select value={anio} onValueChange={setAnio} disabled={isLoading}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {AÑOS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={mes} onValueChange={setMes} disabled={isLoading}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm font-mono text-muted-foreground">{periodo}</span>
              </div>

              {/* Bloqueo si ya existe */}
              {periodoYaExiste && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-md bg-red-50 border border-red-300">
                  <Lock className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">
                    El periodo <strong>{periodo}</strong> ya fue importado. Para modificarlo hablar con el desarrollador.
                  </p>
                </div>
              )}
            </div>

            {/* Archivo */}
            <div className="space-y-2">
              <Label htmlFor="file-imp">Archivo Excel (.xlsx) *</Label>
              <Input
                id="file-imp"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading || periodoYaExiste}
                className="max-w-sm"
              />
              {file && (
                <p className="text-xs text-teal-700">
                  <strong>{file.name}</strong> — {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={isLoading || !file || periodoYaExiste}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando implosión...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Implosión
                </>
              )}
            </Button>

          </CardContent>
        </Card>

        {/* Resultado */}
        {result && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">
                    Implosión <strong>{result.periodo}</strong> importada correctamente
                  </p>
                  <ul className="text-sm text-green-700 mt-1 space-y-1">
                    <li>Productos importados: <strong>{result.productos_importados}</strong></li>
                    <li>Filas calculadas: <strong>{result.filas_calculadas}</strong></li>
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-green-400 text-green-700"
                    onClick={() => navigate('/resultados-volumen')}
                  >
                    Ver Resultados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
};

export default ImplosionVolumen;
