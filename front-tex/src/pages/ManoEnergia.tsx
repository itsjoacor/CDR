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
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
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

const ManoEnergia: React.FC = () => {
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
          fetch(`${import.meta.env.VITE_API_URL}/matriz-energia`),
          fetch(`${import.meta.env.VITE_API_URL}/sectores-productivos`),
          fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`)
        ]);
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

  const handleExport = () => {
    toast({
      title: "Exportación iniciada",
      description: "Los datos se están exportando...",
    });
  };

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

    // Filtramos los campos calculados
    const { total_pesos_std, costo_energia_unidad, ...payload } = editForm;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-energia/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // Solo datos editables
        }
      );

      const text = await response.text();
      if (!response.ok) throw new Error(`Error al guardar: ${text}`);

      const updated = JSON.parse(text);
      setData((prev) =>
        prev.map((item) =>
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
        description:
          "No se pudo guardar los cambios. Por favor intenta nuevamente.",
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
      });

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        // Respuesta vacía es válida si status es ok
      }


      if (!response.ok) {
        throw new Error(result.message || 'No se pudo eliminar el registro.');
      }

      // ✅ ACTUALIZA LA TABLA
      setData(prev => prev.filter(item => item.codigo_energia !== id));

      toast({
        title: "Eliminado",
        description: "El registro se ha eliminado correctamente.",
      });

    } catch (error: any) {
      const msg = error?.message || 'No se pudo eliminar el registro.';

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };






  const calcularCosto = (valorKw: number, consumoKw: number) => (valorKw * consumoKw).toLocaleString('es-CO');

  return (
    <Layout title="Mano de Energía">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="outline" className="bg-yellow-50">⚡ Mano de Energía - Recursos Energéticos</Badge>
            <p className="text-sm text-muted-foreground mt-2">Gestión de consumo energético y costos</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">📤 Exportar</Button>
            {canEdit && <Button onClick={() => navigate('/cargarEnergia')}>➕ Agregar energía</Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{data.length}</div><div className="text-sm text-muted-foreground">Equipos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{Math.round((data.length ? (data.length / data.length) * 100 : 0))}%</div><div className="text-sm text-muted-foreground">Activos</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-blue-600">${calcularPromedio('valor_kw').toLocaleString('es-CO')}</div><div className="text-sm text-muted-foreground">Costo Prom. kW</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-purple-600">{calcularSuma('consumo_kw_std').toFixed(1)} kW</div><div className="text-sm text-muted-foreground">Consumo Total</div></CardContent></Card>
        </div>

        <Card className="relative">
          <CardHeader><CardTitle>Catálogo de Equipos y Energía</CardTitle><CardDescription>Consumos energéticos y costos</CardDescription></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
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
                    <TableRow key={me.codigo_energia}>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input value={editForm.codigo_energia || ''} onChange={e => setEditForm(prev => ({ ...prev, codigo_energia: e.target.value }))} />
                        ) : me.codigo_energia}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input value={editForm.descripcion || ''} onChange={e => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))} />
                        ) : me.descripcion}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Select value={editForm.codigo_mano_obra} onValueChange={(value) => setEditForm(prev => ({ ...prev, codigo_mano_obra: value }))}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar M.O." /></SelectTrigger>
                            <SelectContent>
                              {manoObras.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : me.codigo_mano_obra}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Listbox
                            value={editForm.sector_productivo}
                            onChange={(val) =>
                              setEditForm((prev) => ({ ...prev, sector_productivo: val }))
                            }
                          >
                            <div className="relative z-20">
                              <ListboxButton className="w-full px-2 py-1 border rounded-md bg-white text-left text-sm">
                                {editForm.sector_productivo || "Seleccionar sector"}
                              </ListboxButton>
                              <ListboxOptions className="absolute mt-1 w-full bg-white shadow-md rounded-md py-1 max-h-60 overflow-auto z-30">

                                {sectores.map((s) => (
                                  <ListboxOption
                                    key={s.nombre}
                                    value={s.nombre}
                                    className={({ active }) =>
                                      `px-3 py-1 cursor-pointer ${active ? "bg-yellow-100 text-yellow-900" : ""
                                      }`
                                    }
                                  >
                                    {s.nombre}
                                  </ListboxOption>
                                ))}
                              </ListboxOptions>
                            </div>
                          </Listbox>
                        ) : (
                          <Badge variant="outline">{me.sector_productivo}</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input type="number" step="0.1" value={editForm.consumo_kw_std || ''} onChange={e => setEditForm(prev => ({ ...prev, consumo_kw_std: Number(e.target.value) }))} />
                        ) : `${me.consumo_kw_std} kW`}
                      </TableCell>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input type="number" value={editForm.valor_kw || ''} onChange={e => setEditForm(prev => ({ ...prev, valor_kw: Number(e.target.value) }))} />
                        ) : `$${me.valor_kw.toLocaleString('es-CO')}`}
                      </TableCell>
                      <TableCell>{me.std_produccion ?? '—'}</TableCell>
                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input
                            disabled
                            value={
                              editForm.consumo_kw_std && editForm.valor_kw
                                ? calcularCosto(editForm.valor_kw, editForm.consumo_kw_std)
                                : ''
                            }
                          />
                        ) : (
                          <span className="font-mono text-green-600 font-semibold">
                            ${me.total_pesos_std?.toLocaleString('es-CO') ?? calcularCosto(me.valor_kw, me.consumo_kw_std)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {editingId === me.codigo_energia ? (
                          <Input
                            disabled
                            value={
                              me.costo_energia_unidad !== null && me.costo_energia_unidad !== undefined
                                ? `$${me.costo_energia_unidad.toLocaleString('es-CO')}`
                                : '—'
                            }
                          />
                        ) : (
                          <span className="font-mono text-blue-600 font-semibold">
                            ${me.costo_energia_unidad?.toLocaleString('es-CO') ?? '—'}
                          </span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {editingId === me.codigo_energia ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(me)}><Edit className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>Se eliminará permanentemente el equipo "{me.codigo_energia}".</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(me.codigo_energia)}>Eliminar</AlertDialogAction></AlertDialogFooter>
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
      </div>
    </Layout>
  );
};

export default ManoEnergia;
