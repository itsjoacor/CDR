import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type ManoObraAPI = {
  codigo_mano_obra: string;
  sector_productivo: string;
  descripcion: string;
  consumo_kw_std: number;
  std_produccion: number;
  horas_hombre_std: number;
  valor_hora_hombre: number;
  horas_por_turno: number;
  producto_calculado_std?: string;
  costo_mano_obra?: number;
  cantidad_personal_estimado?: number;
};

const ManoObra: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [manoObra, setManoObra] = useState<ManoObraAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'admin';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`);
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json();
        setManoObra(data);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la mano de obra desde el servidor.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calcularPromedio = (campo: keyof ManoObraAPI): number => {
    const numeros = manoObra
      .map((m) => m[campo])
      .filter((val): val is number => typeof val === 'number');
    const total = numeros.reduce((acc, val) => acc + val, 0);
    return numeros.length > 0 ? total / numeros.length : 0;
  };


  return (
    <Layout title="Mano de Obra">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-orange-50">
              👷 Mano de Obra - Trabajo Humano
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Gestión de tiempos, salarios y fórmulas de trabajo humano en el proceso productivo
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate('/cargarManoObra')}>
                ➕ Agregar Mano obra
              </Button>
            )}
            <Button variant="outline">📤 Exportar</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{manoObra.length}</div>
            <div className="text-sm text-muted-foreground">Tipos de MO</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              ${calcularPromedio('valor_hora_hombre').toLocaleString('es-CO')}
            </div>
            <div className="text-sm text-muted-foreground">Salario Promedio/Hora</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {calcularPromedio('horas_hombre_std').toFixed(1)}h
            </div>
            <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-muted-foreground">Tipos Activos</div>
          </CardContent></Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Mano de Obra</CardTitle>
            <CardDescription>
              Tipos de trabajo humano con sus respectivos costos y tiempos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Salario/Hora</TableHead>
                    <TableHead>Tiempo Estimado</TableHead>
                    <TableHead>Costo Estimado</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manoObra.map((mo) => (
                    <TableRow key={mo.codigo_mano_obra}>
                      <TableCell>
                        <div className="font-medium">{mo.codigo_mano_obra}</div>
                        <div className="text-sm text-muted-foreground">{mo.descripcion}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mo.sector_productivo}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        ${mo.valor_hora_hombre.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell>{mo.horas_hombre_std} h</TableCell>
                      <TableCell className="text-green-600 font-semibold font-mono">
                        ${mo.costo_mano_obra?.toLocaleString('es-CO') ?? 'N/A'}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="outline" size="sm">
                            ✏️ Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>


      </div>
    </Layout>
  );
};

export default ManoObra;
