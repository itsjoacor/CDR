"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Warning from "@/app/components/Warnings";
import { Eye, EyeClosed, ArrowLeft } from "lucide-react";

export default function IniciarSesion() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");

  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [textoInfo, setTextoInfo] = useState("");
  const [navigateInfo, setNavigateInfo] = useState("");
  const [mostrarContrasenia, setMostrarContrasenia] = useState(false);

  useEffect(() => {
    sesionIniciada();
  }, []);

  const sesionIniciada = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/autorizacion/verificarSesion`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 401) {
      localStorage.removeItem("token");
      return;
    }

    if (res.ok) {
      router.push("/");
    }
  };

  const [formData, setFormData] = useState({
    usuario: "",
    contrasenia: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/autorizacion/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: formData.usuario,
            contrasenia: formData.contrasenia,
          }),
        }
      );


      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        router.push("/");
      } else {
        setTextoInfo("Credenciales inválidas");
        setMostrarInfo(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-indigo-50 font-sans">
      <div className="flex items-center justify-center min-h-screen px-4">
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 bg-white/80 hover:bg-white text-gray-700 py-2 px-4 rounded-full shadow-sm transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-sm w-full max-w-md text-gray-800 border border-white space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-light text-gray-800">
              Iniciar sesión
            </h1>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {errorMsg && (
            <p className="text-rose-500 text-sm text-center">{errorMsg}</p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Usuario
              </label>
              <input
                type="text"
                name="usuario"
                placeholder="nombre@ejemplo.com"
                value={formData.usuario}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full p-3 rounded-lg bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarContrasenia ? "text" : "password"}
                  name="contrasenia"
                  placeholder="••••••••"
                  value={formData.contrasenia}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  className="w-full p-3 rounded-lg bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit(e as React.FormEvent);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasenia(!mostrarContrasenia)}
                  className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                  tabIndex={-1}
                >
                  {mostrarContrasenia ? (
                    <EyeClosed size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-lg transition-colors duration-300 shadow-sm hover:shadow-md"
          >
            Acceder
          </button>

          <div className="text-center text-sm text-gray-500 pt-2">
            <p>Usuarios de prueba:</p>
            <p>
              <span className="font-medium">admin</span> | contraseña:{" "}
              <span className="font-medium">admin</span>
            </p>
            <p>
              <span className="font-medium">usuario</span> | contraseña:{" "}
              <span className="font-medium">usuario</span>
            </p>
          </div>
        </form>
      </div>

      {mostrarInfo && (
        <Warning
          texto={textoInfo}
          rutaDestino={navigateInfo}
          setInfo={setMostrarInfo}
        />
      )}
    </div>
  );
}