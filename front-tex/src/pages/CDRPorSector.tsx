// src/pages/CDRPorSector.tsx
import React, { useState, useEffect } from 'react';
import { usePlanta } from '../contexts/PlantaContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';

interface ResultadoCDR {
  sector_productivo: string;
  planta?: 'catamarca' | 'varela';
  base_cdr: number;
  base_cdr_final: number | null;
}

interface SectorMantencion {
  nombre: string;
  planta?: 'catamarca' | 'varela';
  porcentaje_mantencion: number | null;
}

const PLANTA_BADGE: Record<string, string> = {
  catamarca: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  varela:    'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
};

const CDRPorSector: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { plantaParam } = usePlanta();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [agrupados, setAgrupados] = useState<
    { sector: string; planta: string; totalCDR: number; porcentajeMantencion: number; totalCDRFinal: number }[]
  >([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const [resCDR, resSectores] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr?planta=${plantaParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos/mantencion?planta=${plantaParam}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!resCDR.ok) throw new Error(`Error resultados: ${resCDR.status}`);
      if (!resSectores.ok) throw new Error(`Error sectores: ${resSectores.status}`);

      const [dataCDR, dataSectores]: [ResultadoCDR[], SectorMantencion[]] = await Promise.all([
        resCDR.json(),
        resSectores.json(),
      ]);

      // Agrupar por (sector, planta) — sectores tienen mantención per-planta y
      // los productos viven por planta. En modo "Ambas Plantas" cada combinación
      // sale como fila separada.
      const mapa = new Map<string, { sector: string; planta: string; total: number; totalFinal: number }>();
      dataCDR.forEach((item) => {
        const planta = item.planta ?? 'catamarca';
        const key = `${item.sector_productivo}__${planta}`;
        const actual = mapa.get(key) ?? { sector: item.sector_productivo, planta, total: 0, totalFinal: 0 };
        const finalVal = item.base_cdr_final ?? item.base_cdr;
        mapa.set(key, {
          sector: item.sector_productivo,
          planta,
          total: actual.total + Number(item.base_cdr),
          totalFinal: actual.totalFinal + Number(finalVal),
        });
      });

      // Construir array con porcentajes (la mantención también es per-planta)
      const resultado = Array.from(mapa.values()).map(({ sector, planta, total, totalFinal }) => {
        const sectorInfo = dataSectores.find((s) =>
          s.nombre === sector && (s.planta ?? 'catamarca') === planta,
        ) ?? dataSectores.find((s) => s.nombre === sector); // fallback
        return {
          sector,
          planta,
          totalCDR: total,
          totalCDRFinal: totalFinal,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantaParam]);

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
                  <TableHead>Planta</TableHead>
                  <TableHead className="text-right">Total CDR</TableHead>
                  <TableHead className="text-right">% Mantención</TableHead>
                  <TableHead className="text-right">Total CDR + Mantención</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agrupados.map((s) => (
                  <TableRow key={`${s.sector}__${s.planta}`}>
                    <TableCell className="font-medium">{s.sector}</TableCell>
                    <TableCell>
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${PLANTA_BADGE[s.planta]}`}>
                        {s.planta}
                      </span>
                    </TableCell>
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
