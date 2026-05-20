import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanta } from '../contexts/PlantaContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface ResultadoCDR {
  codigo_producto: string;
  sector_productivo: string;
  descripcion_producto: string;
  base_cdr: number;
  base_cdr_final?: number | null;
  monto_flete?: number | null;
  valor_cdr_final?: number | null;
}

const ResultadosCDR: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { user } = useAuth();
  const { plantaParam } = usePlanta();
  const { toast } = useToast();

  const [resultadosCDR, setResultadosCDR] = useState<ResultadoCDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cdrStatus, setCdrStatus] = useState<Record<string, boolean>>({}); // true -> rojo, false -> verde

  const [sectores, setSectores] = useState<string[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>(''); // '' = Todos

  // Buscador con autocomplete
  const [busqueda, setBusqueda] = useState<string>('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  const buscadorRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();

  /** ===== Carga de datos base + verificación CDR ===== */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr?planta=${plantaParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data: ResultadoCDR[] = await response.json();
      setResultadosCDR(data);
      setError(null);

      // Sectores únicos para el filtro
      const uniqueSectores = Array.from(new Set(data.map(d => d.sector_productivo).filter(Boolean))).sort();
      setSectores(uniqueSectores);

      // Verificar CDR en background — la tabla ya se muestra mientras tanto
      verificarTodosLosCDR(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los resultados CDR',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verificarTodosLosCDR = async (productos: ResultadoCDR[]) => {
    const codigos = productos.map(p => p.codigo_producto).join(',');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/batch/cdr-cero?codigos=${encodeURIComponent(codigos)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error en batch CDR');
      const data: Record<string, boolean> = await res.json();
      setCdrStatus(data);
    } catch {
      setCdrStatus({});
    }
  };

  const handleShow = (producto: ResultadoCDR) => {
    navigate(`/detalle-receta?productId=${producto.codigo_producto}`);
  };
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantaParam]);

  /** ===== Derivados: filtro por sector + búsqueda y conteos ===== */
  const busquedaNorm = busqueda.trim().toLowerCase();

  const filtrados = useMemo(() => {
    let arr = resultadosCDR;
    if (sectorSeleccionado) {
      arr = arr.filter(r => r.sector_productivo === sectorSeleccionado);
    }
    if (busquedaNorm) {
      arr = arr.filter(r =>
        (r.codigo_producto ?? '').toLowerCase().includes(busquedaNorm) ||
        (r.descripcion_producto ?? '').toLowerCase().includes(busquedaNorm)
      );
    }
    return arr;
  }, [resultadosCDR, sectorSeleccionado, busquedaNorm]);

  // Sugerencias para autocomplete (limitadas a 8)
  const sugerencias = useMemo(() => {
    if (!busquedaNorm) return [];
    const base = sectorSeleccionado
      ? resultadosCDR.filter(r => r.sector_productivo === sectorSeleccionado)
      : resultadosCDR;
    return base
      .filter(r =>
        (r.codigo_producto ?? '').toLowerCase().includes(busquedaNorm) ||
        (r.descripcion_producto ?? '').toLowerCase().includes(busquedaNorm)
      )
      .slice(0, 8);
  }, [resultadosCDR, sectorSeleccionado, busquedaNorm]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const total = resultadosCDR.length;
  const visibles = filtrados.length;

  const handleRefresh = () => {
    fetchData();
    toast({
      title: 'Datos actualizados',
      description: 'Los resultados CDR han sido recargados',
    });
  };

  /** ===== Render ===== */
  if (error) {
    return (
      <Layout title="Error al cargar">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-500 text-lg font-medium">{error}</div>
          <Button onClick={fetchData} variant="outline">
            Reintentar
          </Button>
          <div className="text-sm text-gray-500">
            Ver consola para más detalles (F12 → Console)
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Resultados CDR">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Resultados CDR</CardTitle>

          <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
            {/* Buscador con autocomplete */}
            <div ref={buscadorRef} className="relative w-full md:w-72">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por código o descripción..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setMostrarSugerencias(true);
                  }}
                  onFocus={() => setMostrarSugerencias(true)}
                  className="pl-8 pr-8 h-9"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => { setBusqueda(''); setMostrarSugerencias(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Dropdown de sugerencias */}
              {mostrarSugerencias && busquedaNorm && sugerencias.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-card border rounded-md shadow-lg max-h-72 overflow-y-auto">
                  {sugerencias.map((s) => (
                    <button
                      key={s.codigo_producto}
                      type="button"
                      onClick={() => {
                        setBusqueda(s.codigo_producto);
                        setMostrarSugerencias(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                    >
                      <div className="font-mono font-semibold text-foreground">
                        {s.codigo_producto}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.descripcion_producto}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {s.sector_productivo}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {mostrarSugerencias && busquedaNorm && sugerencias.length === 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
                  Sin resultados
                </div>
              )}
            </div>

            {/* Filtro de sector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Sector:</label>
              <select
                value={sectorSeleccionado}
                onChange={(e) => setSectorSeleccionado(e.target.value)}
                className="border rounded-md px-2 h-9 bg-background text-foreground"
              >
                <option value="">Todos</option>
                {sectores.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Contador */}
            <div className="text-sm text-muted-foreground ml-auto md:ml-2">
              Mostrando <b>{visibles}</b> de <b>{total}</b> productos
            </div>

            <Button onClick={handleRefresh} variant="outline">
              Refrescar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Producto</TableHead>
                  <TableHead>Sector Productivo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right" title="CDR + mantención + (valor_flete × m³ si aplica)">CDR Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((item) => {
                  const esCdrCero = cdrStatus[item.codigo_producto];
                  const rowColor = esCdrCero
                    ? 'bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/50'
                    : 'bg-green-100 hover:bg-green-200 dark:bg-green-950/40 dark:hover:bg-green-900/50';
                  const total = Number(
                    item.valor_cdr_final ?? item.base_cdr_final ?? item.base_cdr ?? 0
                  );
                  const tieneFlete = Number(item.monto_flete ?? 0) > 0;
                  return (
                    <TableRow key={item.codigo_producto} className={rowColor}>
                      <TableCell>{item.codigo_producto}</TableCell>
                      <TableCell>{item.sector_productivo}</TableCell>
                      <TableCell>{item.descripcion_producto}</TableCell>
                      <TableCell
                        className="text-right font-semibold"
                        title={
                          `CDR puro: ${Number(item.base_cdr ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                          `+ Mantención: ${Number(item.base_cdr_final ?? item.base_cdr ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                          `+ Flete: ${Number(item.monto_flete ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                          `= Total: ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        }
                      >
                        {total.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        {tieneFlete && <span className="ml-1 text-xs text-amber-700 dark:text-amber-300" title="Incluye flete">🚚</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShow(item)}
                          className="flex items-center justify-center mx-auto"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {visibles === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No hay productos para el filtro seleccionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ResultadosCDR;