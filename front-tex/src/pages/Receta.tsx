import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface RecetaItem {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
  ingredientes: {
    codigo_ingrediente: string;
    descripcion_ingrediente: string;
    cantidad_ingrediente: number;
    costo_ingrediente?: number;
  }[];
  costo_mano_obra?: number;
  costo_matriz_energetica?: number;
  costo_total?: number;
  valor_cdr?: number;
}

const Receta: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas, setRecetas] = useState<RecetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/recetas`);
        if (!response.ok) {
          throw new Error('Error al obtener recetas');
        }
        const data = await response.json();

        // Group by codigo_producto
        const groupedRecetas = data.reduce((acc: Record<string, RecetaItem>, item: any) => {
          if (!acc[item.codigo_producto]) {
            acc[item.codigo_producto] = {
              codigo_producto: item.codigo_producto,
              descripcion_producto: item.descripcion_producto,
              sector_productivo: item.sector_productivo,
              ingredientes: [],
              costo_mano_obra: item.costo_mano_obra,
              costo_matriz_energetica: item.costo_matriz_energetica,
              costo_total: item.costo_total,
              valor_cdr: item.valor_cdr
            };
          }
          acc[item.codigo_producto].ingredientes.push({
            codigo_ingrediente: item.codigo_ingrediente,
            descripcion_ingrediente: item.descripcion_ingrediente,
            cantidad_ingrediente: item.cantidad_ingrediente,
            costo_ingrediente: item.costo_ingrediente
          });
          return acc;
        }, {});

        setRecetas(Object.values(groupedRecetas));
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar recetas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecetas();
  }, []);

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de recetas se están exportando a Excel...",
    });
  };

  const canEdit = user?.role === 'admin';

  if (loading) {
    return (
      <Layout title="Gestión de Recetas">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Recetas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50">
              📋 Recetas
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
            <Card key={receta.codigo_producto} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{receta.descripcion_producto}</span>
                      <Badge variant="default">
                        {receta.sector_productivo}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Código: {receta.codigo_producto}</CardDescription>
                  </div>
                  {canEdit && (
                    <Button onClick={() => navigate(`/editarReceta/${receta.codigo_producto}`)} variant="outline" size="sm">
                      ✏️ Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Insumos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">OTRO CAMPO X</h4>
                    <div className="space-y-1">

                    </div>
                  </div>

                  {/* Costos */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Costo Directo de Resposicion</h4>
                    <div className="space-y-1 text-xs">
                      <div className="text-blue-600">
                        🏷️ CDR: ${receta.valor_cdr?.toFixed(2) || '0.00'}
                      </div>
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