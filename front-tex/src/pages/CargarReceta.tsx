'use client'
import { useState, useEffect } from 'react'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'


interface RecetaForm {
    sector_productivo: string
    codigo_ingrediente: string
    descripcion_ingrediente: string
    cantidad_ingrediente: number
    codigo_producto: string
    descripcion_producto: string
}

export default function CargarReceta() {
    const navigate = useNavigate()
    const { toast } = useToast();
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
                const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas/sectores`)
                const data = await res.json()
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
            const res = await fetch(`${import.meta.env.VITE_API_URL}/recetas/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (!res.ok) throw new Error(await res.text())

            toast({
                title: "Receta cargada correctamente",
                description: "La receta fue guardada y calculada exitosamente.",
            })
            // No navegues, solo dejalo cargado
            setForm({
                sector_productivo: '',
                codigo_ingrediente: '',
                descripcion_ingrediente: '',
                cantidad_ingrediente: 0,
                codigo_producto: '',
                descripcion_producto: '',
            })

        } catch (err: any) {
            setError(err.message || 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }
    

    return (
        <main className="min-h-screen bg-white text-gray-800 px-6 py-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold">🧪 Crear Receta</h1>
                    <p className="text-gray-600 mt-1">Cargá los datos de producción y validación del CDR.</p>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sección: Producto */}
                    <section className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">📦 Producto Final</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm mb-1 font-medium">Código del Producto</label>
                                <input
                                    name="codigo_producto"
                                    value={form.codigo_producto}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 font-medium">Descripción del Producto</label>
                                <input
                                    name="descripcion_producto"
                                    value={form.descripcion_producto}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Sección: Producción */}
                    <section className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">⚙️ Detalles de Producción</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Sector Productivo</label>
                                <Listbox value={form.sector_productivo} onChange={(value) => setForm(prev => ({ ...prev, sector_productivo: value }))}>
                                    <div className="relative">
                                        <ListboxButton className="w-full px-4 py-2 border rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-purple-300">
                                            {form.sector_productivo || 'Seleccione un sector'}
                                        </ListboxButton>

                                        <ListboxOptions className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md z-10 max-h-60 overflow-auto">
                                            {sectores.map((s, i) => (
                                                <ListboxOption key={i} value={s} as={Fragment}>
                                                    {({ active, selected }) => (
                                                        <li
                                                            className={`cursor-pointer px-4 py-2 transition rounded-md ${active ? 'bg-purple-100 text-purple-800' : 'text-gray-800'
                                                                } ${selected ? 'font-medium' : ''}`}
                                                        >
                                                            {s}
                                                        </li>
                                                    )}
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </div>
                                </Listbox>


                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Código del Ingrediente</label>
                                    <input
                                        name="codigo_ingrediente"
                                        value={form.codigo_ingrediente}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        name="cantidad_ingrediente"
                                        value={form.cantidad_ingrediente}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción del Ingrediente</label>
                                <input
                                    name="descripcion_ingrediente"
                                    value={form.descripcion_ingrediente}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-200 text-green-900 font-semibold rounded-md hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60"
                        >
                            {loading ? 'Cargando...' : 'Guardar Receta'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
