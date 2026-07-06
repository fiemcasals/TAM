"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store/app"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Activity, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FleetStatusNav } from "@/components/vehicles/FleetStatusNav"

export default function ServicioPage() {
    const { vehicles } = useAppStore()
    
    const [searchTerm, setSearchTerm] = useState("")
    const tanksInService = vehicles
        .filter(v => v.status === 'in_service')
        .filter(v =>
            v.ni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.origen_unit.toLowerCase().includes(searchTerm.toLowerCase())
        )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tanques en Servicio</h1>
                    <p className="text-slate-500 mt-2">Unidades finalizadas y entregadas al ejército.</p>
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
                </div>
            </div>

            <FleetStatusNav vehicles={vehicles} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Flota Operativa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Identificación (NI)</TableHead>
                                <TableHead>Unidad / Destino Final</TableHead>
                                <TableHead>Fecha de Ingreso</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tanksInService.map((tank) => (
                                <TableRow key={tank.id}>
                                    <TableCell className="font-bold text-slate-900">{tank.ni}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                            {tank.origen_unit}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{new Date(tank.entry_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/planta/${tank.id}`}>
                                            <Button size="sm" variant="outline" className="text-slate-600">Ver Historial</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {tanksInService.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Archive className="h-8 w-8 text-slate-300" />
                                            <p>No hay vehículos terminados en servicio.</p>
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
