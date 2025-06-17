import { useEffect, useState } from "react"

interface Receta {
    codigo_producto: string
    descripcion_producto: string
}

export default function RecetasPorProducto() {
    const [recetas, setRecetas] = useState<Receta[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recetas`)
                if (!res.ok) throw new Error("Error al obtener recetas")
                const data = await res.json()

                const unicos = Array.from(
                    new Map(data.map((r: Receta) => [r.codigo_producto, r])).values()
                )

                setRecetas(unicos)
            } catch (err: any) {
                setError(err.message || "Error desconocido")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    return (
        <div className="min-h-screen bg-white px-6 py-10">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Recetas por Producto</h1>

                {loading && <p className="text-gray-500">Cargando recetas...</p>}
                {error && <p className="text-red-600">{error}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recetas.map((r) => (
                        <div
                            key={r.codigo_producto}
                            className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-md transition-all"
                        >
                            <h2 className="text-lg font-semibold text-gray-800">
                                {r.descripcion_producto}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Código: {r.codigo_producto}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
