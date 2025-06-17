'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Eye, EyeOff } from 'lucide-react';

export default function IniciarSesion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/autorizacion/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Credenciales inválidas');

      const data = await res.json();
      Cookies.set('token', data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 border border-gray-200 space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Iniciar sesión</h2>
          <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Usuario</label>
            <input
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-violet-600 text-white font-medium rounded-md hover:bg-violet-700 transition"
        >
          Acceder
        </button>

        <div className="text-xs text-center text-gray-500 pt-4 border-t border-gray-100 mt-4">
          <p className="mb-1">Usuarios de prueba:</p>
          <p>
            <strong>admin</strong> | contraseña: <strong>admin</strong>
          </p>
          <p>
            <strong>usuario</strong> | contraseña: <strong>usuario</strong>
          </p>
        </div>
      </form>
    </main>
  );
}
  