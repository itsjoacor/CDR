import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Cookies from 'js-cookie';
import { usePlanta } from '../contexts/PlantaContext';

const ActualizarCostoMO: React.FC = () => {
  const token = Cookies.get('token') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plantaParaEscritura, plantaLabel } = usePlanta();
  const [nuevoCosto, setNuevoCosto] = useState<string>('');
  const [currentDefault, setCurrentDefault] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDefaultValue = async () => {
    if (!plantaParaEscritura) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tabla-config/matriz_mano?planta=${plantaParaEscritura}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener el valor');
      }

      const data = await response.json();
      setCurrentDefault(data.valor);
      setNuevoCosto(data.valor?.toString() || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!plantaParaEscritura) {
      toast({
        title: 'Elegí una planta',
        description: 'En modo "Ambas plantas" no se puede actualizar. Cambiá el header a Catamarca o Varela.',
        variant: 'destructive',
      });
      return;
    }
    const numericValue = parseFloat(nuevoCosto);

    if (isNaN(numericValue)) {
      toast({
        title: 'Error',
        description: 'Ingresá un número válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tabla-config/matriz_mano?planta=${plantaParaEscritura}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ valor: numericValue }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      toast({
        title: 'Actualizado',
        description: `Costo de mano de obra de ${plantaLabel} actualizado a $${numericValue.toFixed(2)}. Se recalculó la matriz de mano de obra de esa planta.`,
      });
      await fetchDefaultValue();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDefaultValue();
    toast({
      title: 'Actualizado',
      description: 'Se ha refrescado el valor actual desde la base de datos.',
    });
  };

  useEffect(() => {
    fetchDefaultValue();
  }, [plantaParaEscritura]);

  return (
    <Layout title="Actualizar Costo Mano de Obra">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>

          <Button variant="ghost" onClick={handleRefresh} disabled={loading || updating}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
        </div>

        {!plantaParaEscritura && (
          <Card className="max-w-md mx-auto border-orange-300 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 text-orange-800">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="text-sm">
                  Estás en modo <strong>"Ambas plantas"</strong>. Para editar el costo de mano de obra cambiá el selector del header a <strong>Catamarca</strong> o <strong>Varela</strong>.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-yellow-600" />
                <span>Valor actual</span>
              </span>
              {plantaParaEscritura && (
                <Badge variant="outline" className="text-xs">
                  Planta {plantaLabel}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Costo mano de obra ($)</Label>
              {loading ? (
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
              ) : (
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  ${currentDefault?.toFixed(2) ?? 'N/A'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Actualizar costo de mano de obra {plantaParaEscritura ? `(${plantaLabel})` : ''}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nuevoCosto">Nuevo valor ($)</Label>
              <Input
                id="nuevoCosto"
                type="number"
                step="0.01"
                min="0.01"
                value={nuevoCosto}
                onChange={(e) => setNuevoCosto(e.target.value)}
                disabled={loading || !plantaParaEscritura}
                className="text-right text-lg font-medium"
              />
              <p className="text-sm text-muted-foreground">
                Este valor se aplica a todas las filas de mano de obra de la planta <strong>{plantaLabel}</strong>. No afecta a la otra planta.
              </p>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={
                updating ||
                loading ||
                !plantaParaEscritura ||
                !nuevoCosto ||
                parseFloat(nuevoCosto) === currentDefault
              }
              className="w-full"
              size="lg"
            >
              {updating ? (
                <>
                  <Database className="h-4 w-4 animate-pulse mr-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Actualizar costo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ActualizarCostoMO;
