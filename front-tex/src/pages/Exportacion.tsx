import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Download, FileSpreadsheet, ClipboardList,
    HardHat,
    Zap,
    Package,
    ShoppingCart,
    DollarSign,
    BarChart2,
    Loader2,
} from 'lucide-react';

const Exportacion: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Implosion periods state
    const [periodos, setPeriodos] = useState<{ periodo: string }[]>([]);
    const [selectedPeriodo, setSelectedPeriodo] = useState('');
    const [loadingPeriodos, setLoadingPeriodos] = useState(true);
    const [exportingImplosion, setExportingImplosion] = useState(false);

    useEffect(() => {
        (async () => {
            setLoadingPeriodos(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/implosion/periodos`, {
                    headers: { Authorization: `Bearer ${user?.token}` },
                });
                const data = await res.json();
                setPeriodos(data);
                if (data.length > 0) setSelectedPeriodo(data[0].periodo);
            } catch {
                // silencioso — puede que no haya periodos aún
            } finally {
                setLoadingPeriodos(false);
            }
        })();
    }, []);

    const exportTables = [
        {
            name: 'Receta',
            description: 'Exportar la receta de productos con insumos y procesos',
            icon: ClipboardList,
            iconColor: 'text-sky-400',
            color: 'bg-blue-50 border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            name: 'Mano de Obra',
            description: 'Exportar catálogo de mano de obra con salarios y tiempos',
            icon: HardHat,
            iconColor: 'text-orange-400',
            color: 'bg-orange-50 border-orange-200',
            buttonColor: 'bg-orange-600 hover:bg-orange-700',
        },
        {
            name: 'Mano de Energía',
            description: 'Exportar datos de mano de energía y equipos',
            icon: Zap,
            iconColor: 'text-yellow-400',
            color: 'bg-yellow-50 border-yellow-200',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
        },
        {
            name: 'Insumos Totales',
            description: 'Exportar inventario de insumos',
            icon: Package,
            iconColor: 'text-purple-400',
            color: 'bg-purple-50 border-purple-200',
            buttonColor: 'bg-purple-600 hover:bg-purple-700',
        },
        {
            name: 'Insumos Recetas',
            description: 'Exportar insumos SOLAMENTE utilizado en recetas',
            icon: Package,
            iconColor: 'text-red-400',
            color: 'bg-red-50 border-red-200',
            buttonColor: 'bg-red-600 hover:bg-red-700',
        },
        {
            name: 'Productos',
            description: 'Exportar catálogo de productos terminados',
            icon: ShoppingCart,
            iconColor: 'text-orange-300',
            color: 'bg-orange-50 border-orange-200',
            buttonColor: 'bg-orange-600 hover:bg-orange-700',
        },
        {
            name: 'CDR',
            description: 'Exportar resultados de cálculo CDR',
            icon: DollarSign,
            iconColor: 'text-green-400',
            color: 'bg-green-50 border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700',
        },
    ];

    // Normalize table names for backend
    const normalizarNombreTabla = (nombreVisual: string) => {
        switch (nombreVisual) {
            case 'Productos': return 'productos';
            case 'Insumos Totales': return 'insumos';
            case 'Insumos Recetas': return 'insumosutilizados';
            case 'Mano de Obra': return 'matriz_mano';
            case 'Mano de Energia': return 'matriz_energia';
            case 'CDR': return 'resultados_cdr';
            case 'Receta': return 'recetas_normalizada';
            default: return nombreVisual.toLowerCase();
        }
    };

    // Export single table in specified format
    const exportTable = async (tableName: string, format: 'csv' | 'xlsx' = 'xlsx') => {
        try {
            toast({
                title: "Exportación iniciada",
                description: `Los datos de ${tableName} se están exportando...`,
            });

            const normalizedTableName = normalizarNombreTabla(tableName);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/export?table=${normalizedTableName}&format=${format}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${tableName}.${format}`;
            link.click();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Exportación completada",
                description: `El archivo ${tableName}.${format} ha sido descargado.`,
            });
        } catch (error) {
            console.error(`Error exporting ${tableName}:`, error);
            toast({
                title: "Error en exportación",
                description: `No se pudo exportar ${tableName}: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    // Export implosion for a specific period
    const exportImplosion = async () => {
        if (!selectedPeriodo) {
            toast({ title: 'Error', description: 'Seleccioná un periodo', variant: 'destructive' });
            return;
        }
        setExportingImplosion(true);
        try {
            toast({ title: 'Exportando implosión', description: `Preparando datos de ${selectedPeriodo}...` });
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/implosion/export/${selectedPeriodo}`,
                { headers: { Authorization: `Bearer ${user?.token}` } },
            );
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `implosion_${selectedPeriodo}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast({ title: 'Exportación completada', description: `implosion_${selectedPeriodo}.xlsx descargado.` });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setExportingImplosion(false);
        }
    };

    // Export all tables in a single Excel file
    const exportAllTables = async () => {
        try {
            toast({
                title: "Exportación masiva iniciada",
                description: "Preparando archivo con todas las tablas...",
            });

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/export/all`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`,
                    },
                    body: JSON.stringify({
                        tables: exportTables.map(table => normalizarNombreTabla(table.name))
                    })
                }
            );

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'exportacion_completa.xlsx';
            link.click();
            window.URL.revokeObjectURL(url);

            toast({
                title: "Exportación completada",
                description: "Todos los datos han sido exportados en un solo archivo.",
            });
        } catch (error) {
            console.error('Error exporting all tables:', error);
            toast({
                title: "Error en exportación masiva",
                description: `No se pudo completar la exportación: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    return (
        <Layout title="Exportación de Datos">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <Badge variant="outline" className="bg-blue-50">
                            📤 Exportación - Descarga de Datos
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                            Exporta los datos de las diferentes tablas del sistema a archivos Excel o CSV
                        </p>
                    </div>
                    <Button onClick={exportAllTables} className="flex items-center space-x-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Exportar Todo</span>
                    </Button>
                </div>

                {/* ── Implosión por mes ──────────────────────────────────── */}
                <Card className="border-l-4 border-l-teal-500 bg-teal-50 border-teal-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-800">
                            <BarChart2 className="h-5 w-5" />
                            Implosión Volumen — por mes
                        </CardTitle>
                        <CardDescription>
                            Exporta el detalle completo de implosión para el mes seleccionado:
                            código producto, nombre, sector, código ingrediente, nombre ingrediente,
                            volumen, cantidad producida, costo, CDR volumen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingPeriodos ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando periodos...
                            </div>
                        ) : periodos.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No hay periodos de implosión importados todavía.
                            </p>
                        ) : (
                            <div className="flex items-center gap-3 flex-wrap">
                                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                                    <SelectTrigger className="w-40 bg-white">
                                        <SelectValue placeholder="Seleccionar mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periodos.map((p) => (
                                            <SelectItem key={p.periodo} value={p.periodo}>
                                                {p.periodo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={exportImplosion}
                                    disabled={exportingImplosion || !selectedPeriodo}
                                    className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                                >
                                    {exportingImplosion ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    Exportar Implosión
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exportTables.map((table) => (
                        <Card key={table.name} className={`${table.color} hover:shadow-md transition-shadow`}>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-3">
                                    <table.icon className={`h-6 w-6 ${table.iconColor}`} />
                                    <div>
                                        <div className="text-lg font-semibold">{table.name}</div>
                                    </div>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {table.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Formato:</span>
                                            <div className="flex space-x-2">
                                                <span
                                                    className="font-medium cursor-pointer hover:underline"
                                                    onClick={() => exportTable(table.name, 'xlsx')}
                                                >
                                                    Excel
                                                </span>
                                                <span>|</span>
                                                <span
                                                    className="font-medium cursor-pointer hover:underline"
                                                    onClick={() => exportTable(table.name, 'csv')}
                                                >
                                                    CSV
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => exportTable(table.name)}
                                        className={`w-full text-white ${table.buttonColor} flex items-center space-x-2`}
                                    >
                                        <Download className="h-4 w-4" />
                                        <span>Exportar {table.name}</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

            </div>
        </Layout>
    );
};

export default Exportacion;