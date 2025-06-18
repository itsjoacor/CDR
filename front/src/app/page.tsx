'use client';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import {
  Wrench,
  ClipboardList,
  User2Icon,
  UserMinus2Icon,
  Search,
  Settings,
} from "lucide-react";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rol, setRol] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/autorizacion/verificarSesion`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setIsLoggedIn(true);
      setRol(data.rol); // <- ⚠️ esto debe devolverse desde el backend
    } catch {
      Cookies.remove("token");
      setIsLoggedIn(false);
      setRol(null);
    }
  };

  const cerrarSesion = () => {
    Cookies.remove("token");
    setIsLoggedIn(false);
    setRol(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 font-sans">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-sm w-full max-w-sm text-center border border-gray-100 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Settings size={40} className="text-indigo-600" />
            </div>
          </div>

          <h1 className="text-2xl font-light text-gray-800">Accedé a una sección</h1>
          <p className="text-gray-500 text-sm mb-6">Selecciona una opción para continuar</p>

          <div className="flex flex-col gap-3">
            <button
              className={`w-full flex items-center justify-center gap-3 font-medium py-3 rounded-lg ${isLoggedIn
                  ? "bg-gray-200 text-gray-400"
                  : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md transition-all"
                }`}
              onClick={() => router.push("/iniciar-sesion")}
              disabled={isLoggedIn}
            >
              <User2Icon size={18} />
              Iniciar sesión
            </button>

            {/* Vista para ADMIN */}
            {isLoggedIn && rol === "admin" && (
              <>
                <button
                  className="w-full flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-500 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                  onClick={() => router.push("/cargaRapida")}
                >
                  <Wrench size={18} />
                  Cargar Receta
                </button>

                <button
                  className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                  onClick={() => router.push("/visualizar")}
                >
                  <ClipboardList size={18} />
                  Ver recetas
                </button>

                <button
                  className="w-full flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                  onClick={() => router.push("/Recetas")}
                >
                  <Search size={18} />
                  Editar Recetas
                </button>
              </>
            )}

            {/* Vista para USUARIO */}
            {isLoggedIn && rol === "usuario" && (
              <button
                className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                onClick={() => router.push("/visualizar")}
              >
                <ClipboardList size={18} />
                Ver recetas
              </button>
            )}

            {/* Botón cerrar sesión */}
            {isLoggedIn && (
              <button
                onClick={cerrarSesion}
                className="w-full flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <UserMinus2Icon size={18} />
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
