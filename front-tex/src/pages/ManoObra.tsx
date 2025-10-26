import React, { useEffect, useState, Fragment } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Save, X } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import Cookies from "js-cookie";
import { Skeleton } from "@/components/ui/skeleton";

// Mantengo tu shape y agrego explícitamente los campos del esquema SQL
type ManoObraAPI = {
  codigo_mano_obra: string;
  sector_productivo: string;
  descripcion: string;
  consumo_kw_std: number;
  std_produccion: number;
  horas_hombre_std: number;
  valor_hora_hombre: number;
  horas_por_turno: number;
  producto_calculado_std?: string | null;
  costo_mano_obra?: number | null;              // GENERATED
  cantidad_personal_estimado?: number | null;   // GENERATED
  estado?: "activo" | "inactivo";               // UI-only (se conserva)
};

const currency = (n?: number | null) =>
  typeof n === "number" ? `$${n.toLocaleString("es-CO")}` : "—";

const numberOrDash = (n?: number | null) =>
  n === 0 || typeof n === "number" ? n : "—";

const ManoObra: React.FC = () => {
  const token = Cookies.get("token") || "";
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [manoObra, setManoObra] = useState<ManoObraAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ManoObraAPI>>({});
  const canEdit = user?.role === "admin";
  const [sectores, setSectores] = useState<string[]>([]);

  // Fallbacks coherentes con el schema SQL
  const fallbackCostoMano = (m: Pick<ManoObraAPI, "horas_hombre_std" | "valor_hora_hombre" | "std_produccion">) => {
    const std = Number(m.std_produccion) || 0;
    if (std <= 0) return null;
    return (Number(m.horas_hombre_std) * Number(m.valor_hora_hombre)) / std;
  };

  const fallbackPersonalEstimado = (m: Pick<ManoObraAPI, "horas_hombre_std" | "horas_por_turno">) => {
    const hpt = Number(m.horas_por_turno) || 0;
    if (hpt <= 0) return null;
    return Number(m.horas_hombre_std) / hpt;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/matriz-mano`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Error al obtener datos");
        const data = await res.json();

        // Conservo tu campo UI 'estado'
        const dataWithEstado = data.map((item: ManoObraAPI) => ({
          ...item,
          estado: item.estado || "activo",
        }));
        setManoObra(dataWithEstado);
      } catch (err) {
        toast({
          title: "Error",
          description: "No se pudo cargar la mano de obra desde el servidor.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSectores = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/sectores-productivos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSectores(data.map((s: any) => s.nombre));
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los sectores productivos",
          variant: "destructive",
        });
      }
    };
    fetchSectores();
  }, []);

  const calcularPromedio = (campo: keyof ManoObraAPI): number => {
    const numeros = manoObra
      .map((m) => m[campo])
      .filter((val): val is number => typeof val === "number");
    const total = numeros.reduce((acc, val) => acc + val, 0);
    return numeros.length > 0 ? total / numeros.length : 0;
  };

  const handleEdit = (item: ManoObraAPI) => {
    setEditingId(item.codigo_mano_obra);
    setEditForm(item); // incluimos calculados para mostrarlos en read-only
  };

  const handleSave = async () => {
    if (
      !editForm.codigo_mano_obra ||
      !editForm.descripcion ||
      editForm.valor_hora_hombre === undefined ||
      editForm.horas_hombre_std === undefined ||
      !editForm.sector_productivo
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Conservamos tu payload editando solo lo que editabas
      const payload = {
        descripcion: editForm.descripcion,
        valor_hora_hombre: editForm.valor_hora_hombre,
        horas_hombre_std: editForm.horas_hombre_std,
        sector_productivo: editForm.sector_productivo,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-mano/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();
      if (!response.ok) throw new Error(`Error al guardar: ${text}`);

      // El backend puede devolver o no calculados; actualizamos coherentemente
      const updated = JSON.parse(text) as Partial<ManoObraAPI>;

      setManoObra((prev) =>
        prev.map((item) => {
          if (item.codigo_mano_obra !== editingId) return item;

          // Recalcular en front mientras tanto, si no vinieron calculados
          const horas = updated.horas_hombre_std ?? item.horas_hombre_std;
          const valor = updated.valor_hora_hombre ?? item.valor_hora_hombre;
          const std = item.std_produccion; // lo define tu dato base, no editable
          const hpt = item.horas_por_turno;

          const costoCalc =
            updated.costo_mano_obra ??
            fallbackCostoMano({
              horas_hombre_std: horas,
              valor_hora_hombre: valor,
              std_produccion: std,
            });

          const personalCalc =
            updated.cantidad_personal_estimado ??
            fallbackPersonalEstimado({
              horas_hombre_std: horas,
              horas_por_turno: hpt,
            });

          return {
            ...item,
            ...updated,
            // aseguramos coherencia inmediata visual
            costo_mano_obra: costoCalc ?? null,
            cantidad_personal_estimado: personalCalc ?? null,
          };
        })
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

  const handleDelete = async (codigo: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/matriz-mano/${codigo}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const text = await response.text();
      let resBody: any = {};
      try {
        resBody = text ? JSON.parse(text) : {};
      } catch (err) {
        console.warn("⚠️ No se pudo parsear JSON:", err);
      }

      if (!response.ok) {
        if (response.status === 409 && resBody.message) {
          toast({
            title: "No se puede eliminar",
            description: resBody.message,
            variant: "destructive",
          });
        } else {
          throw new Error(`Error al eliminar: ${text}`);
        }
        return;
      }

      setManoObra((prev) =>
        prev.filter((item) => item.codigo_mano_obra !== codigo)
      );

      toast({
        title: "Eliminado",
        description: "El registro se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error",
        description:
          "No se pudo eliminar el registro. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
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
              Gestión de tiempos, salarios y fórmulas de trabajo humano en el
              proceso productivo
            </p>
          </div>
          <div className="flex space-x-2">
            {canEdit && (
              <Button onClick={() => navigate("/cargarManoObra")}>
                ➕ Agregar Mano obra
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards (sin cambios estructurales) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {manoObra.length}
              </div>
              <div className="text-sm text-muted-foreground">Tipos de MO</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ${calcularPromedio("valor_hora_hombre").toLocaleString("es-CO")}
              </div>
              <div className="text-sm text-muted-foreground">
                Salario Promedio/Hora
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {calcularPromedio("horas_hombre_std").toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Tiempo Promedio</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (manoObra.filter((m) => m.estado === "activo").length /
                    manoObra.length) *
                    100
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">Tipos Activos</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table con TODAS las columnas del esquema */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Mano de Obra</CardTitle>
            <CardDescription>
              Tipos de trabajo humano con sus respectivos costos, tiempos y métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código / Descripción</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Consumo kW Std</TableHead>
                    <TableHead>Std Producción</TableHead>
                    <TableHead>Horas Hombre Std</TableHead>
                    <TableHead>Valor Hora Hombre</TableHead>
                    <TableHead>Horas por Turno</TableHead>
                    <TableHead>Producto Calc. Std</TableHead>
                    <TableHead>Costo Mano de Obra</TableHead>
                    <TableHead>Personal Estimado</TableHead>
                    {canEdit && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manoObra.map((mo) => {
                    const costo =
                      typeof mo.costo_mano_obra === "number"
                        ? mo.costo_mano_obra
                        : fallbackCostoMano(mo);

                    const personal =
                      typeof mo.cantidad_personal_estimado === "number"
                        ? mo.cantidad_personal_estimado
                        : fallbackPersonalEstimado(mo);

                    return (
                      <Fragment key={mo.codigo_mano_obra}>
                        <TableRow>
                          <TableCell>
                            <div className="font-mono font-medium">{mo.codigo_mano_obra}</div>
                            <div className="text-sm text-muted-foreground">
                              {mo.descripcion}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{mo.sector_productivo}</Badge>
                          </TableCell>
                          <TableCell>{numberOrDash(mo.consumo_kw_std)} kW</TableCell>
                          <TableCell>{numberOrDash(mo.std_produccion)}</TableCell>
                          <TableCell>{numberOrDash(mo.horas_hombre_std)} h</TableCell>
                          <TableCell className="font-mono">
                            {currency(mo.valor_hora_hombre)}
                          </TableCell>
                          <TableCell>{numberOrDash(mo.horas_por_turno)} h</TableCell>
                          <TableCell className="truncate max-w-[16ch]">
                            {mo.producto_calculado_std || "—"}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-green-600">
                            {currency(costo)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {typeof personal === "number" ? personal.toFixed(2) : "—"}
                          </TableCell>

                          {canEdit && (
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(mo)}
                                >
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
                                        Esta acción no se puede deshacer. Se eliminará
                                        permanentemente "{mo.codigo_mano_obra}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(mo.codigo_mano_obra)}
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>

                        {/* Panel de edición inline:
                            - Editables: descripcion, valor_hora_hombre, horas_hombre_std, sector_productivo
                            - Solo lectura: consumo_kw_std, std_produccion, horas_por_turno, producto_calculado_std,
                                           costo_mano_obra, cantidad_personal_estimado */}
                        {editingId === mo.codigo_mano_obra && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={canEdit ? 12 : 11}>
                              <Card className="w-full">
                                <CardHeader>
                                  <CardTitle className="text-lg">
                                    Editando: {mo.codigo_mano_obra}
                                  </CardTitle>
                                  <CardDescription>
                                    Los campos calculados se muestran como solo lectura
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Editables */}
                                    <div className="space-y-2">
                                      <Label htmlFor="codigo">Código</Label>
                                      <Input
                                        id="codigo"
                                        value={editForm.codigo_mano_obra || ""}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            codigo_mano_obra: e.target.value,
                                          }))
                                        }
                                        placeholder="Código"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="descripcion">Descripción</Label>
                                      <Input
                                        id="descripcion"
                                        value={editForm.descripcion || ""}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            descripcion: e.target.value,
                                          }))
                                        }
                                        placeholder="Descripción"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="sector">Sector Productivo</Label>
                                      <Listbox
                                        value={editForm.sector_productivo || ""}
                                        onChange={(value) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            sector_productivo: value,
                                          }))
                                        }
                                      >
                                        <div className="relative">
                                          <ListboxButton className="w-full px-3 py-2 border rounded-md bg-white text-left text-sm">
                                            {editForm.sector_productivo ||
                                              "Seleccionar sector"}
                                          </ListboxButton>
                                          <ListboxOptions className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-md max-h-60 overflow-auto">
                                            {sectores.map((sector, i) => (
                                              <ListboxOption
                                                key={i}
                                                value={sector}
                                                as={Fragment}
                                              >
                                                {({ active, selected }) => (
                                                  <li
                                                    className={`cursor-pointer px-4 py-2 rounded-md ${
                                                      active
                                                        ? "bg-gray-100 text-gray-900"
                                                        : "text-gray-800"
                                                    } ${selected ? "font-medium" : ""}`}
                                                  >
                                                    {sector}
                                                  </li>
                                                )}
                                              </ListboxOption>
                                            ))}
                                          </ListboxOptions>
                                        </div>
                                      </Listbox>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="valor_hora">Salario por Hora</Label>
                                      <Input
                                        id="valor_hora"
                                        type="number"
                                        value={editForm.valor_hora_hombre ?? ""}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            valor_hora_hombre: Number(e.target.value),
                                          }))
                                        }
                                        placeholder="Salario por hora"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="horas_std">
                                        Horas Hombre Estándar
                                      </Label>
                                      <Input
                                        id="horas_std"
                                        type="number"
                                        step="0.1"
                                        value={editForm.horas_hombre_std ?? ""}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            horas_hombre_std: Number(e.target.value),
                                          }))
                                        }
                                        placeholder="Tiempo estimado"
                                      />
                                    </div>

                                    {/* Solo lectura */}
                                    <div className="space-y-2">
                                      <Label>Consumo kW Estándar (solo lectura)</Label>
                                      <Input
                                        value={numberOrDash(
                                          editForm.consumo_kw_std as number
                                        )}
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Std Producción (solo lectura)</Label>
                                      <Input
                                        value={numberOrDash(
                                          editForm.std_produccion as number
                                        )}
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Horas por Turno (solo lectura)</Label>
                                      <Input
                                        value={numberOrDash(
                                          editForm.horas_por_turno as number
                                        )}
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Producto Calculado Std (solo lectura)</Label>
                                      <Input
                                        value={
                                          editForm.producto_calculado_std || "—"
                                        }
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Costo Mano de Obra (solo lectura)</Label>
                                      <Input
                                        value={currency(
                                          typeof editForm.costo_mano_obra === "number"
                                            ? editForm.costo_mano_obra
                                            : fallbackCostoMano({
                                                horas_hombre_std:
                                                  Number(editForm.horas_hombre_std) ||
                                                  Number(manoObra.find(m => m.codigo_mano_obra === editingId)?.horas_hombre_std) ||
                                                  0,
                                                valor_hora_hombre:
                                                  Number(editForm.valor_hora_hombre) ||
                                                  Number(manoObra.find(m => m.codigo_mano_obra === editingId)?.valor_hora_hombre) ||
                                                  0,
                                                std_produccion:
                                                  Number(editForm.std_produccion) ||
                                                  Number(manoObra.find(m => m.codigo_mano_obra === editingId)?.std_produccion) ||
                                                  0,
                                              })
                                        )}
                                        disabled
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>
                                        Personal Estimado (solo lectura)
                                      </Label>
                                      <Input
                                        value={
                                          ((): string => {
                                            const calc =
                                              typeof editForm.cantidad_personal_estimado ===
                                              "number"
                                                ? editForm.cantidad_personal_estimado
                                                : fallbackPersonalEstimado({
                                                    horas_hombre_std:
                                                      Number(editForm.horas_hombre_std) ||
                                                      Number(manoObra.find(m => m.codigo_mano_obra === editingId)?.horas_hombre_std) ||
                                                      0,
                                                    horas_por_turno:
                                                      Number(editForm.horas_por_turno) ||
                                                      Number(manoObra.find(m => m.codigo_mano_obra === editingId)?.horas_por_turno) ||
                                                      0,
                                                  });
                                            return typeof calc === "number"
                                              ? calc.toFixed(2)
                                              : "—";
                                          })()
                                        }
                                        disabled
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end mt-4 space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleSave}>
                                      <Save className="h-4 w-4 mr-1" /> Guardar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                      <X className="h-4 w-4 mr-1" /> Cancelar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManoObra;
