"use client"

import { useState, useEffect } from "react"
import { getVehicles, updateVehicle } from "@/lib/actions/plantaActions"
import { useAuthStore } from "@/lib/store/auth"
import { Shield, Search, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Vehicle, ArmyStatus } from "@/types"

export default function FlotaPage() {
    const { currentUser } = useAuthStore()
    const isManager = currentUser?.role === 'project_manager'

    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const res = await getVehicles()
        if (res.success && res.vehicles) {
            setVehicles(res.vehicles as Vehicle[])
        }
        setLoading(false)
    }

    const armyVehicles = vehicles.filter(v => v.status === 'in_army')
    
    const filteredVehicles = armyVehicles.filter(v => 
        v.ni.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.origen_unit.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleUpdateArmyStatus = async (id: string, army_status: ArmyStatus) => {
        const v = vehicles.find(x => x.id === id)
        if (!v) return
        const res = await updateVehicle(id, { ni: v.ni, origen_unit: v.origen_unit, status: v.status, army_status })
        if (res.success) {
            loadData()
        } else {
            alert(res.message)
        }
    }

    const handleEditObservations = async (id: string) => {
        const v = vehicles.find(x => x.id === id)
        if (!v) return
        const value = window.prompt("Detalles / observaciones del vehículo:", v.observations || "")
        if (value === null) return
        const res = await updateVehicle(id, { ni: v.ni, origen_unit: v.origen_unit, status: v.status, observations: value })
        if (res.success) {
            loadData()
        } else {
            alert(res.message)
        }
    }

    const handleSendToPlant = async (id: string) => {
        if (!confirm("¿Desea ingresar este vehículo a la Planta de Modernización?")) return
        const v = vehicles.find(x => x.id === id)
        if (!v) return
        const res = await updateVehicle(id, { ni: v.ni, origen_unit: v.origen_unit, status: 'in_deposit' })
        if (res.success) {
            alert("El vehículo ha sido enviado al depósito de la planta.")
            loadData()
        } else {
            alert(res.message)
        }
    }

    if (!isManager) {
        return <div className="p-8 text-center text-red-500">Acceso denegado. Se requieren permisos de Project Manager.</div>
    }

    return (
        <div className="p-8 w-full space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Shield className="h-8 w-8 text-green-700" />
                    Gestión de Flota en Ejército
                </h1>
                <p className="text-slate-500 mt-2">Seguimiento de unidades antes de su ingreso a la planta de modernización.</p>
            </div>

            <Card>
                <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Unidades Registradas ({armyVehicles.length})</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por NI o Unidad..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Cargando vehículos...</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Identificador (NI)</th>
                                    <th className="px-6 py-3">Unidad de Origen</th>
                                    <th className="px-6 py-3">Estado Actual</th>
                                    <th className="px-6 py-3">Detalles</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredVehicles.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-bold text-slate-900">{v.ni}</td>
                                        <td className="px-6 py-4 text-slate-600">{v.origen_unit}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                className={`text-xs px-2 py-1 rounded font-semibold border ${
                                                    v.army_status === 'selected' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    v.army_status === 'discarded' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-slate-100 text-slate-800 border-slate-200'
                                                }`}
                                                value={v.army_status || 'uninspected'}
                                                onChange={(e) => handleUpdateArmyStatus(v.id, e.target.value as ArmyStatus)}
                                            >
                                                <option value="uninspected">Sin Inspeccionar</option>
                                                <option value="selected">Seleccionado (Apto)</option>
                                                <option value="discarded">Descartado (No Apto)</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex items-start gap-2">
                                                <p className="text-slate-600 text-xs flex-1 truncate" title={v.observations || undefined}>
                                                    {v.observations || <span className="italic text-slate-400">Sin detalles</span>}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditObservations(v.id)}
                                                    className="text-slate-400 hover:text-slate-700 shrink-0"
                                                    title="Editar detalles"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                                                onClick={() => handleSendToPlant(v.id)}
                                                disabled={v.army_status !== 'selected'}
                                                title={v.army_status !== 'selected' ? 'Debe estar Seleccionado para ingresar a planta' : 'Ingresar a Planta'}
                                            >
                                                Mover a Planta
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVehicles.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No hay vehículos en el ejército con ese filtro.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
