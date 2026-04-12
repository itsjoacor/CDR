import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowLeft, Upload, Loader2, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';

// ── Types ──────────────────────────────────────────────────────────────────

interface Periodo {
  periodo: string;
  created_at: string;
}

interface DetalleRow {
  id: number;
  periodo: string;
  codigo_producto: string;
  nombre_producto: string;
  sector_productivo: string;
  codigo_ingrediente: string;
  nombre_ingrediente: string;
  tipo_ingrediente: 'insumo' | 'mano_obra' | 'energia' | 'producto';
  volumen: number;
  cantidad_ingrediente: number;
  cantidad_producida: number;
  costo_ingrediente: number;
  cdr_volumen: number;
}

interface CorridoRow {
  periodo: string;
  sector_productivo: string;
  total_cdr: number;
  total_cantidad: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL;

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Palette for chart lines
const LINE_COLORS = [
  '#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#eab308',
  '#ef4444', '#14b8a6', '#ec4899', '#64748b', '#84cc16',
];

// ── ResumenCards ───────────────────────────────────────────────────────────

const ResumenCards: React.FC<{ detalle: DetalleRow[]; label?: string }> = ({ detalle, label }) => {
  const sum = (tipo: string) =>
    detalle
      .filter(r => r.tipo_ingrediente === tipo)
      .reduce((a, r) => a + Number(r.cdr_volumen), 0);

  const cdrMano     = sum('mano_obra');
  const cdrEnergia  = sum('energia');
  const cdrInsumo   = sum('insumo');
  const cdrProducto = sum('producto');

  // By sector
  const sectorMap: Record<string, number> = {};
  for (const r of detalle) {
    const s = r.sector_productivo || 'Sin sector';
    sectorMap[s] = (sectorMap[s] ?? 0) + Number(r.cdr_volumen);
  }
  const sectores = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]);

  const total = cdrMano + cdrEnergia + cdrInsumo + cdrProducto;

  const sectorColors = [
    'bg-teal-50 border-teal-300 text-teal-800',
    'bg-cyan-50 border-cyan-300 text-cyan-800',
    'bg-sky-50 border-sky-300 text-sky-800',
    'bg-indigo-50 border-indigo-300 text-indigo-800',
    'bg-violet-50 border-violet-300 text-violet-800',
  ];

  return (
    <div className="space-y-3">
      {/* Row 1: por tipo de ingrediente (origen de tabla) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-orange-50 border border-orange-300">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Mano de Obra</p>
            <p className="text-xl font-bold text-orange-800">${fmt(cdrMano)}</p>
            <p className="text-xs text-orange-500 mt-0.5">
              {total > 0 ? ((cdrMano / total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border border-yellow-300">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Matriz Energía</p>
            <p className="text-xl font-bold text-yellow-800">${fmt(cdrEnergia)}</p>
            <p className="text-xs text-yellow-500 mt-0.5">
              {total > 0 ? ((cdrEnergia / total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border border-purple-300">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Insumos</p>
            <p className="text-xl font-bold text-purple-800">${fmt(cdrInsumo)}</p>
            <p className="text-xs text-purple-500 mt-0.5">
              {total > 0 ? ((cdrInsumo / total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border border-blue-300">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Productos</p>
            <p className="text-xl font-bold text-blue-800">${fmt(cdrProducto)}</p>
            <p className="text-xs text-blue-500 mt-0.5">
              {total > 0 ? ((cdrProducto / total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: por sector productivo */}
      {sectores.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sectores.map(([sector, monto], i) => (
            <Card key={sector} className={`border ${sectorColors[i % sectorColors.length]}`}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 truncate" title={sector}>
                  {sector}
                </p>
                <p className="text-lg font-bold">${fmt(monto)}</p>
                <p className="text-xs opacity-60 mt-0.5">
                  {total > 0 ? ((monto / total) * 100).toFixed(1) : 0}% del total
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Total */}
      <Card className="bg-green-50 border border-green-400">
        <CardContent className="pt-4 pb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-green-700 uppercase tracking-wide">
            {label ?? 'CDR Total del Periodo'}
          </p>
          <p className="text-3xl font-bold text-green-800">${fmt(total)}</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

const ResultadosVolumen: React.FC = () => {
  const token = Cookies.get('token') || '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [detalle, setDetalle] = useState<DetalleRow[]>([]);
  const [corrido, setCorrido] = useState<CorridoRow[]>([]);
  const [porSector, setPorSector] = useState<DetalleRow[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('');

  const [loadingPeriodos, setLoadingPeriodos] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [loadingCorrido, setLoadingCorrido] = useState(false);
  const [loadingPorSector, setLoadingPorSector] = useState(false);
  const [activeTab, setActiveTab] = useState('mensual');

  // ── Fetch periods on mount ──────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoadingPeriodos(true);
      try {
        const res = await fetch(`${API}/implosion/periodos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPeriodos(data);
        if (data.length > 0) setSelectedPeriodo(data[0].periodo);
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar los periodos', variant: 'destructive' });
      } finally {
        setLoadingPeriodos(false);
      }
    })();
  }, []);

  // ── Fetch corrido on mount (independent of period selection) ────────────

  useEffect(() => {
    (async () => {
      setLoadingCorrido(true);
      try {
        const res = await fetch(`${API}/implosion/corrido`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCorrido(await res.json());
      } catch {
        /* silencioso */
      } finally {
        setLoadingCorrido(false);
      }
    })();
  }, []);

  // ── Fetch detalle when period or tab changes ────────────────────────────

  useEffect(() => {
    if (!selectedPeriodo) return;
    if (activeTab === 'mensual' || activeTab === 'detalle-sector') fetchDetalle(selectedPeriodo);
    if (activeTab === 'sector') fetchPorSector(selectedPeriodo);
  }, [selectedPeriodo, activeTab]);

  // Auto-select first sector when detalle loads
  useEffect(() => {
    if (detalle.length > 0 && !selectedSector) {
      const primero = [...new Set(detalle.map(r => r.sector_productivo).filter(Boolean))].sort()[0];
      if (primero) setSelectedSector(primero);
    }
  }, [detalle]);

  const fetchDetalle = async (p: string) => {
    setLoadingDetalle(true);
    try {
      const res = await fetch(`${API}/implosion/detalle/${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetalle(await res.json());
    } catch {
      toast({ title: 'Error', description: 'Error cargando detalle', variant: 'destructive' });
    } finally {
      setLoadingDetalle(false);
    }
  };

  const fetchPorSector = async (p: string) => {
    setLoadingPorSector(true);
    try {
      const res = await fetch(`${API}/implosion/por-sector/${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPorSector(await res.json());
    } catch {
      toast({ title: 'Error', description: 'Error cargando por sector', variant: 'destructive' });
    } finally {
      setLoadingPorSector(false);
    }
  };

  // ── Derived data for charts ─────────────────────────────────────────────

  // Unique sectors from corrido
  const sectors = useMemo(
    () => [...new Set(corrido.map((r) => r.sector_productivo))].sort(),
    [corrido],
  );

  // Unique periods from corrido (sorted ascending)
  const corridoPeriods = useMemo(
    () => [...new Set(corrido.map((r) => r.periodo))].sort(),
    [corrido],
  );

  // Transform corrido to recharts format: one object per period with sector keys
  const chartData = useMemo(() => {
    return corridoPeriods.map((p) => {
      const obj: Record<string, any> = { periodo: p, total: 0 };
      for (const s of sectors) {
        const row = corrido.find((r) => r.periodo === p && r.sector_productivo === s);
        obj[s] = row ? Math.round(row.total_cdr) : 0;
        obj['total'] = (obj['total'] as number) + (obj[s] as number);
      }
      return obj;
    });
  }, [corrido, corridoPeriods, sectors]);

  // Sector aggregation for the sector tab
  const sectorAgg = useMemo(() => {
    const map: Record<string, { sector: string; total_cdr: number; total_cantidad: number; productos: Set<string> }> = {};
    for (const r of porSector) {
      const s = r.sector_productivo || 'Sin sector';
      if (!map[s]) map[s] = { sector: s, total_cdr: 0, total_cantidad: 0, productos: new Set() };
      map[s].total_cdr += Number(r.cdr_volumen) || 0;
      map[s].total_cantidad += Number(r.cantidad_producida) || 0;
      map[s].productos.add(r.codigo_producto);
    }
    return Object.values(map).sort((a, b) => b.total_cdr - a.total_cdr);
  }, [porSector]);

  const totalCDR = useMemo(
    () => detalle.reduce((acc, r) => acc + Number(r.cdr_volumen), 0),
    [detalle],
  );

  // Sectores disponibles del detalle cargado
  const sectoresDisponibles = useMemo(
    () => [...new Set(detalle.map(r => r.sector_productivo).filter(Boolean))].sort(),
    [detalle],
  );

  // Detalle filtrado por sector seleccionado (para el 4to tab)
  const detallePorSector = useMemo(
    () => detalle.filter(r => r.sector_productivo === selectedSector),
    [detalle, selectedSector],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  if (loadingPeriodos) {
    return (
      <Layout title="Resultados Volumen">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Resultados Volumen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/implosion-volumen')}
            className="text-teal-700 border-teal-300"
          >
            <Upload className="h-4 w-4 mr-2" />
            Cargar Implosión
          </Button>
        </div>

        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
          <BarChart2 className="h-3 w-3 mr-1 inline" />
          Resultados Volumen — Análisis de producción
        </Badge>

        {periodos.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">No hay periodos importados todavía.</p>
              <Button onClick={() => navigate('/implosion-volumen')} className="bg-teal-600 hover:bg-teal-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Cargar primera implosión
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="mensual">Implosión Mensual</TabsTrigger>
              <TabsTrigger value="corrido">Corrido Gráfico</TabsTrigger>
              <TabsTrigger value="sector">Por Sector</TabsTrigger>
              <TabsTrigger value="detalle-sector">Detalle por Sector</TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Implosión Mensual ──────────────────────────────── */}
            <TabsContent value="mensual">
              <div className="space-y-4">
                {/* Period selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Periodo:</span>
                  <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.periodo} value={p.periodo}>
                          {p.periodo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingDetalle && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                </div>

                {/* Summary cards */}
                {detalle.length > 0 && <ResumenCards detalle={detalle} />}

                {/* Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-teal-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Cód. Producto</th>
                            <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Nombre Producto</th>
                            <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Sector</th>
                            <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Cód. Ingrediente</th>
                            <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Nombre Ingrediente</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Volumen</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Cant. Ing.</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Cant. Producida</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Costo Ing.</th>
                            <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">CDR Volumen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingDetalle ? (
                            <tr>
                              <td colSpan={10} className="py-10 text-center">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-600" />
                              </td>
                            </tr>
                          ) : detalle.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-10 text-center text-muted-foreground">
                                Sin datos para este periodo
                              </td>
                            </tr>
                          ) : (
                            detalle.map((r) => (
                              <tr key={r.id} className="border-b hover:bg-muted/40">
                                <td className="px-3 py-1.5 font-mono text-xs">{r.codigo_producto}</td>
                                <td className="px-3 py-1.5 max-w-[180px] truncate" title={r.nombre_producto}>{r.nombre_producto}</td>
                                <td className="px-3 py-1.5 text-xs">{r.sector_productivo}</td>
                                <td className="px-3 py-1.5 font-mono text-xs">{r.codigo_ingrediente}</td>
                                <td className="px-3 py-1.5 max-w-[160px] truncate" title={r.nombre_ingrediente}>{r.nombre_ingrediente}</td>
                                <td className="px-3 py-1.5 text-right">{fmt(r.volumen)}</td>
                                <td className="px-3 py-1.5 text-right">{fmt(r.cantidad_ingrediente)}</td>
                                <td className="px-3 py-1.5 text-right">{fmt(r.cantidad_producida)}</td>
                                <td className="px-3 py-1.5 text-right">${fmt(r.costo_ingrediente)}</td>
                                <td className="px-3 py-1.5 text-right font-semibold text-teal-700">${fmt(r.cdr_volumen)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB 2: Corrido Gráfico ────────────────────────────────── */}
            <TabsContent value="corrido">
              <Card>
                <CardHeader>
                  <CardTitle className="text-teal-800">CDR Acumulado por Periodo y Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCorrido ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Sin datos de corrido</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [`$${fmt(value)}`, name]}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend />
                        {sectors.map((s, i) => (
                          <Line
                            key={s}
                            type="monotone"
                            dataKey={s}
                            stroke={LINE_COLORS[i % LINE_COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Summary table below chart */}
              {chartData.length > 0 && (
                <Card className="mt-4">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-teal-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-teal-800 border-b">Periodo</th>
                            {sectors.map((s) => (
                              <th key={s} className="px-4 py-2 text-right font-semibold text-teal-800 border-b">
                                {s}
                              </th>
                            ))}
                            <th className="px-4 py-2 text-right font-semibold text-teal-800 border-b">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((row) => (
                            <tr key={row.periodo} className="border-b hover:bg-muted/40">
                              <td className="px-4 py-2 font-mono font-semibold">{row.periodo}</td>
                              {sectors.map((s) => (
                                <td key={s} className="px-4 py-2 text-right">
                                  ${fmt(row[s] as number)}
                                </td>
                              ))}
                              <td className="px-4 py-2 text-right font-bold text-teal-700">
                                ${fmt(row.total as number)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── TAB 3: Por Sector ─────────────────────────────────────── */}
            <TabsContent value="sector">
              <div className="space-y-4">
                {/* Period selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Periodo:</span>
                  <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.periodo} value={p.periodo}>
                          {p.periodo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingPorSector && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                </div>

                {/* Bar chart by sector */}
                {sectorAgg.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-teal-800">CDR por Sector — {selectedPeriodo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sectorAgg} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                          <YAxis
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip formatter={(v: number) => [`$${fmt(v)}`, 'CDR Volumen']} />
                          <Bar dataKey="total_cdr" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Sector summary table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-teal-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-teal-800 border-b">Sector</th>
                            <th className="px-4 py-2 text-right font-semibold text-teal-800 border-b">Productos</th>
                            <th className="px-4 py-2 text-right font-semibold text-teal-800 border-b">Cant. Total Producida</th>
                            <th className="px-4 py-2 text-right font-semibold text-teal-800 border-b">CDR Volumen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingPorSector ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-teal-600" />
                              </td>
                            </tr>
                          ) : sectorAgg.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                Sin datos para este periodo
                              </td>
                            </tr>
                          ) : (
                            sectorAgg.map((s) => (
                              <tr key={s.sector} className="border-b hover:bg-muted/40">
                                <td className="px-4 py-2 font-medium">{s.sector}</td>
                                <td className="px-4 py-2 text-right">{s.productos.size}</td>
                                <td className="px-4 py-2 text-right">{fmt(s.total_cantidad)}</td>
                                <td className="px-4 py-2 text-right font-semibold text-teal-700">
                                  ${fmt(s.total_cdr)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {sectorAgg.length > 1 && (
                          <tfoot className="bg-teal-50 font-bold">
                            <tr>
                              <td className="px-4 py-2">Total</td>
                              <td className="px-4 py-2 text-right">
                                {sectorAgg.reduce((a, s) => a + s.productos.size, 0)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {fmt(sectorAgg.reduce((a, s) => a + s.total_cantidad, 0))}
                              </td>
                              <td className="px-4 py-2 text-right text-teal-700">
                                ${fmt(sectorAgg.reduce((a, s) => a + s.total_cdr, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── TAB 4: Detalle por Sector ─────────────────────────────── */}
            <TabsContent value="detalle-sector">
              <div className="space-y-4">
                {/* Selectores: periodo + sector */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium">Periodo:</span>
                  <Select value={selectedPeriodo} onValueChange={(v) => { setSelectedPeriodo(v); setSelectedSector(''); }}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodos.map((p) => (
                        <SelectItem key={p.periodo} value={p.periodo}>{p.periodo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-sm font-medium">Sector:</span>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar sector..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectoresDisponibles.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {loadingDetalle && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                </div>

                {/* Cards filtrados por sector */}
                {selectedSector && detallePorSector.length > 0 && (
                  <ResumenCards
                    detalle={detallePorSector}
                    label={`CDR Total — ${selectedSector}`}
                  />
                )}

                {/* Tabla detalle filtrada por sector */}
                {selectedSector && (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-teal-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Cód. Producto</th>
                              <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Nombre Producto</th>
                              <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Tipo</th>
                              <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Cód. Ingrediente</th>
                              <th className="px-3 py-2 text-left font-semibold text-teal-800 border-b">Nombre Ingrediente</th>
                              <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Volumen</th>
                              <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Cant. Producida</th>
                              <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">Costo Ing.</th>
                              <th className="px-3 py-2 text-right font-semibold text-teal-800 border-b">CDR Volumen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detallePorSector.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="py-10 text-center text-muted-foreground">
                                  Sin datos para este sector
                                </td>
                              </tr>
                            ) : (
                              detallePorSector.map((r) => (
                                <tr key={r.id} className="border-b hover:bg-muted/40">
                                  <td className="px-3 py-1.5 font-mono text-xs">{r.codigo_producto}</td>
                                  <td className="px-3 py-1.5 max-w-[160px] truncate" title={r.nombre_producto}>{r.nombre_producto}</td>
                                  <td className="px-3 py-1.5">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                      r.tipo_ingrediente === 'mano_obra'  ? 'bg-orange-100 text-orange-700' :
                                      r.tipo_ingrediente === 'energia'    ? 'bg-yellow-100 text-yellow-700' :
                                      r.tipo_ingrediente === 'producto'   ? 'bg-blue-100 text-blue-700'    :
                                                                            'bg-purple-100 text-purple-700'
                                    }`}>
                                      {r.tipo_ingrediente === 'mano_obra' ? 'Mano Obra' :
                                       r.tipo_ingrediente === 'energia'   ? 'Energía'   :
                                       r.tipo_ingrediente === 'producto'  ? 'Producto'  : 'Insumo'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 font-mono text-xs">{r.codigo_ingrediente}</td>
                                  <td className="px-3 py-1.5 max-w-[160px] truncate" title={r.nombre_ingrediente}>{r.nombre_ingrediente}</td>
                                  <td className="px-3 py-1.5 text-right">{fmt(r.volumen)}</td>
                                  <td className="px-3 py-1.5 text-right">{fmt(r.cantidad_producida)}</td>
                                  <td className="px-3 py-1.5 text-right">${fmt(r.costo_ingrediente)}</td>
                                  <td className="px-3 py-1.5 text-right font-semibold text-teal-700">${fmt(r.cdr_volumen)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedSector && !loadingDetalle && (
                  <p className="text-center text-muted-foreground py-10">
                    Seleccioná un sector para ver el detalle
                  </p>
                )}
              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default ResultadosVolumen;
