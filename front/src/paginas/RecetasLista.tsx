'use client';
import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface Receta {
  codigo_producto: string;
  descripcion_producto: string;
  codigo_ingrediente: string;
  descripcion_ingrediente: string;
  cantidad_ingrediente: number;
  costo_ingrediente?: number;
  costo_mano_obra?: number;
  costo_matriz_energetica?: number;
  costo_total?: number;
  valor_cdr?: number;
  sector_productivo: string;
}

export default function RecetaList() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recetas`);
        if (!res.ok) throw new Error('Error al obtener recetas');
        const data = await res.json();
        setRecetas(data);
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8 text-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-8">
          <FlaskConical size={28} className="text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Visualización de Recetas</h1>
        </div>
        <p className="text-gray-600 mb-6">
          A continuación se listan todas las recetas registradas, con su respectiva información de costos y composición.
        </p>

        {/* Estados de carga / error */}
        {loading && <p className="text-sm text-gray-500">Cargando recetas...</p>}
        {error && <p className="text-red-600 font-semibold">{error}</p>}

        {!loading && recetas.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md px-4 py-3 text-sm">
            No hay recetas registradas en el sistema.
          </div>
        )}

        {/* Tabla */}
        {recetas.length > 0 && (
          <div className="overflow-x-auto border rounded-md shadow-sm bg-white">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 border-b text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cod Prod</th>
                  <th className="px-4 py-3">Ingrediente</th>
                  <th className="px-4 py-3">Cod Ingr</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Costo Ing.</th>
                  <th className="px-4 py-3 text-right">Costo MO</th>
                  <th className="px-4 py-3 text-right">Costo ME</th>
                  <th className="px-4 py-3 text-right">Costo Total</th>
                  <th className="px-4 py-3 text-right">CDR</th>
                </tr>
              </thead>
              <tbody>
                {recetas.map((r, i) => (
                  <tr key={`${r.codigo_producto}-${r.codigo_ingrediente}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{r.descripcion_producto}</td>
                    <td className="px-4 py-3">{r.codigo_producto}</td>
                    <td className="px-4 py-3">{r.descripcion_ingrediente}</td>
                    <td className="px-4 py-3">{r.codigo_ingrediente}</td>
                    <td className="px-4 py-3">{r.sector_productivo}</td>
                    <td className="px-4 py-3 text-right">{r.cantidad_ingrediente}</td>
                    <td className="px-4 py-3 text-right">{r.costo_ingrediente?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-right">{r.costo_mano_obra?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-right">{r.costo_matriz_energetica?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {r.costo_total?.toFixed(2) ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {r.valor_cdr?.toFixed(2) ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
