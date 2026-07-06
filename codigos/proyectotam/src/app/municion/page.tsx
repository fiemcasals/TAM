"use client"

import { useState, useEffect } from "react"
import { getAmmunition, addAmmunition, addAmmunitionBatch, assignAmmunition } from "@/lib/actions/ammoActions"
import { getVehicles } from "@/lib/actions/plantaActions"
import { useAuthStore } from "@/lib/store/auth"
import { Target, Search, Plus, PackageOpen, Rocket } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Ammunition, Vehicle } from "@/types"

export default function MunicionPage() {
    const { currentUser } = useAuthStore()
    const isManager = currentUser?.role === 'project_manager' || currentUser?.role === 'ammo_manager' || currentUser?.role === 'admin'

    const [ammoList, setAmmoList] = useState<Ammunition[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [ammoRes, vRes] = await Promise.all([
                getAmmunition(),
                getVehicles()
            ])
            if (ammoRes.success) setAmmoList(ammoRes.data as Ammunition[])
            if (vRes.success) {
                // Vehículos en Planta reciben munición para las pruebas de tiro previas a Certificación
                const inPlant = (vRes.vehicles as Vehicle[]).filter(v => v.status === 'in_plant')
                setVehicles(inPlant)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredAmmo = ammoList.filter(a => 
        a.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.caliber && a.caliber.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleCreateAmmo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const type = fd.get("type") as string
        const caliber = fd.get("caliber") as string
        const desc = fd.get("description") as string

        const res = await addAmmunition(type, caliber, desc)
        if (res.success) {
            alert("Munición registrada con éxito")
            loadData()
            ;(e.target as HTMLFormElement).reset()
        } else {
            alert(res.message)
        }
    }

    const handleAddBatch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const ammoId = fd.get("ammo_id") as string
        const batchNum = fd.get("batch_number") as string
        const qty = parseInt(fd.get("quantity") as string)

        if (!ammoId || !qty) return

        const res = await addAmmunitionBatch(ammoId, batchNum, qty)
        if (res.success) {
            alert("Lote ingresado con éxito")
            loadData()
            ;(e.target as HTMLFormElement).reset()
        } else {
            alert(res.message)
        }
    }

    const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const vehicleId = fd.get("vehicle_id") as string
        const batchId = fd.get("batch_id") as string
        const qty = parseInt(fd.get("quantity") as string)

        if (!vehicleId || !batchId || !qty) return

        const res = await assignAmmunition(vehicleId, batchId, qty)
        if (res.success) {
            alert("Munición asignada al vehículo con éxito")
            loadData()
            ;(e.target as HTMLFormElement).reset()
        } else {
            alert(res.message)
        }
    }

    if (!isManager) {
        return <div className="p-8 text-center text-red-500">Acceso denegado. Se requieren permisos de Encargado de Munición.</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Target className="h-8 w-8 text-red-600" />
                        Módulo de Munición
                    </h1>
                    <p className="text-slate-500 mt-2">Gestión exclusiva de armamento y asignación a unidades en planta para pruebas de tiro.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Stock Table */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Inventario de Munición</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input 
                                        type="text" 
                                        placeholder="Buscar munición..." 
                                        className="pl-9 bg-white" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">Cargando inventario...</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-3">Tipo / Calibre</th>
                                            <th className="px-6 py-3">Descripción</th>
                                            <th className="px-6 py-3">Lotes y Disponibilidad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredAmmo.map(ammo => (
                                            <tr key={ammo.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-900">{ammo.type}</p>
                                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-800">{ammo.caliber || "N/A"}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{ammo.description}</td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {ammo.batches?.length === 0 && <span className="text-xs text-slate-400">Sin stock</span>}
                                                        {ammo.batches?.map(b => (
                                                            <div key={b.id} className="flex justify-between items-center text-xs bg-slate-100 p-1 rounded">
                                                                <span className="font-mono text-slate-600">Lote: {b.batch_number || "S/N"}</span>
                                                                <span className="font-bold text-green-700 bg-green-100 px-1 rounded">{b.available_quantity} disp.</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredAmmo.length === 0 && (
                                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No hay munición registrada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Management Forms */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="bg-red-50 border-b border-red-100 pb-4">
                            <CardTitle className="text-red-800 text-md flex items-center gap-2">
                                <Rocket className="h-5 w-5" />
                                Asignar a Vehículo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleAssign} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Vehículo en Planta</label>
                                    <select name="vehicle_id" required className="w-full h-10 mt-1 px-3 bg-white border border-slate-300 rounded-md text-sm">
                                        <option value="">Seleccione vehículo...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.ni} ({v.origen_unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Lote de Munición</label>
                                    <select name="batch_id" required className="w-full h-10 mt-1 px-3 bg-white border border-slate-300 rounded-md text-sm">
                                        <option value="">Seleccione lote...</option>
                                        {ammoList.map(a => (
                                            <optgroup key={a.id} label={`${a.type} (${a.caliber})`}>
                                                {a.batches?.filter(b => b.available_quantity > 0).map(b => (
                                                    <option key={b.id} value={b.id}>Lote {b.batch_number} - Disp: {b.available_quantity}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Cantidad</label>
                                    <Input type="number" name="quantity" required min="1" className="mt-1" />
                                </div>
                                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Asignar Dotación</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-md flex items-center gap-2">
                                <PackageOpen className="h-5 w-5 text-blue-600" />
                                Ingreso de Lote
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleAddBatch} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Tipo de Munición</label>
                                    <select name="ammo_id" required className="w-full h-10 mt-1 px-3 bg-white border border-slate-300 rounded-md text-sm">
                                        <option value="">Seleccione...</option>
                                        {ammoList.map(a => (
                                            <option key={a.id} value={a.id}>{a.type} ({a.caliber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">Lote N°</label>
                                        <Input type="text" name="batch_number" required className="mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700">Cantidad</label>
                                        <Input type="number" name="quantity" required min="1" className="mt-1" />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" variant="outline">Cargar Stock</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-md flex items-center gap-2">
                                <Plus className="h-5 w-5 text-green-600" />
                                Nueva Munición
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <form onSubmit={handleCreateAmmo} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Tipo (Ej: APFSDS)</label>
                                    <Input type="text" name="type" required className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Calibre (Ej: 105mm)</label>
                                    <Input type="text" name="caliber" required className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Descripción</label>
                                    <Input type="text" name="description" className="mt-1" />
                                </div>
                                <Button type="submit" className="w-full bg-slate-900">Registrar Catálogo</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
