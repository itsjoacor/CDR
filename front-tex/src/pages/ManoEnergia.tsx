
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ManoEnergiaItem {
  id: string;
  equipo: string;
  descripcion: string;
  tipoEnergia: 'eléctrica' | 'gas' | 'vapor' | 'aire comprimido';
  potencia: number;
  unidadPotencia: string;
  costoHora: number;
  tiempoUso: number;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
}

const ManoEnergia: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [manoEnergia] = useState<ManoEnergiaItem[]>([
    {
      id: '1',
      equipo: 'Máquina de coser recta',
      descripcion: 'Máquina industrial para costura básica',
      tipoEnergia: 'eléctrica',
      potencia: 0.5,
      unidadPotencia: 'kW',
      costoHora: 2500,
      tiempoUso: 1.0,
      estado: 'activo'
    },
    {
      id: '2',
      equipo: 'Máquina overlock',
      descripcion: 'Máquina para acabados y costuras especiales',
      tipoEnergia: 'eléctrica',
      potencia: 0.7,
      unidadPotencia: 'kW',
      costoHora: 3200,
      tiempoUso: 0.8,
      estado: 'activo'
    },
    {
      id: '3',
      equipo: 'Plancha industrial',
      descripcion: 'Plancha de vapor para acabados',
      tipoEnergia: 'vapor',
      potencia: 2.5,
      unidadPotencia: 'kW',
      costoHora: 4800,
      tiempoUso: 0.3,
      estado: 'activo'
    },
    {
      id: '4',
      equipo: 'Cortadora eléctrica',
      descripcion: 'Cortadora automática de telas',
      tipoEnergia: 'eléctrica',
      potencia: 1.2,
      unidadPotencia: 'kW',
      costoHora: 3800,
      tiempoUso: 0.5,
      estado: 'mantenimiento'
    }
  ]);

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de mano de energía se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  const calcularCosto = (costoHora: number, tiempoUso: number) => {
    return (costoHora * tiempoUso).toLocaleString('es-CO');
  };

  const getEnergiaBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'eléctrica': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'gas': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'vapor': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'aire comprimido': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo': return 'default';
      case 'inactivo': return 'secondary';
      case 'mantenimiento': return 'destructive';
      default: return 'secondary';
    }
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
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button>
                ➕ Nuevo Equipo
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">4</div>
              <div className="text-sm text-muted-foreground">Equipos Registrados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">75%</div>
              <div className="text-sm text-muted-foreground">Equipos Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">$3.575</div>
              <div className="text-sm text-muted-foreground">Costo Promedio/Hora</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">4.7kW</div>
              <div className="text-sm text-muted-foreground">Potencia Total</div>
            </CardContent>
          </Card>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Tipo de Energía</TableHead>
                  <TableHead>Potencia</TableHead>
                  <TableHead>Costo/Hora</TableHead>
                  <TableHead>Tiempo Uso</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {manoEnergia.map((me) => (
                  <TableRow key={me.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{me.equipo}</div>
                        <div className="text-sm text-muted-foreground">{me.descripcion}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEnergiaBadgeColor(me.tipoEnergia)}>
                        {me.tipoEnergia}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {me.potencia} {me.unidadPotencia}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${me.costoHora.toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell>
                      {me.tiempoUso}h
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-green-600">
                      ${calcularCosto(me.costoHora, me.tiempoUso)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(me.estado)}>
                        {me.estado}
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
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">💡 Fórmula de Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-800">
              <div className="font-mono text-sm bg-white p-2 rounded border">
                Costo ME = Costo por Hora × Tiempo de Uso
              </div>
              <p className="text-sm">
                El costo por hora incluye el consumo energético, depreciación del equipo y mantenimiento. 
                Se calcula automáticamente en el CDR según el uso en cada receta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManoEnergia;
