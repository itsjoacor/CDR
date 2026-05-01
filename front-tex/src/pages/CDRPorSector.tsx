// src/pages/CDRPorSector.tsx
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';

interface ResultadoCDR {
  sector_productivo: string;
  base_cdr: number;
  base_cdr_final: number | null;
}

interface SectorMantencion {
  nombre: string;
  porcentaje_mantencion: number | null;
}

const CDRPorSector: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [agrupados, setAgrupados] = useState<
    { sector: string; totalCDR: number; porcentajeMantencion: number; totalCDRFinal: number }[]
  >([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [resCDR, resSectores] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos/mantencion`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!resCDR.ok) throw new Error(`Error resultados: ${resCDR.status}`);
      if (!resSectores.ok) throw new Error(`Error sectores: ${resSectores.status}`);

      const [dataCDR, dataSectores]: [ResultadoCDR[], SectorMantencion[]] = await Promise.all([
        resCDR.json(),
        resSectores.json(),
      ]);

      // Agrupar por sector y sumar base_cdr (crudo) y base_cdr_final (con mantención)
      const mapa = new Map<string, { total: number; totalFinal: number }>();
      dataCDR.forEach((item) => {
        const actual = mapa.get(item.sector_productivo) ?? { total: 0, totalFinal: 0 };
        const finalVal = item.base_cdr_final ?? item.base_cdr;
        mapa.set(item.sector_productivo, {
          total: actual.total + Number(item.base_cdr),
          totalFinal: actual.totalFinal + Number(finalVal),
        });
      });

      // Construir array con porcentajes
      const resultado = Array.from(mapa.entries()).map(([sector, sums]) => {
        const sectorInfo = dataSectores.find((s) => s.nombre === sector);
        return {
          sector,
          totalCDR: sums.total,
          totalCDRFinal: sums.totalFinal,
          porcentajeMantencion: sectorInfo?.porcentaje_mantencion ?? 0,
        };
      });

      setAgrupados(resultado);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los resultados CDR por sector',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
    toast({
      title: 'Datos actualizados',
      description: 'Los resultados CDR por sector han sido recargados',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);


  return (
    <Layout title="Resumen CDR por Sector">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Resumen CDR por Sector Productivo</CardTitle>
          <Button onClick={handleRefresh} variant="outline">
            Refrescar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sector Productivo</TableHead>
                  <TableHead className="text-right">Total CDR</TableHead>
                  <TableHead className="text-right">% Mantención</TableHead>
                  <TableHead className="text-right">Total CDR + Mantención</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agrupados.map((s) => (
                  <TableRow key={s.sector}>
                    <TableCell className="font-medium">{s.sector}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(s.totalCDR)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.porcentajeMantencion}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(s.totalCDRFinal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default CDRPorSector;
