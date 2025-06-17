'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RecetaForm {
    sector_productivo: string
    codigo_ingrediente: string
    descripcion_ingrediente: string
    cantidad_ingrediente: number
    codigo_producto: string
    descripcion_producto: string
}

export default function CargarReceta() {
    const router = useRouter()
    const [form, setForm] = useState<RecetaForm>({
        sector_productivo: '',
        codigo_ingrediente: '',
        descripcion_ingrediente: '',
        cantidad_ingrediente: 0,
        codigo_producto: '',
        descripcion_producto: '',
    })

    const [sectores, setSectores] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchSectores = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recetas/sectores`)
                const data = await res.json()

                // ✅ Corregido: convertir array de objetos a array de strings
                const nombres = data.map((s: { nombre: string }) => s.nombre)
                setSectores(nombres)
            } catch (err) {
                console.error('Error al cargar sectores', err)
            }
        }

        fetchSectores()
    }, [])


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(prev => ({
            ...prev,
            [name]: name === 'cantidad_ingrediente' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recetas/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (!res.ok) throw new Error(await res.text())
            router.push(`/visualizar`)
        } catch (err: any) {
            setError(err.message || 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white text-gray-800 rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Nueva Receta</h1>

            {error && <div className="mb-4 text-red-600 bg-red-100 p-2 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Select dinámico */}
                <div>
                    <label className="block mb-1 text-sm font-medium">Sector Productivo</label>
                    <select
                        name="sector_productivo"
                        value={form.sector_productivo}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        required
                    >
                        <option value="">Seleccionar Sector</option>
                        {sectores.map((s, i) => (
                            <option key={i} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                </div>

                <input
                    type="text"
                    name="codigo_ingrediente"
                    placeholder="Código ingrediente"
                    value={form.codigo_ingrediente}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="text"
                    name="descripcion_ingrediente"
                    placeholder="Descripción ingrediente"
                    value={form.descripcion_ingrediente}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="number"
                    name="cantidad_ingrediente"
                    placeholder="Cantidad ingrediente"
                    value={form.cantidad_ingrediente}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    step="0.01"
                    min="0"
                    required
                />

                <input
                    type="text"
                    name="codigo_producto"
                    placeholder="Código producto final"
                    value={form.codigo_producto}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <input
                    type="text"
                    name="descripcion_producto"
                    placeholder="Descripción producto final"
                    value={form.descripcion_producto}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {loading ? 'Cargando...' : 'Guardar Receta'}
                </button>
            </form>
        </div>
    )
}
