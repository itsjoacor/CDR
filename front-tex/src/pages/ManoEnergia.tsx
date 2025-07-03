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
import { Edit, Trash2, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MatrizEnergia {
  codigo_mano_obra: string;
  sector_productivo: string;
  codigo_energia: string;
  descripcion: string;
  consumo_kw_std: number;
  valor_kw: number;
  std_produccion?: number | null;
  total_pesos_std?: number;
  costo_energia_unidad?: number;
  estado?: 'activo' | 'inactivo' | 'mantenimiento';
}

const ManoEnergia: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<MatrizEnergia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MatrizEnergia>>({});
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchEnergia = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/matriz-energia`);
        if (!res.ok) throw new Error('Error al obtener energía');
        const json = await res.json();
        // Ensure all items have estado field
        const dataWithEstado = json.map((item: MatrizEnergia) => ({
          ...item,
          estado: item.estado || 'activo'
        }));
        setData(dataWithEstado);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la matriz de energía',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEnergia();
  }, []);

  const calcularPromedio = (campo: keyof MatrizEnergia) => {
    const nums = data.map(d => typeof d[campo] === 'number' ? Number(d[campo]) : 0);
    return nums.reduce((acc, n) => acc + n, 0) / (nums.length || 1);
  };

  const calcularSuma = (campo: keyof MatrizEnergia) => {
    return data.reduce((acc, d) => acc + (Number(d[campo]) || 0), 0);
  };

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de mano de energía se están exportando a Excel...",
    });
  };

  const handleEdit = (item: MatrizEnergia) => {
    setEditingId(item.codigo_mano_obra);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (!editForm.codigo_energia || !editForm.descripcion || !editForm.valor_kw || !editForm.consumo_kw_std) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-energia/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Error al guardar cambios');

      setData(prev => prev.map(item =>
        item.codigo_mano_obra === editingId ? { ...item, ...editForm } : item
      ));

      toast({
        title: "Guardado exitoso",
        description: "Los cambios se han guardado correctamente.",
      });

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-energia/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setData(prev => prev.filter(item => item.codigo_mano_obra !== id));
      toast({
        title: "Eliminado",
        description: "El registro se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const calcularCosto = (valorKw: number, consumoKw: number) => {
    return (valorKw * consumoKw).toLocaleString('es-CO');
  };

  const getEstadoBadgeVariant = (estado: string | undefined) => {
    switch (estado) {
      case 'activo': return 'default';
      case 'inactivo': return 'secondary';
      case 'mantenimiento': return 'destructive';
      default: return 'secondary';
    }
  };

  const getEnergiaBadgeColor = (codigo: string) => {
    // You can customize this based on your energy types
    if (codigo.toLowerCase().includes('eléctrica')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (codigo.toLowerCase().includes('gas')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (codigo.toLowerCase().includes('vapor')) return 'bg-gray-100 text-gray-800 border-gray-300';
    return 'bg-purple-100 text-purple-800 border-purple-300';
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
              <Button onClick={() => navigate('/cargarEnergia')}>
                ➕ Agregar energia
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.length}</div>
              <div className="text-sm text-muted-foreground">Equipos Registrados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((data.filter(d => d.estado === 'activo').length / data.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Equipos Activos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${calcularPromedio('valor_kw').toLocaleString('es-CO')}
              </div>
              <div className="text-sm text-muted-foreground">Costo Promedio kW</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calcularSuma('consumo_kw_std').toFixed(1)} kW
              </div>
              <div className="text-sm text-muted-foreground">Consumo Total Estándar</div>
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
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando datos...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipo</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>kW Estándar</TableHead>
                    <TableHead>$/kW</TableHead>
                    <TableHead>Producción Estándar</TableHead>
                    <TableHead>Total $ Estándar</TableHead>
                    <TableHead>$/Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((me) => (
                    <TableRow key={me.codigo_mano_obra}>
                      <TableCell>
                        {editingId === me.codigo_mano_obra ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.codigo_energia || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, codigo_energia: e.target.value }))}
                              placeholder="Código de energía"
                            />
                            <Input
                              value={editForm.descripcion || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                              placeholder="Descripción"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{me.codigo_energia}</div>
                            <div className="text-sm text-muted-foreground">{me.descripcion}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_mano_obra ? (
                          <Input
                            value={editForm.sector_productivo || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, sector_productivo: e.target.value }))}
                            placeholder="Sector productivo"
                          />
                        ) : (
                          <Badge variant="outline">{me.sector_productivo}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_mano_obra ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.consumo_kw_std || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, consumo_kw_std: Number(e.target.value) }))}
                            placeholder="Consumo kW std"
                          />
                        ) : (
                          <span className="font-mono">{me.consumo_kw_std} kW</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_mano_obra ? (
                          <Input
                            type="number"
                            value={editForm.valor_kw || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, valor_kw: Number(e.target.value) }))}
                            placeholder="Valor kW"
                          />
                        ) : (
                          <span className="font-mono">${me.valor_kw.toLocaleString('es-CO')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_mano_obra ? (
                          <Input
                            type="number"
                            value={editForm.std_produccion || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, std_produccion: Number(e.target.value) }))}
                            placeholder="Producción std"
                          />
                        ) : (
                          <span>{me.std_produccion ?? '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-green-600 font-semibold">
                        ${me.total_pesos_std?.toLocaleString('es-CO') ?? calcularCosto(me.valor_kw, me.consumo_kw_std)}
                      </TableCell>
                      <TableCell className="font-mono text-blue-600 font-semibold">
                        ${me.costo_energia_unidad?.toLocaleString('es-CO') ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(me.estado)}>
                          {me.estado || 'activo'}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {editingId === me.codigo_mano_obra ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={handleSave}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(me)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el equipo "{me.codigo_energia}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(me.codigo_mano_obra)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
                Costo Energía = Valor kW × Consumo kW Std
              </div>
              <p className="text-sm">
                El costo total incluye el consumo energético estándar del equipo.
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