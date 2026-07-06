"use client"

import { useState, useEffect } from "react"
import { getVehicles, updateVehicle } from "@/lib/actions/plantaActions"
import { useAuthStore } from "@/lib/store/auth"
import { Shield, Search, MessageSquareText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ObservationsModal } from "@/components/vehicles/ObservationsModal"
import type { Vehicle, ArmyStatus } from "@/types"

export default function FlotaPage() {
    const { currentUser } = useAuthStore()
    const isManager = currentUser?.role === 'project_manager'

    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [observationsFor, setObservationsFor] = useState<Vehicle | null>(null)

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

    const handleSendToDeposito = async (id: string) => {
        if (!confirm("¿Desea pasar este vehículo a Depósito?")) return
        const v = vehicles.find(x => x.id === id)
        if (!v) return
        const res = await updateVehicle(id, { ni: v.ni, origen_unit: v.origen_unit, status: 'in_deposit' })
        if (res.success) {
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
                                    <th className="px-6 py-3">Observaciones</th>
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
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setObservationsFor(v)}
                                                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                <MessageSquareText className="h-3.5 w-3.5" /> Observaciones
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                disabled={v.army_status !== 'selected'}
                                                onClick={() => handleSendToDeposito(v.id)}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
                                                title={v.army_status !== 'selected' ? 'Debe estar Seleccionado para pasar a Depósito' : 'Enviar a Depósito'}
                                            >
                                                Enviar a Depósito
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

            {observationsFor && (
                <ObservationsModal
                    vehicleId={observationsFor.id}
                    vehicleNi={observationsFor.ni}
                    authorName={currentUser?.name || "Desconocido"}
                    canAdd={isManager}
                    onClose={() => setObservationsFor(null)}
                />
            )}
        </div>
    )
}
