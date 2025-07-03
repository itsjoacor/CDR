// Receta.tsx

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
}

interface ProductoInfo {
  codigo_producto: string;
  descripcion_producto: string;
  sector_productivo: string;
}

const Receta: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recetas, setRecetas] = useState<RecetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cdrValues, setCdrValues] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const productosResponse = await fetch(`${import.meta.env.VITE_API_URL}/productos`);
        if (!productosResponse.ok) throw new Error('Error al obtener productos');
        const productosData: ProductoInfo[] = await productosResponse.json();
        const productosMap = productosData.reduce((acc, prod) => {
          acc[prod.codigo_producto] = prod;
          return acc;
        }, {} as Record<string, ProductoInfo>);

        const recetasResponse = await fetch(`${import.meta.env.VITE_API_URL}/recetas`);
        if (!recetasResponse.ok) throw new Error('Error al obtener recetas');
        const recetasData = await recetasResponse.json();

        const recetasGrouped: Record<string, RecetaItem> = {};

        for (const item of recetasData) {
          if (!recetasGrouped[item.codigo_producto]) {
            const prod = productosMap[item.codigo_producto];
            recetasGrouped[item.codigo_producto] = {
              codigo_producto: item.codigo_producto,
              descripcion_producto: prod?.descripcion_producto || 'Producto no encontrado',
              sector_productivo: prod?.sector_productivo || 'Desconocido',
              ingredientes: [],
              costo_mano_obra: item.costo_mano_obra,
              costo_matriz_energetica: item.costo_matriz_energetica,
              costo_total: item.costo_total
            };
          }

          recetasGrouped[item.codigo_producto].ingredientes.push({
            codigo_ingrediente: item.codigo_ingrediente,
            descripcion_ingrediente: item.descripcion_ingrediente,
            cantidad_ingrediente: item.cantidad_ingrediente,
            costo_ingrediente: item.costo_ingrediente
          });
        }

        const recetasArray = Object.values(recetasGrouped);
        setRecetas(recetasArray);

        const cdrMap: Record<string, number> = {};
        await Promise.all(recetasArray.map(async (receta) => {
          try {
            const cdrRes = await fetch(`${import.meta.env.VITE_API_URL}/resultados-cdr/${receta.codigo_producto}/base`);
            if (!cdrRes.ok) return;
            const cdrData = await cdrRes.json();
            cdrMap[receta.codigo_producto] = cdrData.base_cdr || 0;
          } catch (_) {
            cdrMap[receta.codigo_producto] = 0;
          }
        }));

        setCdrValues(cdrMap);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Fallo en la carga de datos.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-blue-50">📋 Recetas</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Define materiales, cantidades, mano de obra y energía necesarios para fabricar productos.
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate(`/cargarReceta`)}>➕ Nueva Receta</Button>

            )}
            <Button onClick={() => toast({ title: 'Exportando...', description: 'Esto exportará tus recetas.' })} variant="outline">
              📤 Exportar
            </Button>
            <Button onClick={() => navigate(`/detalle-recetas`)} variant="outline">
              Receta Detallada
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {recetas.map((receta) => (
            <Card key={receta.codigo_producto} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{receta.descripcion_producto}</span>
                      <Badge variant="default">{receta.sector_productivo}</Badge>
                    </CardTitle>
                    <CardDescription>Código: {receta.codigo_producto}</CardDescription>
                  </div>
                  {canEdit && (
                    <Button onClick={() => navigate(`/detalle-recetas?producto=${receta.codigo_producto}`)} variant="outline" size="sm">
                      ✏️ Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Costo Directo de Reposición</h4>
                    <div className="text-blue-600 text-xs">
                      🏷️ CDR: ${cdrValues[receta.codigo_producto]?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Receta;
