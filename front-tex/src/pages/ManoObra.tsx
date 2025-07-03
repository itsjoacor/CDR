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

type ManoObraAPI = {
  codigo_mano_obra: string;
  sector_productivo: string;
  descripcion: string;
  consumo_kw_std: number;
  std_produccion: number;
  horas_hombre_std: number;
  valor_hora_hombre: number;
  horas_por_turno: number;
  producto_calculado_std?: string;
  costo_mano_obra?: number;
  cantidad_personal_estimado?: number;
  estado?: 'activo' | 'inactivo';
};

const ManoObra: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [manoObra, setManoObra] = useState<ManoObraAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ManoObraAPI>>({});
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`);
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json();
        // Ensure all items have estado field
        const dataWithEstado = data.map((item: ManoObraAPI) => ({
          ...item,
          estado: item.estado || 'activo'
        }));
        setManoObra(dataWithEstado);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la mano de obra desde el servidor.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calcularPromedio = (campo: keyof ManoObraAPI): number => {
    const numeros = manoObra
      .map((m) => m[campo])
      .filter((val): val is number => typeof val === 'number');
    const total = numeros.reduce((acc, val) => acc + val, 0);
    return numeros.length > 0 ? total / numeros.length : 0;
  };

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos de mano de obra se están exportando a Excel...",
    });
  };

  const handleEdit = (item: ManoObraAPI) => {
    setEditingId(item.codigo_mano_obra);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (!editForm.codigo_mano_obra || !editForm.descripcion || !editForm.valor_hora_hombre || !editForm.horas_hombre_std) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Error al guardar cambios');

      setManoObra(prev => prev.map(item =>
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setManoObra(prev => prev.filter(item => item.codigo_mano_obra !== id));
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

  const calcularCosto = (valorHora: number, horas: number) => {
    return (valorHora * horas).toLocaleString('es-CO');
  };

  return (
    <Layout title="Mano de Obra">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-orange-50">
              👷 Mano de Obra - Trabajo Humano
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Gestión de tiempos, salarios y fórmulas de trabajo humano en el proceso productivo
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button onClick={() => navigate('/cargarManoObra')}>
                ➕ Agregar Mano obra
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{manoObra.length}</div>
              <div className="text-sm text-muted-foreground">Tipos de MO</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ${calcularPromedio('valor_hora_hombre').toLocaleString('es-CO')}
              </div>
              <div className="text-sm text-muted-foreground">Salario Promedio/Hora</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calcularPromedio('horas_hombre_std').toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((manoObra.filter(m => m.estado === 'activo').length / manoObra.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Tipos Activos</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Mano de Obra</CardTitle>
            <CardDescription>
              Tipos de trabajo humano con sus respectivos costos y tiempos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Trabajo</TableHead>
                    <TableHead>Sector Productivo</TableHead>
                    <TableHead>Salario/Hora</TableHead>
                    <TableHead>Tiempo Estimado</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Estado</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manoObra.map((mo) => (
                    <TableRow key={mo.codigo_mano_obra}>
                      <TableCell>
                        {editingId === mo.codigo_mano_obra ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.codigo_mano_obra || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, codigo_mano_obra: e.target.value }))}
                              placeholder="Código"
                            />
                            <Input
                              value={editForm.descripcion || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                              placeholder="Descripción"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{mo.codigo_mano_obra}</div>
                            <div className="text-sm text-muted-foreground">{mo.descripcion}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === mo.codigo_mano_obra ? (
                          <Input
                            value={editForm.sector_productivo || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, sector_productivo: e.target.value }))}
                            placeholder="Sector productivo"
                          />
                        ) : (
                          <Badge variant="outline">{mo.sector_productivo}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === mo.codigo_mano_obra ? (
                          <Input
                            type="number"
                            value={editForm.valor_hora_hombre || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, valor_hora_hombre: Number(e.target.value) }))}
                            placeholder="Salario por hora"
                          />
                        ) : (
                          <span className="font-mono">${mo.valor_hora_hombre.toLocaleString('es-CO')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === mo.codigo_mano_obra ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.horas_hombre_std || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, horas_hombre_std: Number(e.target.value) }))}
                            placeholder="Tiempo estimado"
                          />
                        ) : (
                          <span>{mo.horas_hombre_std} h</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-green-600">
                        ${mo.costo_mano_obra ? mo.costo_mano_obra.toLocaleString('es-CO') : calcularCosto(mo.valor_hora_hombre, mo.horas_hombre_std)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mo.estado === 'activo' ? 'default' : 'secondary'}>
                          {mo.estado || 'activo'}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {editingId === mo.codigo_mano_obra ? (
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
                              <Button variant="outline" size="sm" onClick={() => handleEdit(mo)}>
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
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el registro de "{mo.codigo_mano_obra}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(mo.codigo_mano_obra)}>
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
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800">💡 Fórmula de Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-orange-800">
              <div className="font-mono text-sm bg-white p-2 rounded border">
                Costo MO = Valor por Hora × Horas Hombre STD
              </div>
              <p className="text-sm">
                Esta fórmula se aplica automáticamente en el cálculo del CDR para cada tipo de mano de obra utilizada en las recetas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManoObra;