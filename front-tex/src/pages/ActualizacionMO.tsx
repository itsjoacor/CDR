import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Cookies from 'js-cookie';

const ActualizarCostoMO: React.FC = () => {
  const token = Cookies.get('token') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nuevoCosto, setNuevoCosto] = useState<string>('');
  const [currentDefault, setCurrentDefault] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Update the fetchDefaultValue function to match backend endpoint
  const fetchDefaultValue = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tabla-config/matriz_mano`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
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

  // Update the handleUpdate function to match backend endpoint
  // ActualizacionME.tsx
  const handleUpdate = async () => {
    const numericValue = parseFloat(nuevoCosto);

    if (isNaN(numericValue)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);


      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tabla-config/matriz_mano`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ valor: numericValue }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Update failed');
      }

      toast({
        title: 'Success',
        description: `Value updated to $${numericValue.toFixed(2)}`,
      });
      await fetchDefaultValue();
    } catch (error) {
      console.error('Update error:', error); // Debug log
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
  }, []);

  return (
    <Layout title="Actualizar Costo Mano de Obra">
      <div className="space-y-6">
        {/* Header */}
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

        {/* Card de edición */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-yellow-600" />
              <span>Actualizar Costo de Mano de obra</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Valor actual */}
            <div className="flex items-center justify-between">
              <Label>Valor actual ($)</Label>
              {loading ? (
                <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
              ) : (
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  ${currentDefault?.toFixed(2) ?? 'N/A'}
                </Badge>
              )}
            </div>

            {/* Input nuevo valor */}
            <div className="space-y-2">
              <Label htmlFor="nuevoCosto">Nuevo valor ($)</Label>
              <Input
                id="nuevoCosto"
                type="number"
                step="0.01"
                min="0.01"
                value={nuevoCosto}
                onChange={(e) => setNuevoCosto(e.target.value)}
                disabled={loading}
                className="text-right text-lg font-medium"
              />
              <p className="text-sm text-muted-foreground">
                Ingrese el nuevo valor global para actualizar todas las filas existentes.
              </p>
            </div>

            {/* Botón */}
            <Button
              onClick={handleUpdate}
              disabled={
                updating ||
                loading ||
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
                  Actualizar Costo
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