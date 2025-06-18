
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CDRItem {
  id: string;
  producto: string;
  recetaId: string;
  costoManoObra: number;
  costoManoEnergia: number;
  costoInsumos: number;
  cdrTotal: number;
  fechaCalculo: string;
  margenUtilidad: number;
  precioVentaSugerido: number;
}

const CDR: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cdrData] = useState<CDRItem[]>([
    {
      id: '1',
      producto: 'Camiseta Básica Algodón',
      recetaId: '1',
      costoManoObra: 63600, // (15000*0.5) + (18000*1.2) + (16000*0.8)
      costoManoEnergia: 3940, // (2500*1.0) + (4800*0.3)
      costoInsumos: 18050, // (35000*0.5) + (800*50) + (450*1)
      cdrTotal: 85590,
      fechaCalculo: '2024-06-12 14:30',
      margenUtilidad: 40,
      precioVentaSugerido: 119826
    },
    {
      id: '2',
      producto: 'Pantalón Jean',
      recetaId: '2',
      costoManoObra: 106200, // (15000*0.5) + (22000*1.8) + (16000*0.8) + (20000*0.5)
      costoManoEnergia: 8060, // (3200*0.8) + (2500*1.0) + (4800*0.5)
      costoInsumos: 66400, // (45000*1.2) + (800*80) + (3500*1) + (250*5)
      cdrTotal: 180660,
      fechaCalculo: '2024-06-12 14:30',
      margenUtilidad: 35,
      precioVentaSugerido: 243891
    }
  ]);

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos del CDR se están exportando a Excel...",
    });
  };

  const handleRecalculate = () => {
    toast({
      title: "Recálculo iniciado",
      description: "Se están actualizando todos los CDR con los datos más recientes...",
    });
  };

  const calcularPorcentaje = (parte: number, total: number) => {
    return ((parte / total) * 100).toFixed(1);
  };

  return (
    <Layout title="CDR - Código Directo de Reposición">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-green-50">
              💰 CDR - Cálculo Automático
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Costos de reposición calculados automáticamente a partir de recetas, MO, ME e insumos
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleRecalculate} variant="outline">
              🔄 Recalcular
            </Button>
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
          </div>
        </div>

        {/* Alert Info */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">🛡️</span>
              <span className="text-sm text-green-800">
                <strong>CDR de Solo Lectura:</strong> Los valores se calculan automáticamente. 
                Para modificar el CDR, actualiza los datos en Recetas, Mano de Obra, Mano de Energía o Insumos.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-muted-foreground">Productos Calculados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">$133.125</div>
              <div className="text-sm text-muted-foreground">CDR Promedio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">37.5%</div>
              <div className="text-sm text-muted-foreground">Margen Promedio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">$181.859</div>
              <div className="text-sm text-muted-foreground">Precio Venta Promedio</div>
            </CardContent>
          </Card>
        </div>

        {/* CDR Detail Cards */}
        <div className="space-y-4">
          {cdrData.map((cdr) => (
            <Card key={cdr.id} className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{cdr.producto}</span>
                      <Badge variant="outline" className="bg-green-100">
                        Auto-calculado
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Calculado el {cdr.fechaCalculo} | Receta ID: {cdr.recetaId}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${cdr.cdrTotal.toLocaleString('es-CO')}
                    </div>
                    <div className="text-sm text-muted-foreground">CDR Total</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Desglose de Costos */}
                  <div>
                    <h4 className="font-medium mb-3 text-muted-foreground">DESGLOSE DE COSTOS</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span>👷</span>
                          <span className="text-sm">Mano de Obra</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${cdr.costoManoObra.toLocaleString('es-CO')}</div>
                          <div className="text-xs text-muted-foreground">
                            {calcularPorcentaje(cdr.costoManoObra, cdr.cdrTotal)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span>⚡</span>
                          <span className="text-sm">Mano de Energía</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${cdr.costoManoEnergia.toLocaleString('es-CO')}</div>
                          <div className="text-xs text-muted-foreground">
                            {calcularPorcentaje(cdr.costoManoEnergia, cdr.cdrTotal)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span>📦</span>
                          <span className="text-sm">Insumos</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${cdr.costoInsumos.toLocaleString('es-CO')}</div>
                          <div className="text-xs text-muted-foreground">
                            {calcularPorcentaje(cdr.costoInsumos, cdr.cdrTotal)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div>
                    <h4 className="font-medium mb-3 text-muted-foreground">INFORMACIÓN DE PRECIOS</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-100 rounded border-l-4 border-green-500">
                        <div className="text-sm text-green-800 mb-1">CDR (Costo de Reposición)</div>
                        <div className="text-xl font-bold text-green-600">
                          ${cdr.cdrTotal.toLocaleString('es-CO')}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="text-sm text-blue-800 mb-1">Margen de Utilidad</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {cdr.margenUtilidad}%
                        </div>
                      </div>
                      
                      <div className="p-3 bg-indigo-100 rounded border-l-4 border-indigo-500">
                        <div className="text-sm text-indigo-800 mb-1">Precio de Venta Sugerido</div>
                        <div className="text-xl font-bold text-indigo-600">
                          ${cdr.precioVentaSugerido.toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Formula Info */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">💡 Fórmula de Cálculo del CDR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-green-800">
              <div className="font-mono text-sm bg-white p-3 rounded border">
                CDR = Costo Mano de Obra + Costo Mano de Energía + Costo Insumos
              </div>
              <div className="font-mono text-sm bg-white p-3 rounded border">
                Precio Venta = CDR × (1 + Margen de Utilidad ÷ 100)
              </div>
              <div className="text-sm space-y-2">
                <p><strong>Donde:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Costo MO = Σ(Salario/Hora × Tiempo) para cada tipo de trabajo</li>
                  <li>Costo ME = Σ(Costo Equipo/Hora × Tiempo de Uso) para cada equipo</li>
                  <li>Costo Insumos = Σ(Precio Unitario × Cantidad) para cada material</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CDR;
