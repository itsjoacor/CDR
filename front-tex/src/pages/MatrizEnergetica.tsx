import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Cookies from 'js-cookie';
import { Skeleton } from '@/components/ui/skeleton';


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
}

const MatrizEnergia: React.FC = () => {
  const token = Cookies.get('token') || '';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<MatrizEnergia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MatrizEnergia>>({});
  const [sectores, setSectores] = useState<{ nombre: string }[]>([]);
  const [manoObras, setManoObras] = useState<string[]>([]);
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [energiaRes, sectoresRes, manoRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/matriz-energia`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);


        if (!energiaRes.ok || !sectoresRes.ok || !manoRes.ok) {
          throw new Error('Error al cargar los datos');
        }

        const [energia, sectoresList, manoList] = await Promise.all([
          energiaRes.json(),
          sectoresRes.json(),
          manoRes.json(),
        ]);

        setData(energia);
        setSectores(sectoresList);
        setManoObras(manoList.map((m: any) => m.codigo_mano_obra));
      } catch (err) {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información necesaria.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calcularPromedio = (campo: keyof MatrizEnergia) => {
    const nums = data.map(d => typeof d[campo] === 'number' ? Number(d[campo]) : 0);
    return nums.reduce((acc, n) => acc + n, 0) / (nums.length || 1);
  };

  const calcularSuma = (campo: keyof MatrizEnergia) => {
    return data.reduce((acc, d) => acc + (Number(d[campo]) || 0), 0);
  };

  const calcularCosto = (valorKw: number, consumoKw: number) => (valorKw * consumoKw).toLocaleString('es-CO');


  const handleEdit = (item: MatrizEnergia) => {
    setEditingId(item.codigo_energia);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (
      !editForm.codigo_energia ||
      !editForm.descripcion ||
      !editForm.valor_kw ||
      !editForm.consumo_kw_std ||
      !editForm.sector_productivo ||
      !editForm.codigo_mano_obra
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-energia/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            codigo_energia: editForm.codigo_energia,
            descripcion: editForm.descripcion,
            codigo_mano_obra: editForm.codigo_mano_obra,
            sector_productivo: editForm.sector_productivo,
            consumo_kw_std: editForm.consumo_kw_std,
            valor_kw: editForm.valor_kw
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar los cambios");
      }

      const updated = await response.json();
      setData(prev =>
        prev.map(item =>
          item.codigo_energia === editingId ? { ...item, ...updated } : item
        )
      );

      toast({
        title: "Guardado exitoso",
        description: "Los cambios se han guardado correctamente.",
      });

      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar los cambios",
        variant: "destructive",
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo eliminar el registro.');
      }

      setData(prev => prev.filter(item => item.codigo_energia !== id));
      toast({
        title: "Eliminado",
        description: "El registro se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el registro",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="Matriz Energética">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-yellow-50">⚡ Matriz Energética - Recursos Energéticos</Badge>
            <p className="text-sm text-muted-foreground mt-2">Gestión de consumo energético y costos</p>
          </div>
          <div className="flex space-x-2">
            {canEdit && <Button onClick={() => navigate('/cargarEnergia')}>➕ Agregar energía</Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{data.length}</div><div className="text-sm text-muted-foreground">Equipos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{Math.round(data.length ? (data.length / data.length) * 100 : 0)}%</div><div className="text-sm text-muted-foreground">Activos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">${calcularPromedio('valor_kw').toLocaleString('es-CO')}</div><div className="text-sm text-muted-foreground">Costo Prom. kW</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{calcularSuma('consumo_kw_std').toFixed(1)} kW</div><div className="text-sm text-muted-foreground">Consumo Total</div></CardContent></Card>
        </div>

        <Card className="relative">
          <CardHeader>
            <CardTitle>Catálogo de Equipos y Energía</CardTitle>
            <CardDescription>Consumos energéticos y costos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">No se encontraron registros</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Energía</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Código M.O.</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>kW Estándar</TableHead>
                    <TableHead>$/kW</TableHead>
                    <TableHead>Producción Estándar</TableHead>
                    <TableHead>Total $ Estándar</TableHead>
                    <TableHead>$/Unidad</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(me => (
                    <React.Fragment key={me.codigo_energia}>
                      <TableRow>
                        <TableCell className="font-mono">{me.codigo_energia}</TableCell>
                        <TableCell>{me.descripcion}</TableCell>
                        <TableCell className="font-mono">{me.codigo_mano_obra}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{me.sector_productivo}</Badge>
                        </TableCell>
                        <TableCell>{me.consumo_kw_std} kW</TableCell>
                        <TableCell>${me.valor_kw.toLocaleString('es-CO')}</TableCell>
                        <TableCell>{me.std_produccion ?? '—'}</TableCell>
                        <TableCell>
                          <span className="font-mono text-green-600 font-semibold">
                            ${me.total_pesos_std?.toLocaleString('es-CO') ?? calcularCosto(me.valor_kw, me.consumo_kw_std)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-blue-600 font-semibold">
                            ${me.costo_energia_unidad?.toLocaleString('es-CO') ?? '—'}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell>
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
                                      Se eliminará permanentemente el equipo "{me.codigo_energia}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(me.codigo_energia)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>

                      {/* Expanded Edit Row */}
                      {editingId === me.codigo_energia && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={canEdit ? 10 : 9}>
                            <Card className="w-full">
                              <CardHeader>
                                <CardTitle className="text-lg">Editando: {me.descripcion}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                    <Label htmlFor="codigo_energia">Código Energía</Label>
                                    <Input
                                      id="codigo_energia"
                                      value={editForm.codigo_energia || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, codigo_energia: e.target.value }))}
                                      placeholder="Código energía"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="descripcion">Descripción</Label>
                                    <Input
                                      id="descripcion"
                                      value={editForm.descripcion || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                      placeholder="Descripción"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="codigo_mano_obra">Código Mano de Obra</Label>
                                    <Select
                                      value={editForm.codigo_mano_obra || ''}
                                      onValueChange={(value) => setEditForm(prev => ({ ...prev, codigo_mano_obra: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar M.O." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {manoObras.map(c => (
                                          <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="sector_productivo">Sector Productivo</Label>
                                    <Select
                                      value={editForm.sector_productivo || ''}
                                      onValueChange={(value) => setEditForm(prev => ({ ...prev, sector_productivo: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar sector" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {sectores.map(s => (
                                          <SelectItem key={s.nombre} value={s.nombre}>{s.nombre}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="consumo_kw_std">Consumo kW Estándar</Label>
                                    <Input
                                      id="consumo_kw_std"
                                      type="number"
                                      step="0.1"
                                      value={editForm.consumo_kw_std || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, consumo_kw_std: Number(e.target.value) }))}
                                      placeholder="Consumo kW"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="valor_kw">Valor $/kW</Label>
                                    <Input
                                      id="valor_kw"
                                      type="number"
                                      value={editForm.valor_kw || ''}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, valor_kw: Number(e.target.value) }))}
                                      placeholder="Valor kW"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end mt-4 space-x-2">
                                  <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" /> Guardar
                                  </Button>
                                  <Button variant="outline" onClick={handleCancel}>
                                    <X className="h-4 w-4 mr-2" /> Cancelar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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

export default MatrizEnergia;