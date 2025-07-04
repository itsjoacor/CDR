import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet } from 'lucide-react';

const Exportacion: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const exportTables = [
        {
            name: 'Recetas',
            description: 'Exportar todas las recetas con sus insumos y procesos',
            icon: '📋',
            color: 'bg-blue-50 border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700'
        },
        {
            name: 'Mano de Obra',
            description: 'Exportar catálogo de mano de obra con salarios y tiempos',
            icon: '👷',
            color: 'bg-orange-50 border-orange-200',
            buttonColor: 'bg-orange-600 hover:bg-orange-700'
        },
        {
            name: 'Mano de Energia',
            description: 'Exportar datos de mano de energía y equipos',
            icon: '⚡',
            color: 'bg-yellow-50 border-yellow-200',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        },
        {
            name: 'Insumos',
            description: 'Exportar inventario de materiales e insumos',
            icon: '📦',
            color: 'bg-green-50 border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700'
        },
        {
            name: 'Productos',
            description: 'Exportar catálogo de productos terminados',
            icon: '🏭',
            color: 'bg-purple-50 border-purple-200',
            buttonColor: 'bg-purple-600 hover:bg-purple-700'
        },
        {
            name: 'CDR',
            description: 'Exportar resultados de cálculo CDR',
            icon: '💰',
            color: 'bg-red-50 border-red-200',
            buttonColor: 'bg-red-600 hover:bg-red-700'
        }
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

                {/* Stats Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <span className="text-blue-600 text-2xl">📊</span>
                                <div>
                                    <div className="text-sm text-blue-800">
                                        <strong>Tablas disponibles:</strong> {exportTables.length}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        Exporte en formato Excel (.xlsx) o CSV (.csv)
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-blue-800">
                                    <strong>Usuario:</strong> {user?.name}
                                </div>
                                <div className="text-xs text-blue-600">
                                    {user?.role === 'admin' ? 'Acceso completo' : 'Solo lectura'}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exportTables.map((table) => (
                        <Card key={table.name} className={`${table.color} hover:shadow-md transition-shadow`}>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-3">
                                    <span className="text-2xl">{table.icon}</span>
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

                {/* Instructions Card */}
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-slate-800">
                            <span className="text-xl">📋</span>
                            <span>Instrucciones de Uso</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-slate-800">
                            <div className="text-sm space-y-2">
                                <p><strong>Exportación Individual:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>Haz clic en el botón "Exportar" para descargar en Excel</li>
                                    <li>O selecciona "CSV" para descargar en formato CSV</li>
                                    <li>Los datos incluyen toda la información de la tabla</li>
                                </ul>

                                <p className="pt-2"><strong>Exportación Masiva:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>Usa el botón "Exportar Todo" para todas las tablas</li>
                                    <li>Se creará un archivo Excel con múltiples hojas</li>
                                    <li>Cada hoja corresponde a una tabla diferente</li>
                                </ul>

                                <p className="pt-2"><strong>Notas importantes:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>Los datos se exportan en tiempo real</li>
                                    <li>Requiere conexión a internet para completar la exportación</li>
                                    <li>Archivos grandes pueden tardar en generarse</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default Exportacion;