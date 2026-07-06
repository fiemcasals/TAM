"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store/app"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Archive } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function EnDepositoPage() {
    const { vehicles } = useAppStore()

    const [searchTerm, setSearchTerm] = useState("")
    const tanksInDeposit = vehicles
        .filter(v => v.status === 'in_deposit')
        .filter(v =>
            v.ni.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.origen_unit.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.status_updated_at || b.entry_date).getTime() - new Date(a.status_updated_at || a.entry_date).getTime())

    return (
        <div className="p-8 w-full space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tanques en Depósito</h1>
                    <p className="text-slate-500 mt-2">Unidades a la espera de ingreso a la línea de modernización.</p>
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5 text-red-600" />
                        Flota en Depósito ({tanksInDeposit.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Identificación (NI)</TableHead>
                                <TableHead>Unidad de Origen</TableHead>
                                <TableHead>Fecha de Ingreso a Depósito</TableHead>
                                <TableHead className="text-right pr-6">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tanksInDeposit.map((tank) => (
                                <TableRow key={tank.id}>
                                    <TableCell className="pl-6 font-bold text-slate-900">{tank.ni}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                                            {tank.origen_unit}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{new Date(tank.status_updated_at || tank.entry_date).toLocaleString()}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Link href={`/planta/${tank.id}`}>
                                            <Button size="sm" variant="outline" className="text-slate-600">Ver Detalle</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {tanksInDeposit.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Archive className="h-8 w-8 text-slate-300" />
                                            <p>No hay vehículos en depósito con ese filtro.</p>
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
