import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Database, CheckCircle, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const updateTypes = {
  general: {
    icon: <Database className="inline h-4 w-4 mr-1" />,
    color: "border-indigo-200",
  },
  manoDeObra: {
    icon: <Database className="inline h-4 w-4 mr-1" />,
    color: "border-green-200",
  },
  matrizEnergetica: {
    icon: <Database className="inline h-4 w-4 mr-1" />,
    color: "border-yellow-200",
  },
};

const Actualizacion: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateType = searchParams.get("tipo") || "general";
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const currentUpdate =
    updateTypes[updateType as keyof typeof updateTypes] || updateTypes.general;

  const handleUpdateMO = () => {
    navigate("/actualizarMO");
  };

  const handleUpdateME = () => {
    navigate("/actualizarME");
  };

  return (
    <Layout title="Centro de Actualización">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Button>
            <div>
              <Badge variant="outline" className="bg-indigo-50">
                {currentUpdate.icon} Centro de Actualización
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Actualización de costos generales.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mano de Obra Card */}
          <Card className={`${currentUpdate.color} h-full`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                {currentUpdate.icon}
                <h2 className="text-lg">Mano de Obra</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Actualiza los costos de mano de obra
                </p>

                {isUpdating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso:</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    className="flex items-center space-x-2"
                    size="sm"
                    onClick={handleUpdateMO}
                  >
                    {isUpdating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Actualizar costo MO</span>
                      </>
                    )}
                  </Button>

                  {lastUpdate && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>{lastUpdate}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matriz Energética Card */}
          <Card className={`${currentUpdate.color} h-full`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                {currentUpdate.icon}
                <h2 className="text-lg">Matriz Energética</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Actualiza los valores energéticos
                </p>

                {isUpdating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso:</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    className="flex items-center space-x-2"
                    size="sm"
                    onClick={handleUpdateME}
                  >
                    {isUpdating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Actualizar costo ME</span>
                      </>
                    )}
                  </Button>

                  {lastUpdate && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>{lastUpdate}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Actualizacion;
