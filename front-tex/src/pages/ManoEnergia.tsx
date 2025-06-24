import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ManoEnergia: React.FC = () => {
  interface MatrizEnergia {
    codigo_mano_obra: string;
    sector_productivo: string;
    codigo_energia: string;
    descripcion: string;
    consumo_kw_std: number;
    valor_kw: number;
    std_produccion?: number | null;
    total_pesos_std?: number;
    costo_energia_unidad?: number;
  }

  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MatrizEnergia[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchEnergia = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/matriz-energia`);
        if (!res.ok) throw new Error('Error al obtener energía');
        const json = await res.json();
        setData(json);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la matriz de energía',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEnergia();
  }, []);

  const calcularPromedio = (campo: keyof MatrizEnergia) => {
    const nums = data.map(d => typeof d[campo] === 'number' ? Number(d[campo]) : 0);
    return nums.reduce((acc, n) => acc + n, 0) / (nums.length || 1);
  };

  const calcularSuma = (campo: keyof MatrizEnergia) => {
    return data.reduce((acc, d) => acc + (Number(d[campo]) || 0), 0);
  };

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de mano de energía se están exportando a Excel...",
    });
  };

  return (
    <Layout title="Mano de Energía">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-yellow-50">
              ⚡ Mano de Energía - Recursos Energéticos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Gestión de equipos, consumo energético y costos asociados al proceso productivo
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">📤 Exportar</Button>
            {canEdit && <Button>➕ Nuevo Equipo</Button>}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.length}</div>
            <div className="text-sm text-muted-foreground">Equipos Registrados</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-muted-foreground">Activos (por defecto)</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${calcularPromedio('valor_kw').toLocaleString('es-CO')}
            </div>
            <div className="text-sm text-muted-foreground">Costo Promedio kW</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {calcularSuma('consumo_kw_std').toFixed(1)} kW
            </div>
            <div className="text-sm text-muted-foreground">Consumo Total Estándar</div>
          </CardContent></Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Equipos y Energía</CardTitle>
            <CardDescription>
              Equipos productivos con su consumo energético y costos operativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando datos...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>kW Estándar</TableHead>
                    <TableHead>$/kW</TableHead>
                    <TableHead>Producción Estándar</TableHead>
                    <TableHead>Total $ Estándar</TableHead>
                    <TableHead>$/Unidad</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((me) => (
                    <TableRow key={me.codigo_mano_obra}>
                      <TableCell>
                        <div className="font-medium">{me.codigo_energia}</div>
                        <div className="text-sm text-muted-foreground">{me.descripcion}</div>
                      </TableCell>
                      <TableCell>{me.sector_productivo}</TableCell>
                      <TableCell className="font-mono">{me.consumo_kw_std} kW</TableCell>
                      <TableCell className="font-mono">${me.valor_kw.toLocaleString('es-CO')}</TableCell>
                      <TableCell>{me.std_produccion ?? '—'}</TableCell>
                      <TableCell className="font-mono text-green-600 font-semibold">
                        ${me.total_pesos_std?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600 font-semibold">
                        ${me.costo_energia_unidad?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="outline" size="sm">✏️ Editar</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Formula Info */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">💡 Fórmula de Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-800">
              <div className="font-mono text-sm bg-white p-2 rounded border">
                Costo Unidad = (Consumo kW × Valor kW) ÷ Producción Estándar
              </div>
              <p className="text-sm">
                Este cálculo energético se aplica automáticamente a las recetas a través de los triggers configurados en la base de datos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManoEnergia;
