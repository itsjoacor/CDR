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

    const handleExport = (tableName: string) => {
        toast({
            title: "Exportación iniciada",
            description: `Los datos de ${tableName} se están exportando a Excel...`,
        });

        // Simulate export process
        setTimeout(() => {
            toast({
                title: "Exportación completada",
                description: `El archivo ${tableName}.xlsx ha sido descargado exitosamente.`,
            });
        }, 2000);
    };

    const handleExportAll = () => {
        toast({
            title: "Exportación masiva iniciada",
            description: "Exportando todas las tablas en un archivo consolidado...",
        });

        setTimeout(() => {
            toast({
                title: "Exportación masiva completada",
                description: "El archivo consolidado_texcdr.xlsx ha sido descargado exitosamente.",
            });
        }, 3000);
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
                            Exporta los datos de las diferentes tablas del sistema a archivos Excel
                        </p>
                    </div>
                    <Button onClick={handleExportAll} className="flex items-center space-x-2">
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
                                        Todos los datos se exportan en formato Excel (.xlsx)
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
                                            <span className="font-medium">Excel (.xlsx)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tamaño aprox:</span>
                                            <span className="font-medium">~50KB</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleExport(table.name)}
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
                                    <li>Haz clic en el botón "Exportar" de la tabla que desees</li>
                                    <li>El archivo se descargará automáticamente en formato Excel</li>
                                    <li>Los datos incluyen toda la información visible en la tabla</li>
                                </ul>

                                <p className="pt-2"><strong>Exportación Masiva:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>Usa el botón "Exportar Todo" para descargar todas las tablas</li>
                                    <li>Se creará un archivo consolidado con múltiples hojas</li>
                                    <li>Cada hoja corresponde a una tabla del sistema</li>
                                </ul>

                                <p className="pt-2"><strong>Notas importantes:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                                    <li>Los archivos se generan con los datos actuales del sistema</li>
                                    <li>Se mantiene el formato y estructura de las tablas originales</li>
                                    <li>Compatible con Excel, LibreOffice Calc y Google Sheets</li>
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