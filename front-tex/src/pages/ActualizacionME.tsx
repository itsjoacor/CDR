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

const ActualizarCostoME: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nuevoCosto, setNuevoCosto] = useState<string>('');
  const [currentDefault, setCurrentDefault] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDefaultValue = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-energia/default/valor-kw`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add auth token
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(response.status === 401 ?
          'No autorizado - inicie sesión' :
          'Error al cargar el valor actual');
      }

      const data = await response.json();
      setCurrentDefault(data.defaultValue);
      setNuevoCosto(data.defaultValue.toString());
    } catch (error) {
      console.error('Error fetching default value:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaultValue();
  }, []);

  const handleUpdate = async () => {
    const numericValue = parseFloat(nuevoCosto);

    if (isNaN(numericValue)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un valor numérico válido",
        variant: "destructive"
      });
      return;
    }

    if (numericValue <= 0) {
      toast({
        title: "Error",
        description: "El valor debe ser mayor que cero",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-energia/default/valor-kw`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ newValue: numericValue }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          response.status === 401 ? 'No autorizado' :
            errorData.message || 'Error al actualizar'
        );
      }

      const result = await response.json();

      toast({
        title: "Actualización Completada",
        description: `Costo de energía actualizado a $${numericValue.toFixed(2)} (${result.updatedRecords} registros actualizados)`,
      });

      // Refresh the current value after update
      await fetchDefaultValue();
    } catch (error) {
      console.error('Error updating value:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error durante la actualización",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDefaultValue();
    toast({
      title: "Valor actualizado",
      description: "Se ha refrescado el valor actual",
    });
  };

  return (
    <Layout title="Actualizar Costo Energía">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={loading || updating}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </Button>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-yellow-600" />
              <span>Actualizar Costo de Energía</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="currentValue">Valor actual (KW/h)</Label>
                {loading ? (
                  <div className="h-6 w-24 rounded-md bg-muted animate-pulse" />
                ) : (
                  <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                    ${currentDefault?.toFixed(2) || 'N/A'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nuevoCosto">Nuevo valor (KW/h)</Label>
                <Input
                  id="nuevoCosto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={currentDefault?.toFixed(2) || "0.00"}
                  value={nuevoCosto}
                  onChange={(e) => setNuevoCosto(e.target.value)}
                  className="text-right text-lg font-medium"
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Ingrese el nuevo valor para actualizar todos los registros
                </p>
              </div>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={updating || loading || !nuevoCosto || parseFloat(nuevoCosto) === currentDefault}
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

export default ActualizarCostoME;