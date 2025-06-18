
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RecetaItem {
  id: string;
  nombre: string;
  descripcion: string;
  cantidadProduccion: number;
  unidad: string;
  manoObra: string[];
  manoEnergia: string[];
  insumos: { nombre: string; cantidad: number; unidad: string }[];
  fechaCreacion: string;
  estado: 'activa' | 'inactiva';
}

const Receta: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas] = useState<RecetaItem[]>([
    {
      id: '1',
      nombre: 'Camiseta Básica Algodón',
      descripcion: 'Camiseta básica de algodón 100% talla M',
      cantidadProduccion: 1,
      unidad: 'pieza',
      manoObra: ['Corte', 'Costura', 'Acabado'],
      manoEnergia: ['Máquina de coser', 'Plancha'],
      insumos: [
        { nombre: 'Tela algodón', cantidad: 0.5, unidad: 'metros' },
        { nombre: 'Hilo', cantidad: 50, unidad: 'metros' },
        { nombre: 'Etiqueta', cantidad: 1, unidad: 'pieza' }
      ],
      fechaCreacion: '2024-01-15',
      estado: 'activa'
    },
    {
      id: '2',
      nombre: 'Pantalón Jean',
      descripcion: 'Pantalón jean clásico talla 32',
      cantidadProduccion: 1,
      unidad: 'pieza',
      manoObra: ['Corte', 'Costura especializada', 'Acabado', 'Control calidad'],
      manoEnergia: ['Máquina overlock', 'Máquina recta', 'Plancha industrial'],
      insumos: [
        { nombre: 'Tela denim', cantidad: 1.2, unidad: 'metros' },
        { nombre: 'Hilo reforzado', cantidad: 80, unidad: 'metros' },
        { nombre: 'Cremallera', cantidad: 1, unidad: 'pieza' },
        { nombre: 'Botones', cantidad: 5, unidad: 'piezas' }
      ],
      fechaCreacion: '2024-02-01',
      estado: 'activa'
    }
  ]);

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de recetas se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  return (
    <Layout title="Gestión de Recetas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50">
              📋 Recetas - Corazón del cálculo CDR
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Define materiales, cantidades, mano de obra y energía necesarios para fabricar productos
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button>
                ➕ Nueva Receta
              </Button>
            )}
          </div>
        </div>

        {/* Recetas Cards */}
        <div className="grid gap-6">
          {recetas.map((receta) => (
            <Card key={receta.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{receta.nombre}</span>
                      <Badge variant={receta.estado === 'activa' ? 'default' : 'secondary'}>
                        {receta.estado}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{receta.descripcion}</CardDescription>
                  </div>
                  {canEdit && (
                    <Button variant="outline" size="sm">
                      ✏️ Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Producción */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">PRODUCCIÓN</h4>
                    <div className="text-lg font-semibold">
                      {receta.cantidadProduccion} {receta.unidad}
                    </div>
                  </div>

                  {/* Mano de Obra */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">MANO DE OBRA</h4>
                    <div className="space-y-1">
                      {receta.manoObra.map((mo, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          👷 {mo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Mano de Energía */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">MANO DE ENERGÍA</h4>
                    <div className="space-y-1">
                      {receta.manoEnergia.map((me, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          ⚡ {me}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Insumos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">INSUMOS</h4>
                    <div className="space-y-1">
                      {receta.insumos.map((insumo, index) => (
                        <div key={index} className="text-xs">
                          📦 {insumo.nombre}: {insumo.cantidad} {insumo.unidad}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="text-sm text-blue-800">
                Las recetas son fundamentales para el cálculo automático del CDR. 
                Cualquier modificación se reflejará automáticamente en los costos de reposición.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Receta;
