"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store/app"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FleetStatusNav } from "@/components/vehicles/FleetStatusNav"

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

  // Get the 5 most recently added/updated vehicles
  const recentTanks = [...vehicles].reverse().slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vista General</h1>
        <p className="text-slate-500 mt-2">Métricas principales de producción y estado de la flota TAM.</p>
      </div>

      <FleetStatusNav vehicles={vehicles} />

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
