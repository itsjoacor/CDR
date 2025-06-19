import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Receta from "./pages/Receta";
import ManoObra from "./pages/ManoObra";
import ManoEnergia from "./pages/ManoEnergia";
import Insumos from "./pages/Insumos";
import CDR from "./pages/CDR";
import NotFound from "./pages/NotFound";
import { UnauthenticatedOnlyWrapper } from "./components/UnauthenticatedOnlyWrapper";

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
              <Route path="/receta" element={<Receta />} />
              <Route path="/mano-obra" element={<ManoObra />} />
              <Route path="/mano-energia" element={<ManoEnergia />} />

              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/insumos" element={<Insumos />} />
                <Route path="/cdr" element={<CDR />} />
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