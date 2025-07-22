import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Download, FileSpreadsheet, ClipboardList,
    HardHat,
    Zap,
    Package,
    ShoppingCart,
    DollarSign
} from 'lucide-react';

const Exportacion: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const exportTables = [
        {
            name: 'Recetas',
            description: 'Exportar todas las recetas con sus insumos y procesos',
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
            name: 'Insumos',
            description: 'Exportar inventario de materiales e insumos',
            icon: Package,
            iconColor: 'text-purple-400',
            color: 'bg-purple-50 border-purple-200',
            buttonColor: 'bg-purple-600 hover:bg-purple-700',
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
            case 'Insumos': return 'insumos';
            case 'Mano de Obra': return 'matriz_mano';
            case 'Mano de Energia': return 'matriz_energia';
            case 'CDR': return 'resultados_cdr';
            case 'Recetas': return 'recetas_normalizada';
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