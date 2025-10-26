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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, Trash2 } from 'lucide-react';

import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        {/* Upload Card */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <span className="text-2xl">📦</span>
              <div className="text-lg font-semibold">Importar Insumos</div>
            </CardTitle>
            <CardDescription className="text-sm">
              Subí un CSV con <code>grupo,codigo,detalle,costo</code>. El modo <strong>Seguro (UPSERT)</strong> no borra nada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <label htmlFor="csv-upload" className="block text-sm font-medium">
                  Seleccionar archivo CSV
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {selectedFile && !uploading && (
                    <Button variant="outline" size="icon" onClick={handleClearFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="p-3 bg-white rounded-md border border-green-200">
                  <div className="flex items-start space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{result?.mode === 'replace' ? 'Reemplazando…' : 'Importando…'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleUploadUpsert}
                  disabled={!selectedFile || uploading}
                  className="w-full text-white bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Importar (Seguro - UPSERT)</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result / Error */}
        {(result || errorMsg) && (
          <Card className="border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {errorMsg ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span>Resultado de la Importación</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Resultado de la Importación</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errorMsg ? (
                <p className="text-sm text-red-700">{errorMsg}</p>
              ) : result ? (
                <div className="text-sm grid grid-cols-2 gap-2">
                  <div><strong>Modo:</strong> {result.mode}</div>
                  <div><strong>Filas válidas:</strong> {result.total_rows}</div>
                  <div className="col-span-2"><strong>Mensaje:</strong> {result.message}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>
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

export default Importacion;
