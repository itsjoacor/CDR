import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Composicion from "./pages/Composicion";
import ManoObra from "./pages/ManoObra";
import MatrizEnergetica from "./pages/MatrizEnergetica";
import Insumos from "./pages/Insumos";
import CDR from "./pages/CDR";
import ComposicionDetallada from "./pages/ComposicionDetallada";
import NotFound from "./pages/NotFound";
import { UnauthenticatedOnlyWrapper } from "./components/UnauthenticatedOnlyWrapper";
import CargarComposicion from "./pages/CargarComposicion";
import CargarInsumo from "./pages/CargarInsumo";
import CargarProducto from "./pages/CargarProducto";
import PaginaEnProduccion from "./components/PaginaConstruccion";
import Producto from "./pages/Producto";
import CargarEnergia from "./pages/CargarEnergia";
import CargarManoObra from "./pages/CargarManoObra";
import Exportacion from "./pages/Exportacion";
import Actualizacion from "./pages/Actualizacion";
import ActualizacionME from "./pages/ActualizacionME";
import ActualizacionMO from "./pages/ActualizacionMO";
import ActualizarMantencion from "./pages/ActualizarMantencion";
import CDRPorSector from "./pages/CDRPorSector";
import Importacion from "./pages/Importacion";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <UnauthenticatedOnlyWrapper>
                  <Login />
                </UnauthenticatedOnlyWrapper>
              }
            />

            <Route element={<ProtectedRoute />}>

              <Route path="/" element={<Dashboard />} />
              <Route path="/composicion" element={<Composicion />} />
              <Route path="/producto" element={<Producto />} />
              <Route path="/detalle-composicion" element={<ComposicionDetallada />} />

              <Route path="/mano-obra" element={<ManoObra />} />
              <Route path="/matriz-energetica" element={<MatrizEnergetica />} />
              <Route path="/exportacion" element={<Exportacion />} />
              <Route path="/resultados-cdr" element={<CDR />} />
              <Route path="/insumos" element={<Insumos />} />
              <Route path="/resultados-cdr-mantencion" element={<CDRPorSector />} />

              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/cargarComposicion" element={<CargarComposicion />} />
                <Route path="/cargarInsumo" element={<CargarInsumo />} />
                <Route path="/cargarProducto" element={<CargarProducto />} />
                <Route path="/cargarEnergia" element={<CargarEnergia />} />
                <Route path="/cargarManoObra" element={<CargarManoObra />} />
                <Route path="/editarComposicion/:codigo_producto" element={<PaginaEnProduccion />} />
                <Route path="/actualizar" element={<Actualizacion />} />
                <Route path="/actualizarME" element={<ActualizacionME />} />
                <Route path="/actualizarMO" element={<ActualizacionMO />} />
                <Route path="/actualizarMantencion" element={<ActualizarMantencion />} />
                <Route path="/importacion" element={<Importacion />} />




              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;