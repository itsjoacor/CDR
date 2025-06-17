'use client'
import { useEffect, useState } from 'react'

interface Receta {
    codigo_producto: string
    descripcion_producto: string
    codigo_ingrediente: string
    descripcion_ingrediente: string
    cantidad_ingrediente: number
    costo_ingrediente?: number
    costo_mano_obra?: number
    costo_matriz_energetica?: number
    costo_total?: number
    valor_cdr?: number
    sector_productivo: string
}

export default function RecetaList() {
    const [recetas, setRecetas] = useState<Receta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recetas`)
                if (!res.ok) throw new Error('Error al obtener recetas')
                const data = await res.json()
                setRecetas(data)
            } catch (err: any) {
                setError(err.message || 'Error desconocido')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="max-w-7xl mx-auto mt-8 p-4 bg-white rounded shadow text-gray-800">
            <h1 className="text-2xl font-bold mb-6">Listado de Recetas</h1>

            {loading && <p className="text-sm text-gray-500">Cargando recetas...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && recetas.length === 0 && <p>No hay recetas registradas.</p>}

            {recetas.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-blue-100 text-blue-800">
                            <tr>
                                <th className="px-3 py-2 text-left">Producto</th>
                                <th className="px-3 py-2 text-left">Ingrediente</th>
                                <th className="px-3 py-2 text-left">Sector Productivo</th>
                                <th className="px-3 py-2 text-left">Cantidad</th>
                                <th className="px-3 py-2 text-left">Costo Ing.</th>
                                <th className="px-3 py-2 text-left">Costo MO</th>
                                <th className="px-3 py-2 text-left">Costo ME</th>
                                <th className="px-3 py-2 text-left">Costo Total</th>
                                <th className="px-3 py-2 text-left">CDR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recetas.map((r, i) => (
                                <tr key={`${r.codigo_producto}-${r.codigo_ingrediente}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2">{r.descripcion_producto}</td>
                                    <td className="px-3 py-2">{r.descripcion_ingrediente}</td>
                                    <td className="px-3 py-2">{r.sector_productivo}</td>
                                    <td className="px-3 py-2">{r.cantidad_ingrediente}</td>
                                    <td className="px-3 py-2">{r.costo_ingrediente ?? '-'}</td>
                                    <td className="px-3 py-2">{r.costo_mano_obra ?? '-'}</td>
                                    <td className="px-3 py-2">{r.costo_matriz_energetica ?? '-'}</td>
                                    <td className="px-3 py-2">{r.costo_total ?? '-'}</td>
                                    <td className="px-3 py-2">{r.valor_cdr ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
