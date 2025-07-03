import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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

interface Insumo {
  grupo: string;
  codigo: string;
  detalle: string;
  costo: number;
  estado?: 'disponible' | 'agotado' | 'descontinuado';
  stock?: number;
  stockMinimo?: number;
  fechaActualizacion?: string;
}

const Insumos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Insumo>>({});
  const canEdit = user?.role === 'admin';

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

  const handleEdit = (item: Insumo) => {
    setEditingId(item.codigo);
    setEditForm(item);
  };

  const handleSave = async () => {
    if (!editForm.codigo || !editForm.detalle || !editForm.costo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insumos/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Error al guardar cambios');

      setInsumos(prev => prev.map(item =>
        item.codigo === editingId ? { ...item, ...editForm } : item
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insumos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setInsumos(prev => prev.filter(item => item.codigo !== id));
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

  const getGrupoColor = (grupo: string) => {
    switch (grupo) {
      case 'Telas': return 'bg-blue-100 text-blue-800';
      case 'Hilos': return 'bg-green-100 text-green-800';
      case 'Accesorios': return 'bg-purple-100 text-purple-800';
      case 'Etiquetas': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <Button onClick={handleExport} variant="outline">
              📤 Exportar
            </Button>
            {canEdit && (
              <Button onClick={() => navigate('/cargarInsumo')}>
                ➕ Agregar Insumo
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{insumos.length}</div>
              <div className="text-sm text-muted-foreground">Total Insumos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(insumos.map(i => i.grupo)).size}
              </div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
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

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Insumos</CardTitle>
            <CardDescription>Información de insumos utilizada en recetas y cálculos CDR</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando insumos...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código/Nombre</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Costo</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInsumos.map((insumo) => (
                    <TableRow key={insumo.codigo}>
                      <TableCell>
                        {editingId === insumo.codigo ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.detalle || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, detalle: e.target.value }))}
                              placeholder="Detalle del insumo"
                            />
                            <div className="text-sm text-muted-foreground font-mono">{insumo.codigo}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">{insumo.detalle}</div>
                            <div className="text-sm text-muted-foreground font-mono">{insumo.codigo}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === insumo.codigo ? (
                          <Input
                            value={editForm.grupo || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, grupo: e.target.value }))}
                            placeholder="Grupo"
                          />
                        ) : (
                          <Badge className={getGrupoColor(insumo.grupo)}>{insumo.grupo}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === insumo.codigo ? (
                          <Input
                            type="number"
                            value={editForm.costo || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, costo: Number(e.target.value) }))}
                            placeholder="Costo"
                          />
                        ) : (
                          <div className="font-mono font-semibold text-green-600">
                            ${insumo.costo.toLocaleString('es-CO')}
                          </div>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          {editingId === insumo.codigo ? (
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
                              <Button variant="outline" size="sm" onClick={() => handleEdit(insumo)}>
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
                                      Se eliminará permanentemente el insumo "{insumo.detalle}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(insumo.codigo)}>Eliminar</AlertDialogAction>
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

        {/* Info card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">💡</span>
              <span className="text-sm text-purple-800">
                Los precios de los insumos se actualizan automáticamente en el cálculo del CDR.
                Mantén los precios actualizados para obtener costos precisos de reposición.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Insumos;