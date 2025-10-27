import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { useNavigate } from "react-router-dom";

interface ResultadoCDR {
  codigo_producto: string;
  sector_productivo: string;
  descripcion_producto: string;
  base_cdr: number;
}

const ResultadosCDR: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { user } = useAuth();
  const { toast } = useToast();

  const [resultadosCDR, setResultadosCDR] = useState<ResultadoCDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cdrStatus, setCdrStatus] = useState<Record<string, boolean>>({}); // true -> rojo, false -> verde

  const [sectores, setSectores] = useState<string[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>(''); // '' = Todos
  const navigate = useNavigate();

  /** ===== Carga de datos base + verificación CDR ===== */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data: ResultadoCDR[] = await response.json();
      setResultadosCDR(data);
      setError(null);

      // Sectores únicos para el filtro
      const uniqueSectores = Array.from(new Set(data.map(d => d.sector_productivo).filter(Boolean))).sort();
      setSectores(uniqueSectores);

      // Verificar CDR por cada producto (todas las filas)
      await verificarTodosLosCDR(data);
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

  const verificarCdrCero = async (codigoProducto: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/recetas-normalizada/${codigoProducto}/tiene-cdr-cero`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Error en la consulta');
      const data = await response.json();
      return !!data.tieneCdrCero;
    } catch (error) {
      console.error(`Error al verificar CDR cero para ${codigoProducto}:`, error);
      return false;
    }
  };

  const verificarTodosLosCDR = async (productos: ResultadoCDR[]) => {
    const results: Record<string, boolean> = {};
    const CHUNK_SIZE = 12; // tandas para no saturar

    for (let i = 0; i < productos.length; i += CHUNK_SIZE) {
      const slice = productos.slice(i, i + CHUNK_SIZE);
      const batch = await Promise.all(
        slice.map(async (p) => {
          const tieneCdrCero = await verificarCdrCero(p.codigo_producto);
          return [p.codigo_producto, tieneCdrCero] as const;
        })
      );
      batch.forEach(([codigo, tieneCdrCero]) => {
        results[codigo] = tieneCdrCero;
      });
    }

    setCdrStatus(results);
  };

  const handleShow = (producto: ResultadoCDR) => {
    navigate(`/detalle-receta?productId=${producto.codigo_producto}`);
  };
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ===== Derivados: filtro por sector y conteos ===== */
  const filtrados = useMemo(() => {
    if (!sectorSeleccionado) return resultadosCDR;
    return resultadosCDR.filter(r => r.sector_productivo === sectorSeleccionado);
  }, [resultadosCDR, sectorSeleccionado]);

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
            {/* Filtro de sector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Sector:</label>
              <select
                value={sectorSeleccionado}
                onChange={(e) => setSectorSeleccionado(e.target.value)}
                className="border rounded-md px-2 h-9"
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
                  <TableHead className="text-right">Base CDR</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((item) => {
                  const esCdrCero = cdrStatus[item.codigo_producto];
                  const rowColor = esCdrCero
                    ? 'bg-red-100 hover:bg-red-200'
                    : 'bg-green-100 hover:bg-green-200';
                  return (
                    <TableRow key={item.codigo_producto} className={rowColor}>
                      <TableCell>{item.codigo_producto}</TableCell>
                      <TableCell>{item.sector_productivo}</TableCell>
                      <TableCell>{item.descripcion_producto}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.base_cdr).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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