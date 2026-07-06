"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store/app"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FleetStatusNav } from "@/components/vehicles/FleetStatusNav"

export default function PlantaPage() {
    const { vehicles, activities, checklistItems, vehicleChecklistItems, vehicleActivities } = useAppStore()
    const currentUser = useAuthStore(state => state.currentUser)
    const canWorkOnVehicles = currentUser?.role === 'operator' || currentUser?.role === 'supervisor' || currentUser?.role === 'project_manager'
    
    const isOperator = currentUser?.role === 'operator'
    const [searchTerm, setSearchTerm] = useState("")
    const [progressFilter, setProgressFilter] = useState<'all' | 'not_started' | 'in_progress' | 'complete'>('all')

    // Helper to calculate real progress based on checked items
    const calculateProgress = (vehicleId: string) => {
        if (!activities.length || !checklistItems.length) return 0

        const actualTotalChecklists = checklistItems.length

        const completedItems = vehicleChecklistItems.filter(vci => {
            const vActs = vehicleActivities.filter(va => va.vehicle_id === vehicleId)
            const vActIds = vActs.map(va => va.id)
            return vActIds.includes(vci.vehicle_activity_id) && vci.is_completed
        }).length

        if (actualTotalChecklists === 0) return 0
        return Math.round((completedItems / actualTotalChecklists) * 100)
    }

    const tanksInPlant = vehicles
        .filter(v => v.status === 'in_plant')
        .filter(v => {
            if (!isOperator) return true
            if (!v.assigned_operators || v.assigned_operators.length === 0) return true
            return v.assigned_operators.includes(currentUser.id)
        })
        .filter(v =>
            v.ni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.origen_unit.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(v => {
            if (progressFilter === 'all') return true
            const p = calculateProgress(v.id)
            if (progressFilter === 'not_started') return p === 0
            if (progressFilter === 'in_progress') return p > 0 && p < 100
            return p === 100
        })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Línea de Producción</h1>
                    <p className="text-slate-500 mt-2">Gestión y control de las unidades de tanque actualmente en planta.</p>
                </div>
                <div className="flex items-center gap-2">
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
                    <div className="relative">
                        <SlidersHorizontal className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                            value={progressFilter}
                            onChange={(e) => setProgressFilter(e.target.value as typeof progressFilter)}
                            className="h-10 pl-9 pr-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                            title="Filtrar por progreso"
                        >
                            <option value="all">Todos los progresos</option>
                            <option value="not_started">Sin iniciar</option>
                            <option value="in_progress">En progreso</option>
                            <option value="complete">Completo</option>
                        </select>
                    </div>
                </div>
            </div>

            <FleetStatusNav vehicles={vehicles} />

            <Card>
                <CardHeader>
                    <CardTitle>Unidades Activas en Proceso</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Identificación (NI)</TableHead>
                                <TableHead>Unidad de Origen</TableHead>
                                <TableHead>Progreso %</TableHead>
                                <TableHead>Ingreso a Planta</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tanksInPlant.map((tank) => (
                                <TableRow key={tank.id}>
                                    <TableCell className="font-bold text-slate-900">{tank.ni}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">{tank.origen_unit}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${calculateProgress(tank.id)}%` }} />
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">{calculateProgress(tank.id)}% Completado</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{new Date(tank.entry_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/planta/${tank.id}`}>
                                                <Button size="sm" variant="outline" className="text-slate-600">Ver Detalles</Button>
                                            </Link>
                                            {canWorkOnVehicles && (
                                                <Link href={`/planta/${tank.id}?mode=work`}>
                                                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 shadow-sm">Trabajar</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {tanksInPlant.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Archive className="h-8 w-8 text-slate-300" />
                                            <p>No hay vehículos actualmente en la línea de producción.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
