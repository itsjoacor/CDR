
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

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/receta" element={
              <ProtectedRoute>
                <Receta />
              </ProtectedRoute>
            } />
            <Route path="/mano-obra" element={
              <ProtectedRoute>
                <ManoObra />
              </ProtectedRoute>
            } />
            <Route path="/mano-energia" element={
              <ProtectedRoute>
                <ManoEnergia />
              </ProtectedRoute>
            } />
            <Route path="/insumos" element={
              <ProtectedRoute requiredRole="admin">
                <Insumos />
              </ProtectedRoute>
            } />
            <Route path="/cdr" element={
              <ProtectedRoute requiredRole="admin">
                <CDR />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
