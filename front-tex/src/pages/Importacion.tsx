// front-tex/src/pages/Importacion.tsx
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Trash2, Lock, ShieldAlert, Download } from 'lucide-react';

import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import Cookies from 'js-cookie';

type ImportSummary = {
  mode: 'upsert' | 'replace';
  total_rows: number;
  inserted_or_updated: number;
  message: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Importacion: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Insumos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Productos
  const [selectedFileProd, setSelectedFileProd] = useState<File | null>(null);
  const [uploadingProd, setUploadingProd] = useState(false);
  const [uploadProgressProd, setUploadProgressProd] = useState(0);
  const [resultProd, setResultProd] = useState<ImportSummary | null>(null);
  const [errorMsgProd, setErrorMsgProd] = useState<string | null>(null);


  // --- helpers ---
  const parseCsv = async (file: File) =>
    new Promise<Record<string, any>[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => String(h).toLowerCase().trim(),
        complete: (r) => {
          if (r.errors?.length) return reject(r.errors[0]);
          resolve(r.data as Record<string, any>[]);
        },
        error: reject,
      });
    });

  const normalizeRow = (r: Record<string, any>) => {
    // Normaliza costo (coma/punto) y trims
    const normCosto = (() => {
      const raw = r.costo ?? r[' costo '] ?? r['costo '];
      if (raw === undefined || raw === null || String(raw).trim() === '') return null;
      const clean = String(raw).replace(/\./g, '').replace(',', '.'); // 1.234,56 => 1234.56
      const n = Number(clean);
      return Number.isFinite(n) ? n : null;
    })();

    return {
      grupo: (r.grupo ?? '').toString().trim(),
      codigo: (r.codigo ?? '').toString().trim(),
      detalle: (r.detalle ?? '').toString().trim(),
      costo: normCosto,
    };
  };

  const normalizeProductoRow = (r: Record<string, any>) => ({
    codigo_producto:      (r.codigo_producto ?? '').toString().trim(),
    descripcion_producto: (r.descripcion_producto ?? '').toString().trim(),
    sector_productivo:    (r.sector_productivo ?? '').toString().trim(),
  });

  const handleFileChangeProd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setResultProd(null);
    setErrorMsgProd(null);
    if (!file) return;
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      setSelectedFileProd(null);
      toast({ title: 'Formato inválido', description: 'Seleccioná un archivo .csv', variant: 'destructive' });
      return;
    }
    setSelectedFileProd(file);
    toast({ title: 'Archivo seleccionado', description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)` });
  };

  const handleClearFileProd = () => {
    setSelectedFileProd(null);
    setUploadProgressProd(0);
    setResultProd(null);
    setErrorMsgProd(null);
  };

  const handleUploadProductos = async () => {
    if (!selectedFileProd) {
      toast({ title: 'No hay archivo', description: 'Seleccioná un CSV primero.', variant: 'destructive' });
      return;
    }
    setUploadingProd(true);
    setUploadProgressProd(10);
    setResultProd(null);
    setErrorMsgProd(null);
    try {
      const rawRows = await parseCsv(selectedFileProd);
      if (!rawRows.length) throw new Error('El CSV está vacío.');
      setUploadProgressProd(40);

      const rows = rawRows
        .map(normalizeProductoRow)
        .filter((r) => r.codigo_producto && r.descripcion_producto && r.sector_productivo);

      if (!rows.length) throw new Error('No se encontraron filas válidas con columnas: codigo_producto, descripcion_producto, sector_productivo.');
      setUploadProgressProd(70);

      const { error: upsertError, count } = await supabase
        .from('productos')
        .upsert(rows, { onConflict: 'codigo_producto', ignoreDuplicates: false, count: 'exact' });

      if (upsertError) throw new Error(upsertError.message);
      setUploadProgressProd(100);

      const res: ImportSummary = {
        mode: 'upsert',
        total_rows: rows.length,
        inserted_or_updated: count ?? rows.length,
        message: `UPSERT completado: ${count ?? rows.length} productos insertados/actualizados.`,
      };
      setResultProd(res);
      toast({ title: 'Importación completada', description: res.message });
      setSelectedFileProd(null);
    } catch (err: any) {
      const msg = err?.message || 'Error importando CSV';
      setErrorMsgProd(msg);
      toast({ title: 'Error al importar', description: msg, variant: 'destructive' });
    } finally {
      setUploadingProd(false);
    }
  };

  // Hook compartido para el card de recetas y su sección expandida
  const recetasState = useRecetasMasivas();

  // --- UI handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setResult(null);
    setErrorMsg(null);

    if (!file) return;

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      setSelectedFile(null);
      toast({
        title: 'Formato inválido',
        description: 'Seleccioná un archivo .csv',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: 'Archivo seleccionado',
      description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
    });
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setResult(null);
    setErrorMsg(null);
  };

  // =========================
  //   MODO SEGURO: UPSERT
  // =========================
  const handleUploadUpsert = async () => {
    if (!selectedFile) {
      toast({ title: 'No hay archivo', description: 'Seleccioná un CSV primero.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setResult(null);
    setErrorMsg(null);

    try {
      // 1) Parsear CSV
      const rawRows = await parseCsv(selectedFile);
      if (!rawRows.length) throw new Error('El CSV está vacío.');
      setUploadProgress(40);

      // 2) Validar y normalizar a esquema de tabla insumos
      const rows = rawRows
        .map(normalizeRow)
        .filter((r) => r.codigo && r.costo !== null) as Array<{ grupo: string; codigo: string; detalle: string; costo: number }>;

      if (!rows.length) throw new Error('No se encontraron filas válidas con columnas: codigo, costo.');

      setUploadProgress(70);

      // 3) UPSERT por PK (codigo)
      //    Requiere RLS que permita insert/update para el rol actual.
      const { error: upsertError, count } = await supabase
        .from('insumos')
        .upsert(rows, { onConflict: 'codigo', ignoreDuplicates: false, count: 'exact' });

      if (upsertError) throw new Error(upsertError.message);

      setUploadProgress(100);
      const insertedOrUpdated = count ?? rows.length;

      const res: ImportSummary = {
        mode: 'upsert',
        total_rows: rows.length,
        inserted_or_updated: insertedOrUpdated,
        message: `UPSERT completado: ${insertedOrUpdated} registros insertados/actualizados.`,
      };
      setResult(res);
      toast({ title: 'Importación completada', description: res.message });
      setSelectedFile(null);
    } catch (err: any) {
      const msg = err?.message || 'Error importando CSV';
      setErrorMsg(msg);
      toast({ title: 'Error al importar', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="Importación de Datos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-green-50">
              📥 Importación - Carga de Datos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Importá <strong>insumos</strong> desde archivos CSV y actualizá el <strong>costo</strong> por <strong>codigo</strong>.
            </p>
          </div>
          <div className="text-right text-sm">
          </div>
        </div>

        {/* Grid de tarjetas de importación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* === IMPORTAR INSUMOS === */}
          <Card className="bg-green-50 border-green-200 hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <span className="text-2xl">📦</span>
                <div className="text-lg font-semibold">Importar Insumos</div>
              </CardTitle>
              <CardDescription className="text-xs">
                CSV con <code>grupo,codigo,detalle,costo</code>. UPSERT (no borra).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-3">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="text-xs text-green-700 flex items-center gap-1 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span className="text-muted-foreground shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
              {uploading && <Progress value={uploadProgress} />}
              <div className="flex-1" />
              <Button
                onClick={handleUploadUpsert}
                disabled={!selectedFile || uploading}
                className="w-full text-white bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Insumos
              </Button>
              {result && !errorMsg && (
                <p className="text-xs text-green-700 bg-white rounded p-2 border border-green-200">
                  ✅ {result.message}
                </p>
              )}
              {errorMsg && (
                <p className="text-xs text-red-700 bg-white rounded p-2 border border-red-200">
                  ❌ {errorMsg}
                </p>
              )}
            </CardContent>
          </Card>

          {/* === IMPORTAR PRODUCTOS === */}
          <Card className="bg-orange-50 border-orange-200 hover:shadow-md transition-shadow flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <span className="text-2xl">🏭</span>
                <div className="text-lg font-semibold">Importar Productos</div>
              </CardTitle>
              <CardDescription className="text-xs">
                CSV con <code>codigo_producto,descripcion_producto,sector_productivo</code>. UPSERT.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-3">
              <Input
                id="csv-upload-prod"
                type="file"
                accept=".csv"
                onChange={handleFileChangeProd}
                disabled={uploadingProd}
              />
              {selectedFileProd && (
                <div className="text-xs text-orange-700 flex items-center gap-1 truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedFileProd.name}</span>
                  <span className="text-muted-foreground shrink-0">({(selectedFileProd.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
              {uploadingProd && <Progress value={uploadProgressProd} />}
              <div className="flex-1" />
              <Button
                onClick={handleUploadProductos}
                disabled={!selectedFileProd || uploadingProd}
                className="w-full text-white bg-orange-600 hover:bg-orange-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar Productos
              </Button>
              {resultProd && !errorMsgProd && (
                <p className="text-xs text-orange-700 bg-white rounded p-2 border border-orange-200">
                  ✅ {resultProd.message}
                </p>
              )}
              {errorMsgProd && (
                <p className="text-xs text-red-700 bg-white rounded p-2 border border-red-200">
                  ❌ {errorMsgProd}
                </p>
              )}
            </CardContent>
          </Card>

          {/* === ACTUALIZACIÓN MASIVA DE RECETAS (card en grid) === */}
          <RecetasMasivasCard
            onUnlock={recetasState.handleUnlock}
            active={recetasState.step !== 'locked'}
          />

        </div>

        {/* === Sección expandida (full-width) cuando se desbloquea === */}
        {recetasState.step !== 'locked' && (
          <RecetasMasivasFullSection state={recetasState} />
        )}

        {/* Nota de seguridad */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚠️ Importante</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-800">
            <p>
              <strong>Recorda no modificar ni el orden ni los titulos de las columas, el reemplazo podria ser caotico.</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// ════════════════════════════════════════════════════════════════════════════
//   ACTUALIZACIÓN MASIVA DE RECETAS — Zona Peligrosa
// ════════════════════════════════════════════════════════════════════════════

const PASSWORD_RECETAS = 'lorenzo';

type RecetasStep = 'locked' | 'password' | 'backup' | 'ready' | 'processing' | 'done';

// Hook compartido para que el card compacto y la sección expandida
// usen el mismo estado
const useRecetasMasivas = () => {
  const { toast } = useToast();
  const token = Cookies.get('token') || '';

  const [step, setStep] = useState<RecetasStep>('locked');
  const [passwordInput, setPasswordInput] = useState('');
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [productosConflicto, setProductosConflicto] = useState<string[]>([]);

  const handleUnlock = () => setStep('password');

  const handleCheckPassword = () => {
    if (passwordInput.trim().toLowerCase() === PASSWORD_RECETAS) {
      setStep('backup');
      setPasswordInput('');
      toast({ title: 'Acceso concedido', description: 'Procedé con precaución.' });
    } else {
      toast({ title: 'Contraseña incorrecta', variant: 'destructive' });
      setPasswordInput('');
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/export?table=recetas_normalizada&format=xlsx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error descargando backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `backup_recetas_${ts}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      setStep('ready');
      toast({ title: 'Backup descargado', description: 'Ahora podés proceder con la actualización.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setResult(null);
    setErrorMsg(null);
    setProductosConflicto([]);
    if (!f) return;
    const ext = f.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast({ title: 'Formato inválido', description: 'Usá .csv, .xlsx o .xls', variant: 'destructive' });
      return;
    }
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setStep('processing');
    setResult(null);
    setErrorMsg(null);
    setProductosConflicto([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/import/recetas?mode=${mode}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.productos_existentes) {
          setProductosConflicto(data.productos_existentes);
        }
        throw new Error(data?.message || 'Error en la importación');
      }
      setResult(data);
      setStep('done');
      toast({ title: 'Importación completada', description: data.message });
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep('ready');
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setStep('locked');
    setPasswordInput('');
    setMode('new');
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    setProductosConflicto([]);
  };

  return {
    step, passwordInput, setPasswordInput, downloadingBackup, mode, setMode,
    file, setFile, result, errorMsg, productosConflicto,
    handleUnlock, handleCheckPassword, handleDownloadBackup,
    handleFileChange, handleImport, handleReset,
  };
};

// Card compacto para la grilla (estado bloqueado)
const RecetasMasivasCard: React.FC<{ onUnlock: () => void; active: boolean }> = ({ onUnlock, active }) => (
  <Card className={`flex flex-col ${active ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'} hover:shadow-md transition-shadow`}>
    <CardHeader>
      <CardTitle className="flex items-center space-x-3">
        <span className="text-2xl">{active ? '⚠️' : '🔒'}</span>
        <div className="text-lg font-semibold">Actualización Recetas</div>
      </CardTitle>
      <CardDescription className="text-xs">
        {active
          ? 'Sección desbloqueada — ver panel abajo'
          : 'Carga/reemplazo masivo. Zona peligrosa.'}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col flex-1 justify-end">
      <Button
        onClick={onUnlock}
        disabled={active}
        variant="outline"
        className={active ? 'border-red-400 text-red-700' : 'border-slate-400'}
      >
        <Lock className="h-4 w-4 mr-2" />
        {active ? 'Sección activa ↓' : 'Desbloquear sección'}
      </Button>
    </CardContent>
  </Card>
);

// Sección full-width que aparece debajo cuando se desbloquea
const RecetasMasivasFullSection: React.FC<{ state: ReturnType<typeof useRecetasMasivas> }> = ({ state }) => {
  const {
    step, passwordInput, setPasswordInput, downloadingBackup, mode, setMode,
    file, setFile, result, errorMsg, productosConflicto,
    handleCheckPassword, handleDownloadBackup, handleFileChange, handleImport, handleReset,
  } = state;

  return (
    <Card className="bg-red-50 border-red-400 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800 text-xl">
          <ShieldAlert className="h-6 w-6 animate-pulse" />
          ⚠️ ZONA PELIGROSA — PROCEDA CON PRECAUCIÓN
        </CardTitle>
        <CardDescription className="text-red-700">
          Esta sección modifica masivamente la tabla <code>recetas_normalizada</code>.
          Las acciones son <strong>irreversibles</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* PASO 1: contraseña */}
        {step === 'password' && (
          <div className="space-y-3 p-4 bg-white border border-red-300 rounded-md">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <Lock className="h-4 w-4" />
              Ingresá la contraseña de seguridad
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckPassword()}
                placeholder="Contraseña..."
                className="max-w-xs"
                autoFocus
              />
              <Button onClick={handleCheckPassword} className="bg-red-600 hover:bg-red-700 text-white">
                Verificar
              </Button>
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* PASO 2: backup obligatorio */}
        {step === 'backup' && (
          <div className="space-y-3 p-4 bg-white border-2 border-red-400 rounded-md">
            <div className="flex items-center gap-2 text-red-800 font-bold">
              <AlertCircle className="h-5 w-5" />
              Para continuar es OBLIGATORIO descargar un backup local de las recetas
            </div>
            <p className="text-sm text-red-700">
              Si algo sale mal con la importación, este archivo te permitirá restaurar el estado actual de la base.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadBackup}
                disabled={downloadingBackup}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingBackup ? 'Descargando...' : 'Exportar Recetas (Backup local)'}
              </Button>
              <Button variant="outline" onClick={handleReset}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* PASO 3: elegir modo + subir archivo */}
        {(step === 'ready' || step === 'processing' || step === 'done') && (
          <div className="space-y-4 p-4 bg-white border border-red-300 rounded-md">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Backup descargado correctamente
            </div>

            {/* Formato requerido del archivo (compartido para ambos modos) */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-800">Formato requerido del archivo (.csv, .xlsx)</span>
              </div>
              <p className="text-xs text-slate-600 mb-2">
                El archivo debe contener <strong>únicamente</strong> estas 3 columnas (en cualquier orden):
              </p>
              <table className="text-xs border border-slate-300 rounded w-auto bg-white">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-1.5 border-r font-semibold text-slate-700">codigo_producto</th>
                    <th className="px-3 py-1.5 border-r font-semibold text-slate-700">codigo_ingrediente</th>
                    <th className="px-3 py-1.5 font-semibold text-slate-700">cantidad_ingrediente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-1 border-r font-mono">400022002118</td>
                    <td className="px-3 py-1 border-r font-mono">005781800900</td>
                    <td className="px-3 py-1 font-mono">0.92</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="px-3 py-1 border-r font-mono">400022002118</td>
                    <td className="px-3 py-1 border-r font-mono">4012</td>
                    <td className="px-3 py-1 font-mono">0.9</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-[11px] text-slate-500 mt-2">
                Cualquier otra columna se ignora. Los nombres deben coincidir exactamente.
              </p>
            </div>

            {/* Selector de modo */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-red-800">Modo de importación</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('new')}
                  disabled={step === 'processing'}
                  className={`text-left p-3 rounded-md border-2 transition ${
                    mode === 'new' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-blue-900">📥 Insertar recetas nuevas</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Solo recetas 100% nuevas. Si algún producto ya tiene receta → frena el proceso.
                  </div>
                </button>
                <button
                  onClick={() => setMode('update')}
                  disabled={step === 'processing'}
                  className={`text-left p-3 rounded-md border-2 transition ${
                    mode === 'update' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-orange-900">🔄 Actualizar recetas</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Permite mezclar nuevas + reemplazar existentes. Para los productos que ya existen, <strong>borra la receta vieja completa</strong> antes de insertar la nueva.
                  </div>
                </button>
              </div>
            </div>

            {/* Selector de archivo */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Subir archivo</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={step === 'processing'}
                  className="flex-1"
                />
                {file && step !== 'processing' && (
                  <Button variant="outline" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && (
                <p className="text-xs text-slate-600">
                  📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Botón de acción */}
            <div className="flex gap-2 pt-2 border-t border-red-200">
              <Button
                onClick={handleImport}
                disabled={!file || step === 'processing'}
                className={mode === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}
              >
                <Upload className="h-4 w-4 mr-2" />
                {step === 'processing' ? 'Procesando...' :
                 mode === 'new' ? 'Importar como nuevas' : 'Actualizar recetas'}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={step === 'processing'}>
                Cerrar
              </Button>
            </div>

            {/* Conflictos en modo "new" */}
            {productosConflicto.length > 0 && (
              <div className="p-3 bg-red-100 border border-red-400 rounded-md">
                <p className="font-semibold text-red-800 mb-2">
                  ❌ {productosConflicto.length} producto(s) ya tienen receta. Cambiá a modo "Actualizar" o quitalos del archivo:
                </p>
                <div className="max-h-40 overflow-y-auto text-xs font-mono text-red-700 space-y-0.5">
                  {productosConflicto.map((p) => <div key={p}>• {p}</div>)}
                </div>
              </div>
            )}

            {/* Resultado */}
            {result && (
              <div className="p-3 bg-green-50 border border-green-300 rounded-md">
                <p className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Importación exitosa
                </p>
                <ul className="text-sm text-green-700 mt-1 space-y-0.5">
                  <li>Filas insertadas: <strong>{result.total_filas_insertadas}</strong></li>
                  <li>Productos únicos: <strong>{result.productos_unicos}</strong></li>
                  <li>Productos nuevos: <strong>{result.productos_nuevos}</strong></li>
                  {result.recetas_reemplazadas > 0 && (
                    <li>Recetas reemplazadas: <strong>{result.recetas_reemplazadas}</strong></li>
                  )}
                </ul>
              </div>
            )}

            {/* Error */}
            {errorMsg && !productosConflicto.length && (
              <div className="p-3 bg-red-100 border border-red-400 rounded-md text-sm text-red-800">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Importacion;
