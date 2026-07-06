"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store/app"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Activity, Archive, Wrench, Shield } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { vehicles, activities, checklistItems, vehicleChecklistItems, vehicleActivities } = useAppStore()

  const calculateProgress = (vehicleId: string, status: string) => {
    if (status === 'in_service') return 100
    if (status === 'in_deposit') return 0
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

  const tankStats = {
    in_service: vehicles.filter(v => v.status === 'in_service').length,
    in_plant: vehicles.filter(v => v.status === 'in_plant').length,
    in_deposit: vehicles.filter(v => v.status === 'in_deposit').length,
    in_army: vehicles.filter(v => v.status === 'in_army').length,
  }

  // Get the 5 most recently added/updated vehicles
  const recentTanks = [...vehicles].reverse().slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vista General</h1>
        <p className="text-slate-500 mt-2">Métricas principales de producción y estado de la flota TAM.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Link href="/servicio" className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer bg-blue-50/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">En Servicio</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{tankStats.in_service}</div>
              <p className="text-xs text-blue-600 mt-1">Unidades operativas ➔</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/planta" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
          <Card className="hover:border-amber-500 transition-colors cursor-pointer bg-amber-50/50 shadow-sm border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-amber-700">En Planta</CardTitle>
              <Wrench className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">{tankStats.in_plant}</div>
              <p className="text-xs text-amber-600 mt-1">En proceso de repotenciación ➔</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/en-deposito" className="block focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl">
          <Card className="hover:border-red-500 transition-colors cursor-pointer bg-red-50/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700">En Depósito</CardTitle>
              <Archive className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">{tankStats.in_deposit}</div>
              <p className="text-xs text-red-600 mt-1">A la espera de ingreso ➔</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/flota" className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl">
          <Card className="hover:border-green-500 transition-colors cursor-pointer bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">En Ejército</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{tankStats.in_army}</div>
              <p className="text-xs text-green-600 mt-1">Previo a modernización ➔</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Actividad Reciente</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NI</TableHead>
                <TableHead>Unidad de Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ingreso</TableHead>
                <TableHead>Progreso %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTanks.map((tank) => (
                <TableRow
                  key={tank.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => router.push(`/planta/${tank.id}`)}
                >
                  <TableCell className="font-bold text-blue-600 hover:underline">{tank.ni}</TableCell>
                  <TableCell className="font-medium text-slate-700">{tank.origen_unit}</TableCell>
                  <TableCell>
                    {tank.status === 'in_plant' && <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-xs font-semibold px-2 py-0.5">En Planta</Badge>}
                    {tank.status === 'in_service' && <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-xs font-semibold px-2 py-0.5">En Servicio</Badge>}
                    {tank.status === 'in_deposit' && <Badge variant="destructive" className="text-xs font-semibold px-2 py-0.5">En Depósito</Badge>}
                    {tank.status === 'in_army' && <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs font-semibold px-2 py-0.5">En Ejército</Badge>}
                  </TableCell>
                  <TableCell className="text-slate-600">{new Date(tank.entry_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${tank.status === 'in_service' ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${calculateProgress(tank.id, tank.status)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-bold whitespace-nowrap">
                        {calculateProgress(tank.id, tank.status)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {recentTanks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No hay vehículos registrados en el sistema.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
