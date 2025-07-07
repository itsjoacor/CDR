
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Database } from 'lucide-react';

const ActualizarCostoME: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nuevoCosto, setNuevoCosto] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!nuevoCosto || isNaN(Number(nuevoCosto))) {
      toast({
        title: "Error",
        description: "Por favor ingresa un valor numérico válido",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    
    // Simulate update process
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Actualización Completada",
        description: `Costo de Matriz Energética actualizado a $${nuevoCosto}`,
      });
      
      // Reset form
      setNuevoCosto('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un problema durante la actualización",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout title="Actualizar ME">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-yellow-600" />
              <span>Actualizar Matriz Energética</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nuevoCosto">Nuevo Costo</Label>
              <Input
                id="nuevoCosto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={nuevoCosto}
                onChange={(e) => setNuevoCosto(e.target.value)}
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el nuevo costo de la unidad energetica KW/h
              </p>
            </div>

            <Button 
              onClick={handleUpdate}
              disabled={isUpdating || !nuevoCosto}
              className="w-full"
              size="lg"
            >
              {isUpdating ? (
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
