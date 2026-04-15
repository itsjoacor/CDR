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
  AlertTriangle,
  Download,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import * as XLSX from 'xlsx';

interface ProductoNoCargado {
  codigo: string;
  descripcion: string;
  volumen: number | string;
  motivo?: string;
}

interface ImportResult {
  periodo: string;
  productos_importados: number;
  productos_en_archivo?: number;
  filas_calculadas: number;
  productos_no_cargados?: ProductoNoCargado[];
  mensaje?: string;
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
  const [showNoCargadosModal, setShowNoCargadosModal] = useState(false);

  const periodo = `${anio}-${mes}`;
  const periodoYaExiste = periodosExistentes.includes(periodo);

  // Cargar periodos ya importados desde la DB (fuente de verdad)
  const fetchPeriodosExistentes = React.useCallback(async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/implosion/periodos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setPeriodosExistentes((data ?? []).map((p: any) => p.periodo));
    } catch { /* silencioso */ }
  }, [token]);

  // Al montar + cada vez que cambian año o mes (evita estado viejo)
  useEffect(() => {
    fetchPeriodosExistentes();
  }, [fetchPeriodosExistentes, anio, mes]);

  // Refrescar al volver a la ventana (p.ej. si borrás el periodo desde Resultados)
  useEffect(() => {
    const onFocus = () => fetchPeriodosExistentes();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchPeriodosExistentes]);

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

      // Re-sincronizar con la DB: la fuente de verdad es siempre la DB,
      // no el estado optimista del frontend
      try {
        const r = await fetch(`${import.meta.env.VITE_API_URL}/implosion/periodos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const periodos = await r.json();
        setPeriodosExistentes((periodos ?? []).map((p: any) => p.periodo));
      } catch { /* silencioso */ }

      // Si hay productos no cargados, abrir el popup automáticamente
      if (data.productos_no_cargados && data.productos_no_cargados.length > 0) {
        setShowNoCargadosModal(true);
      }

      toast({
        title: data.productos_importados > 0 ? 'Implosión importada' : 'Advertencia',
        description: data.mensaje ?? `${data.filas_calculadas} filas calculadas`,
        variant: data.productos_importados === 0 ? 'destructive' : 'default',
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const descargarNoCargados = () => {
    if (!result?.productos_no_cargados?.length) return;
    const filas = result.productos_no_cargados.map((f) => ({
      codigo_producto: f.codigo,
      descripcion_producto: f.descripcion ?? '',
      cantidad_producto_producida: f.volumen,
      motivo: f.motivo ?? '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas);

    // Forzar codigo_producto como texto para preservar ceros a la izquierda
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (ws[cellAddr]) {
        ws[cellAddr].t = 's';
        ws[cellAddr].v = String(ws[cellAddr].v);
        ws[cellAddr].z = '@';
      }
    }

    // Anchos de columna razonables
    ws['!cols'] = [
      { wch: 18 }, // codigo_producto
      { wch: 45 }, // descripcion_producto
      { wch: 18 }, // cantidad_producto_producida
      { wch: 40 }, // motivo
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'No cargados');
    XLSX.writeFile(wb, `productos_no_cargados_${result.periodo}.xlsx`);
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
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El archivo <strong>.xlsx</strong> puede venir en <strong>cualquiera de estos dos formatos</strong>.
              La descripción (si viene) se ignora — siempre se busca en la base de datos.
            </p>

            {/* Variante 1: con descripción */}
            <div>
              <p className="text-xs font-semibold text-teal-700 mb-1">Variante 1 — con descripción (opcional, se ignora):</p>
              <table className="text-sm border rounded-md w-auto">
                <thead className="bg-teal-50">
                  <tr>
                    <th className="px-4 py-2 border-r font-semibold text-teal-800">codigo_producto</th>
                    <th className="px-4 py-2 border-r font-semibold text-teal-800">descripcion_producto</th>
                    <th className="px-4 py-2 font-semibold text-teal-800">cantidad_producto_producida</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 border-r font-mono text-xs">004703112501</td>
                    <td className="px-4 py-2 border-r text-xs text-muted-foreground italic">ROLLO T. PISO COSTURADO…</td>
                    <td className="px-4 py-2 font-mono text-xs">100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Variante 2: solo código + cantidad */}
            <div>
              <p className="text-xs font-semibold text-teal-700 mb-1">Variante 2 — mínimo (sin descripción):</p>
              <table className="text-sm border rounded-md w-auto">
                <thead className="bg-teal-50">
                  <tr>
                    <th className="px-4 py-2 border-r font-semibold text-teal-800">codigo_producto</th>
                    <th className="px-4 py-2 font-semibold text-teal-800">cantidad_producto_producida</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2 border-r font-mono text-xs">004703112501</td>
                    <td className="px-4 py-2 font-mono text-xs">100</td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="px-4 py-2 border-r font-mono text-xs">005800001000</td>
                    <td className="px-4 py-2 font-mono text-xs">250</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Si algún <code>codigo_producto</code> del archivo no tiene receta cargada → se omite y aparece en un popup descargable.
              El resto de los productos se procesa normalmente.
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
          <Card className={`border-l-4 ${result.productos_importados > 0 ? 'border-l-green-500 bg-green-50' : 'border-l-amber-500 bg-amber-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.productos_importados > 0
                  ? <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                  : <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />}
                <div className="flex-1">
                  <p className={`font-semibold ${result.productos_importados > 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    {result.productos_importados > 0
                      ? <>Implosión <strong>{result.periodo}</strong> importada</>
                      : <>Ningún producto del archivo tiene receta cargada</>}
                  </p>
                  <ul className={`text-sm mt-1 space-y-1 ${result.productos_importados > 0 ? 'text-green-700' : 'text-amber-700'}`}>
                    <li>Productos importados: <strong>{result.productos_importados}</strong>
                      {result.productos_en_archivo !== undefined && ` de ${result.productos_en_archivo} del archivo`}
                    </li>
                    <li>Filas calculadas: <strong>{result.filas_calculadas}</strong></li>
                    {result.productos_no_cargados && result.productos_no_cargados.length > 0 && (
                      <li className="text-amber-700 font-medium">
                        ⚠️ {result.productos_no_cargados.length} producto(s) no se cargaron (sin receta en la DB)
                      </li>
                    )}
                  </ul>
                  <div className="flex gap-2 mt-3">
                    {result.productos_importados > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-400 text-green-700"
                        onClick={() => navigate('/resultados-volumen')}
                      >
                        Ver Resultados
                      </Button>
                    )}
                    {result.productos_no_cargados && result.productos_no_cargados.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-400 text-amber-700"
                        onClick={() => setShowNoCargadosModal(true)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Ver no cargados
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Modal: productos no cargados */}
      {showNoCargadosModal && result?.productos_no_cargados && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowNoCargadosModal(false)}
        >
          <Card
            className="max-w-3xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                Filas no cargadas ({result.productos_no_cargados.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNoCargadosModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Estas filas del archivo <strong>no se procesaron</strong>. Revisá el motivo de cada una, corregilas en el archivo fuente y reintentá.
              </p>
              <div className="border rounded-md overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-amber-800">Código</th>
                      <th className="px-3 py-2 text-left font-semibold text-amber-800">Descripción</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-800">Volumen</th>
                      <th className="px-3 py-2 text-left font-semibold text-amber-800">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.productos_no_cargados.map((p, i) => (
                      <tr key={`${p.codigo}-${i}`} className="border-t">
                        <td className="px-3 py-1.5 font-mono text-xs">{p.codigo}</td>
                        <td className="px-3 py-1.5">{p.descripcion || <span className="text-muted-foreground italic">sin descripción</span>}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{String(p.volumen)}</td>
                        <td className="px-3 py-1.5 text-xs text-red-700">{p.motivo ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setShowNoCargadosModal(false)}>
                  Cerrar
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={descargarNoCargados}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default ImplosionVolumen;
