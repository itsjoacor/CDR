import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';


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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      setResultadosCDR(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados CDR",
        variant: "destructive",
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
      title: "Datos actualizados",
      description: "Los resultados CDR han sido recargados",
    });
  };


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
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Resultados CDR</CardTitle>
          <div className="space-x-2">
            <Button onClick={handleRefresh} variant="outline">Refrescar</Button>
          </div>
        </CardHeader>
        <CardContent> {isLoading? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultadosCDR.map((item) => (
                <TableRow key={item.codigo_producto}>
                  <TableCell>{item.codigo_producto}</TableCell>
                  <TableCell>{item.sector_productivo}</TableCell>
                  <TableCell>{item.descripcion_producto}</TableCell>
                  <TableCell className="text-right">{item.base_cdr.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</TableCell>
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

export default ResultadosCDR;
