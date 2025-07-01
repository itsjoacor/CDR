import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const CargarInsumo: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [grupo, setGrupo] = useState('');
    const [codigo, setCodigo] = useState('');
    const [detalle, setDetalle] = useState('');
    const [costo, setCosto] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setGrupo('');
        setCodigo('');
        setDetalle('');
        setCosto(0);
    };

    const handleSave = async () => {
        // ... validaciones previas permanecen igual ...

        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/insumos/registrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grupo: grupo.trim(),
                    codigo: codigo.trim().toUpperCase(),
                    detalle: detalle.trim(),
                    costo: costo
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Manejo específico para código duplicado
                if (errorData.message?.includes('duplicate key value violates unique constraint "insumos_pkey"')) {
                    throw new Error('Insumo ya existente');
                }

                throw new Error(errorData.message || 'Error al guardar el insumo');
            }

            const data = await response.json();

            toast({
                title: "Éxito",
                description: `Insumo ${data.codigo} creado correctamente.`,
                variant: "default"
            });

            resetForm();

        } catch (error: any) {
            console.error('Error al guardar insumo:', error);
            toast({
                title: "Error",
                description: error.message || 'Ocurrió un error al guardar el insumo',
                variant: "destructive"
            });

            // Mantener el foco en el campo de código si es error de duplicado
            if (error.message === 'Insumo ya existente') {
                const codigoInput = document.getElementById('codigo');
                codigoInput?.focus();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout title="Nuevo Insumo">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/insumos')}
                        className="flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Volver a Insumos</span>
                    </Button>
                </div>

                {/* Info Badge */}
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    📦 Crear Nuevo Insumo - Material Externo
                </Badge>

                {/* Información del Insumo */}
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <span className="text-xl">📦</span>
                            <span>Información del Insumo</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Grupo */}
                            <div className="space-y-2">
                                <Label htmlFor="grupo">Grupo*</Label>
                                <Input
                                    id="grupo"
                                    value={grupo}
                                    onChange={(e) => setGrupo(e.target.value)}
                                    placeholder="Ej: Telas, Hilos, Accesorios"
                                    className="text-lg font-semibold max-w-80"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Categoría o grupo al que pertenece el insumo
                                </p>
                            </div>

                            {/* Código */}
                            <div className="space-y-2">
                                <Label htmlFor="codigo">Código*</Label>
                                <Input
                                    id="codigo"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                    placeholder="Ej: TEL-ALG-001"
                                    className="text-lg font-semibold max-w-60 uppercase"
                                    maxLength={15}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Código único identificativo del insumo (máx. 15 caracteres)
                                </p>
                            </div>

                            {/* Detalle */}
                            <div className="space-y-2">
                                <Label htmlFor="detalle">Detalle*</Label>
                                <Input
                                    id="detalle"
                                    value={detalle}
                                    onChange={(e) => setDetalle(e.target.value)}
                                    placeholder="Ej: Tela algodón 100% blanca"
                                    className="text-lg font-semibold"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Descripción detallada del insumo
                                </p>
                            </div>

                            {/* Costo */}
                            <div className="space-y-2">
                                <Label htmlFor="costo">Costo*</Label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg font-semibold">$</span>
                                    <Input
                                        id="costo"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costo}
                                        onChange={(e) => setCosto(Number(e.target.value))}
                                        placeholder="0.00"
                                        className="text-lg font-semibold max-w-60"
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Costo unitario del insumo en pesos colombianos
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Resumen */}
                <Card className="bg-purple-50 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-purple-800">
                            <span className="text-xl">📋</span>
                            <span>Resumen del Insumo</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-medium">Grupo:</span>
                                <span className="text-purple-800">{grupo || 'Sin definir'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-medium">Código:</span>
                                <span className="text-purple-800 font-mono">{codigo || 'Sin definir'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-medium">Detalle:</span>
                                <span className="text-purple-800">{detalle || 'Sin definir'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-purple-700 font-medium">Costo:</span>
                                <span className="text-purple-800 font-semibold">
                                    ${costo.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex space-x-2">
                    <Button
                        onClick={handleSave}
                        className="flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <Save className="h-4 w-4" />
                        <span>{isLoading ? "Guardando..." : "Guardar Insumo"}</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={resetForm}
                        className="flex items-center space-x-2"
                        disabled={isLoading}
                    >
                        <Minus className="h-4 w-4" />
                        <span>Borrar campos</span>
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default CargarInsumo;