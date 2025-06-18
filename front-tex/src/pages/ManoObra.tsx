
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ManoObraItem {
  id: string;
  tipo: string;
  descripcion: string;
  salarioHora: number;
  tiempoEstimado: number;
  unidadTiempo: string;
  categoria: string;
  estado: 'activo' | 'inactivo';
}

const ManoObra: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [manoObra] = useState<ManoObraItem[]>([
    {
      id: '1',
      tipo: 'Corte',
      descripcion: 'Corte de tela según patrón',
      salarioHora: 15000,
      tiempoEstimado: 0.5,
      unidadTiempo: 'horas',
      categoria: 'Operario',
      estado: 'activo'
    },
    {
      id: '2',
      tipo: 'Costura',
      descripcion: 'Costura básica en máquina recta',
      salarioHora: 18000,
      tiempoEstimado: 1.2,
      unidadTiempo: 'horas',
      categoria: 'Operario Especializado',
      estado: 'activo'
    },
    {
      id: '3',
      tipo: 'Costura especializada',
      descripcion: 'Costura con técnicas especiales',
      salarioHora: 22000,
      tiempoEstimado: 1.8,
      unidadTiempo: 'horas',
      categoria: 'Especialista',
      estado: 'activo'
    },
    {
      id: '4',
      tipo: 'Acabado',
      descripcion: 'Procesos finales y control de calidad',
      salarioHora: 16000,
      tiempoEstimado: 0.8,
      unidadTiempo: 'horas',
      categoria: 'Operario',
      estado: 'activo'
    }
  ]);

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de mano de obra se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  const calcularCosto = (salarioHora: number, tiempoEstimado: number) => {
    return (salarioHora * tiempoEstimado).toLocaleString('es-CO');
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
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button>
                ➕ Nuevo Tipo MO
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">4</div>
              <div className="text-sm text-muted-foreground">Tipos de MO</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">$17.750</div>
              <div className="text-sm text-muted-foreground">Salario Promedio/Hora</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">4.3h</div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Tipos Activos</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Mano de Obra</CardTitle>
            <CardDescription>
              Tipos de trabajo humano con sus respectivos costos y tiempos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Trabajo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Salario/Hora</TableHead>
                  <TableHead>Tiempo Estimado</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {manoObra.map((mo) => (
                  <TableRow key={mo.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mo.tipo}</div>
                        <div className="text-sm text-muted-foreground">{mo.descripcion}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mo.categoria}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${mo.salarioHora.toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell>
                      {mo.tiempoEstimado} {mo.unidadTiempo}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-green-600">
                      ${calcularCosto(mo.salarioHora, mo.tiempoEstimado)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mo.estado === 'activo' ? 'default' : 'secondary'}>
                        {mo.estado}
                      </Badge>
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
          </CardContent>
        </Card>

        {/* Formula Info */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">💡 Fórmula de Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-orange-800">
              <div className="font-mono text-sm bg-white p-2 rounded border">
                Costo MO = Salario por Hora × Tiempo Estimado
              </div>
              <p className="text-sm">
                Esta fórmula se aplica automáticamente en el cálculo del CDR para cada tipo de mano de obra utilizada en las recetas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManoObra;
