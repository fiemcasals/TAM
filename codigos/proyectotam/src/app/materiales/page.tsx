"use client"

import { useState, useEffect } from "react"
import { getMaterialsReport } from "@/lib/actions/supplyActions"
import { 
    Package, 
    Search, 
    Layers, 
    History, 
    User, 
    Calendar, 
    Activity, 
    Info, 
    Filter, 
    Archive, 
    CheckCircle2, 
    TrendingUp,
    Truck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Supply {
    id: string
    name: string
    description: string
    family?: string
    batches: SupplyBatch[]
}

interface SupplyBatch {
    id: string
    supply_id: string
    batch_number?: string
    serial_numbers: string[]
    available_quantity: number
    entry_date: string
}

interface Consumption {
    id: string
    vehicle_activity_id: string
    supply_batch_id: string
    serial_number?: string
    quantity_used: number
    operator_id: string
    timestamp: string
    supplyBatch: {
        batch_number?: string
        supply: {
            name: string
            family?: string
        }
    }
    vehicleActivity: {
        activity: {
            name: string
        }
        vehicle: {
            ni: string
            origen_unit: string
        }
    }
}

interface AppUser {
    id: string
    name: string
    lastName?: string
    email: string
}

export default function MaterialsPage() {
    const [activeTab, setActiveTab] = useState<"stock" | "used">("stock")
    const [supplies, setSupplies] = useState<Supply[]>([])
    const [consumptions, setConsumptions] = useState<Consumption[]>([])
    const [users, setUsers] = useState<AppUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [familyFilter, setFamilyFilter] = useState("all")
    const [unitSearch, setUnitSearch] = useState("")

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await getMaterialsReport()
                if (res.success && res.data) {
                    setSupplies(res.data.supplies || [])
                    setConsumptions(res.data.consumptions || [])
                    setUsers(res.data.users || [])
                } else {
                    setError(res.message || "Error al cargar los datos.")
                }
            } catch (err) {
                console.error(err)
                setError("Error de conexión al servidor.")
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-"
        return new Date(dateStr).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const getOperatorName = (id: string) => {
        const user = users.find(u => u.id === id)
        if (!user) return `Operario #${id.substring(0, 4)}`
        return `${user.name} ${user.lastName || ""}`.trim()
    }

    // List of unique families for dropdown filter
    const families = Array.from(
        new Set(supplies.map(s => s.family).filter(Boolean))
    ) as string[]

    // --- Filter logic ---

    // Filter for existing supplies (Stock tab)
    const filteredStock = supplies.filter(s => {
        const matchesSearch = 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesFamily = familyFilter === "all" || s.family === familyFilter
        return matchesSearch && matchesFamily
    })

    // Filter for consumptions (Used tab)
    const filteredUsed = consumptions.filter(c => {
        const supplyName = c.supplyBatch?.supply?.name || ""
        const matchesSearch = 
            supplyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.serial_number && c.serial_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.supplyBatch?.batch_number && c.supplyBatch.batch_number.toLowerCase().includes(searchQuery.toLowerCase()))
        
        const matchesFamily = 
            familyFilter === "all" || 
            c.supplyBatch?.supply?.family === familyFilter

        const matchesUnit = 
            !unitSearch || 
            (c.vehicleActivity?.vehicle?.ni && c.vehicleActivity.vehicle.ni.toLowerCase().includes(unitSearch.toLowerCase())) ||
            (c.vehicleActivity?.vehicle?.origen_unit && c.vehicleActivity.vehicle.origen_unit.toLowerCase().includes(unitSearch.toLowerCase()))

        return matchesSearch && matchesFamily && matchesUnit
    })


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400 text-sm">Cargando reporte de trazabilidad...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 max-w-lg mx-auto text-center">
                    <h3 className="font-bold mb-2">Error de Carga</h3>
                    <p>{error}</p>
                    <Button onClick={() => window.location.reload()} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                        Reintentar
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 text-slate-100 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    <Layers className="h-8 w-8 text-blue-500" />
                    Control y Trazabilidad de Materiales
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Historial consolidado de existencias en depósito y materiales instalados en cada unidad TAM 2C.
                </p>
            </div>


            {/* Main view container */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                {/* Tabs selection */}
                <div className="flex border-b border-slate-800 bg-slate-950 p-2 gap-2">
                    <button
                        onClick={() => {
                            setActiveTab("stock")
                            setSearchQuery("")
                            setUnitSearch("")
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === "stock"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        Insumos Existentes (Stock)
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("used")
                            setSearchQuery("")
                            setUnitSearch("")
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === "used"
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                    >
                        <History className="h-4 w-4" />
                        Materiales Utilizados (Trazabilidad)
                    </button>
                </div>

                {/* Filters Row */}
                <div className="p-4 bg-slate-900/50 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder={
                                activeTab === "stock" 
                                    ? "Buscar por nombre de insumo..." 
                                    : "Buscar por nombre, serie o lote..."
                            }
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div>
                        <select
                            value={familyFilter}
                            onChange={e => setFamilyFilter(e.target.value)}
                            className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Todas las familias</option>
                            {families.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>

                    {activeTab === "used" && (
                        <div className="relative">
                            <Truck className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Filtrar por Vehículo (NI / Unidad)..."
                                value={unitSearch}
                                onChange={e => setUnitSearch(e.target.value)}
                                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Data Tables */}
                <div className="p-4 overflow-x-auto">
                    {activeTab === "stock" ? (
                        filteredStock.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Info className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                                No se encontraron insumos en depósito.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">Insumo / Material</th>
                                        <th className="py-3 px-4">Familia / Categoría</th>
                                        <th className="py-3 px-4">Descripción</th>
                                        <th className="py-3 px-4 text-center">Stock Disp.</th>
                                        <th className="py-3 px-4">Lotes y Números de Serie en Depósito</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-sm">
                                    {filteredStock.map(supply => {
                                        const totalStock = supply.batches.reduce((acc, b) => acc + b.available_quantity, 0)
                                        return (
                                            <tr key={supply.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-4 font-bold text-white">{supply.name}</td>
                                                <td className="py-3 px-4">
                                                    <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2 py-1 rounded">
                                                        {supply.family || "Sin Categoría"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={supply.description}>
                                                    {supply.description || "-"}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`font-bold px-2 py-1 rounded text-xs ${
                                                        totalStock > 0 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                                                    }`}>
                                                        {totalStock} uds
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-2 max-w-lg">
                                                        {supply.batches.length === 0 ? (
                                                            <span className="text-xs text-slate-600">Sin lotes ingresados</span>
                                                        ) : (
                                                            supply.batches.map(batch => (
                                                                <div key={batch.id} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col gap-1 text-xs">
                                                                    <div className="flex justify-between items-center text-slate-400">
                                                                        <span>Lote: <strong className="text-slate-200">{batch.batch_number || "S/D"}</strong></span>
                                                                        <span>Ingreso: <strong className="text-slate-300">{new Date(batch.entry_date).toLocaleDateString("es-AR")}</strong></span>
                                                                        <span className="text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">{batch.available_quantity} disp.</span>
                                                                    </div>
                                                                    {batch.serial_numbers && batch.serial_numbers.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            <span className="text-slate-500 self-center">Series:</span>
                                                                            {batch.serial_numbers.map(s => (
                                                                                <span key={s} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded text-[10px]">
                                                                                    {s}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    ) : (
                        filteredUsed.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Info className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                                No se registraron consumos o instalaciones de material con los filtros seleccionados.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">Material</th>
                                        <th className="py-3 px-4">Familia</th>
                                        <th className="py-3 px-4">Lote / Serie</th>
                                        <th className="py-3 px-4">Unidad Destino (Blindado)</th>
                                        <th className="py-3 px-4 text-center">Cant. Usada</th>
                                        <th className="py-3 px-4">Instalado Por</th>
                                        <th className="py-3 px-4">Fecha Instalación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 text-sm">
                                    {filteredUsed.map(consumption => {
                                        const vehicle = consumption.vehicleActivity?.vehicle
                                        const activity = consumption.vehicleActivity?.activity
                                        const supply = consumption.supplyBatch?.supply
                                        
                                        return (
                                            <tr key={consumption.id} className="hover:bg-slate-800/30 transition-colors animate-fade-in">
                                                <td className="py-3 px-4 font-bold text-white">
                                                    {supply?.name || "Insumo Eliminado"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2 py-1 rounded">
                                                        {supply?.family || "Sin Categoría"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col text-xs gap-0.5">
                                                        <span>Lote: <strong className="text-slate-300">{consumption.supplyBatch?.batch_number || "S/D"}</strong></span>
                                                        {consumption.serial_number && (
                                                            <span>S/N: <strong className="text-blue-400 bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20">{consumption.serial_number}</strong></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {vehicle ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-blue-400">NI: {vehicle.ni}</span>
                                                            <span className="text-slate-400 text-xs flex items-center gap-1">
                                                                <Truck className="h-3 w-3 text-slate-500" />
                                                                {vehicle.origen_unit}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-red-400 text-xs">Vehículo no encontrado</span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-center font-bold text-white">
                                                    {consumption.quantity_used}
                                                </td>
                                                <td className="py-3 px-4 text-slate-300 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-slate-500" />
                                                        {getOperatorName(consumption.operator_id)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                        {formatDate(consumption.timestamp)}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}
