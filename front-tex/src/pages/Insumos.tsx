import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Insumos: React.FC = () => {
  // Tipo en línea según schema
  interface Insumo {
    grupo: string;
    codigo: string;
    detalle: string;
    costo: number;
  }

  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = user?.role === 'admin';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsumos = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/insumos`);
        if (!res.ok) throw new Error('Error al obtener insumos');
        const data = await res.json();
        setInsumos(data);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los insumos desde el servidor',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInsumos();
  }, []);

  const filteredInsumos = insumos.filter(insumo =>
    insumo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.detalle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    insumo.grupo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de insumos se están exportando a Excel...",
    });
  };

  return (
    <Layout title="Gestión de Insumos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-purple-50">
              📦 Insumos - Materiales Externos
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Catálogo de insumos con costos actualizados para el CDR
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate(`/cargarInsumo`)}>➕ Agregar Insumo</Button>

            )}
            <Button onClick={handleExport} variant="outline">📤 Exportar</Button>
          </div>
        </div>

        {/* Buscador */}
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Buscar por código, detalle o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Insumos</CardTitle>
            <CardDescription>
              Información de insumos utilizada en recetas y cálculos CDR
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando insumos...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Costo</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInsumos.map((insumo) => (
                    <TableRow key={insumo.codigo}>
                      <TableCell className="font-mono">{insumo.codigo}</TableCell>
                      <TableCell>{insumo.detalle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{insumo.grupo}</Badge>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-green-600">
                        ${insumo.costo.toLocaleString('es-CO')}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="outline" size="sm">✏️ Editar</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};

export default Insumos;
