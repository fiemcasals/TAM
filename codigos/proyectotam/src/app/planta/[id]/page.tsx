"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/lib/store/app"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Clock, Box, Plus, Trash2, Maximize2, Minimize2, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Activity } from "@/types"

export default function TankDetailView({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isWorkMode = searchParams.get('mode') === 'work'

    const resolvedParams = use(params)
    const { id } = resolvedParams

    const {
        vehicles,
        activities,
        checklistItems,
        vehicleActivities,
        vehicleChecklistItems,
        activityMaterialConsumptions,
        supplies,
        supplyBatches,
        fetchVehicleDetails,
        initVehicleActivities,
        toggleChecklistItem,
        consumeMaterialForActivity,
        removeMaterialConsumption,
        updateMaterialConsumption,
        updateActivityStatus
    } = useAppStore()

    const currentUser = useAuthStore(state => state.currentUser)
    const users = useAuthStore(state => state.users)
    const fetchUsers = useAuthStore(state => state.fetchUsers)

    const getOperatorName = (operatorId?: string) => {
        if (!operatorId) return "Operario Desconocido"
        const user = users.find(u => u.id === operatorId)
        if (!user) return `Operario #${operatorId.substring(0, 4)}`
        return `${user.name} ${user.lastName || ""}`.trim()
    }

    // UI State
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
    const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false)
    const [selectedVehicleActivityId, setSelectedVehicleActivityId] = useState<string | null>(null)

    // Modal specific state
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
    const [selectedSerialNumber, setSelectedSerialNumber] = useState<string>("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isModalExpanded, setIsModalExpanded] = useState(false)
    
    // Inline editing consumption state
    const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null)
    const [editingQuantity, setEditingQuantity] = useState<number>(0)

    const uniqueActivityIds = new Set<string>()
    const vActivities = vehicleActivities
        .filter(va => va.vehicle_id === id)
        .filter(va => {
            if (uniqueActivityIds.has(va.activity_id)) return false
            uniqueActivityIds.add(va.activity_id)
            return true
        })
        .sort((a, b) => {
            const orderA = activities.find(act => act.id === a.activity_id)?.suggested_order || 0
            const orderB = activities.find(act => act.id === b.activity_id)?.suggested_order || 0
            return orderA - orderB
        })

    // Fetch detailed checklists and material consumptions for the vehicle
    useEffect(() => {
        fetchVehicleDetails(id)
        fetchUsers()
    }, [id, fetchVehicleDetails, fetchUsers])

    // Retroactive initialization for tanks created before activities catalog was defined or empty ones
    useEffect(() => {
        if (vActivities.length === 0 && activities.length > 0) {
            initVehicleActivities(id)
        }
    }, [vActivities.length, activities.length, id, initVehicleActivities])

    const vehicle = vehicles.find(v => v.id === id)
    if (!vehicle) {
        return <div className="p-8 text-center text-slate-500">Vehículo no encontrado</div>
    }

    const getActivityDetails = (actId: string) => activities.find(a => a.id === actId)!
    const getChecklistsForActivity = (actId: string) => checklistItems.filter(c => c.activity_id === actId)

    const handleToggleChecklist = (vActId: string, actId: string, checkId: string) => {
        if (!currentUser) return
        toggleChecklistItem(id, actId, checkId, currentUser.name) // Using name as UI identifier for simplicity instead of UUID
    }

    const handleConsumeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedVehicleActivityId || !currentUser || !selectedBatchId) return

        const fd = new FormData(e.currentTarget)
        const qtyToConsume = Number(fd.get("quantity")) || 1

        const targetBatch = supplyBatches.find(b => b.id === selectedBatchId)

        if (!targetBatch || targetBatch.available_quantity < qtyToConsume) {
            alert("No hay cantidad suficiente en stock.")
            return
        }

        if (targetBatch.serial_numbers && targetBatch.serial_numbers.length > 0 && !selectedSerialNumber) {
            alert("Debe seleccionar un número de serie específico para este insumo.")
            return
        }

        const success = await consumeMaterialForActivity(
            selectedVehicleActivityId,
            targetBatch.id,
            targetBatch.serial_numbers && targetBatch.serial_numbers.length > 0 ? 1 : qtyToConsume, // SN means 1 at a time usually
            currentUser.name,
            selectedSerialNumber || undefined
        )

        if (success) {
            alert(`Material consumido exitosamente.`)
            setIsConsumeModalOpen(false)
            setSelectedVehicleActivityId(null)
            setSelectedBatchId(null)
            setSearchQuery("")
            setSelectedSerialNumber("")
            setIsDropdownOpen(false)
            setIsModalExpanded(false)
        }
    }

    const availableBatches = supplyBatches
        .filter(b => b.available_quantity > 0)
        .map(b => {
            const supply = supplies.find(s => s.id === b.supply_id)
            return {
                ...b,
                supplyName: supply?.name || 'Insumo Desconocido',
                supplyFamily: supply?.family || 'Sin Categoría',
            }
        })

    const filteredBatches = availableBatches.filter(b =>
        `${b.supplyFamily} ${b.supplyName} ${b.batch_number || ''} ${b.serial_numbers?.join(' ') || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedBatch = selectedBatchId
        ? (() => {
            const b = supplyBatches.find(bb => bb.id === selectedBatchId)
            if (!b) return null
            const supply = supplies.find(s => s.id === b.supply_id)
            return {
                ...b,
                supplyName: supply?.name || 'Insumo Desconocido',
                supplyFamily: supply?.family || 'Sin Categoría',
            }
        })()
        : null


    const calculateProgress = () => {
        const totalChecklists = checklistItems.length
        if (totalChecklists === 0) return 0

        const completedItems = vehicleChecklistItems.filter(vci => {
            return vActivities.map(va => va.id).includes(vci.vehicle_activity_id) && vci.is_completed
        }).length

        return Math.round((completedItems / totalChecklists) * 100)
    }

    // Role Checks
    const isOperator = (currentUser?.role === 'operator' || currentUser?.role === 'project_manager') && isWorkMode
    const isSupervisor = (currentUser?.role === 'supervisor' || currentUser?.role === 'project_manager') && isWorkMode

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header section with back button and tank info */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/planta')}>
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        Tanque NI {vehicle.ni}
                        <Badge variant="outline" className="text-sm border-blue-200 text-blue-700 bg-blue-50">En Planta</Badge>
                        {isWorkMode ? <Badge className="bg-amber-600">Modo Trabajo Activo</Badge> : <Badge variant="secondary">Modo Lectura</Badge>}
                    </h1>
                    <p className="text-slate-500 mt-1">Unidad de Origen: {vehicle.origen_unit}</p>
                </div>
                <div className="text-right w-48">
                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                        <span>Progreso Total</span>
                        <span>{calculateProgress()}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${calculateProgress()}%` }} />
                    </div>
                </div>
            </div>

            {/* Activities Accordion View */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Box className="h-5 w-5 text-amber-600" /> Actividades (Checklist)
                </h3>

                {vActivities.map(vAct => {
                    const activity = getActivityDetails(vAct.activity_id)
                    const checks = getChecklistsForActivity(vAct.activity_id)
                    const isExpanded = expandedActivity === vAct.id

                    const completedChecks = checks.filter(c =>
                        vehicleChecklistItems.some(vci => vci.checklist_id === c.id && vci.vehicle_activity_id === vAct.id && vci.is_completed)
                    ).length

                    return (
                        <Card key={vAct.id} className="overflow-hidden border-slate-200 shadow-sm">
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-amber-50 border-b border-amber-100' : 'bg-white hover:bg-slate-50'}`}
                                onClick={() => setExpandedActivity(isExpanded ? null : vAct.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${completedChecks === checks.length && checks.length > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">{activity?.name || "Actividad"}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Paso {activity?.suggested_order || 0} • {completedChecks} de {checks.length} tareas completadas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="secondary" className={`
                                        ${vAct.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                                        ${vAct.status === 'pending_review' ? 'bg-blue-100 text-blue-700' : ''}
                                        ${vAct.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : ''}
                                    `}>
                                        {vAct.status === 'pending' && 'Pendiente'}
                                        {vAct.status === 'in_progress' && 'En Progreso'}
                                        {vAct.status === 'pending_review' && 'Esperando Aprobación'}
                                        {vAct.status === 'completed' && 'Verificado'}
                                    </Badge>
                                    {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-4 bg-white space-y-4 animate-in fade-in slide-in-from-top-1">
                                    {/* Action buttons for activity level */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                        <div className="text-sm font-medium text-slate-500">Gestión de la Actividad</div>
                                        <div className="flex gap-2">
                                            {isOperator && vAct.status !== 'completed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setSelectedVehicleActivityId(vAct.id);
                                                        setIsConsumeModalOpen(true);
                                                        setSelectedBatchId(null);
                                                        setSearchQuery("");
                                                        setIsDropdownOpen(false);
                                                        setIsModalExpanded(false);
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Usar Material
                                                </Button>
                                            )}
                                            {isOperator && (vAct.status === 'in_progress' || vAct.status === 'pending') && completedChecks === checks.length && checks.length > 0 && (
                                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-medium" onClick={() => updateActivityStatus(vAct.id, 'pending_review', currentUser!.name)}>
                                                    Solicitar Aprobación
                                                </Button>
                                            )}
                                            {isSupervisor && vAct.status === 'pending_review' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-medium" onClick={() => updateActivityStatus(vAct.id, 'completed', currentUser!.name)}>
                                                    Aprobar Etapa
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Checklist Items */}
                                    <div className="space-y-3">
                                        {checks.map(check => {
                                            const vciLog = vehicleChecklistItems.find(vci => vci.checklist_id === check.id && vci.vehicle_activity_id === vAct.id)
                                            const isChecked = !!vciLog?.is_completed

                                            return (
                                                <div key={check.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={!isOperator || vAct.status === 'completed' || vAct.status === 'pending_review'}
                                                        onChange={() => {
                                                            if (vAct.status === 'pending') updateActivityStatus(vAct.id, 'in_progress', currentUser!.name)
                                                            handleToggleChecklist(vAct.id, activity.id, check.id)
                                                        }}
                                                        className="mt-1 h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-600 disabled:opacity-50 cursor-pointer"
                                                    />
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                            {check.description}
                                                        </p>
                                                        {isChecked && vciLog && (
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                                <Clock className="h-3 w-3" />
                                                                Realizado por <span className="font-semibold">{getOperatorName(vciLog.operator_id)}</span> el {new Date(vciLog.completed_at!).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {checks.length === 0 && (
                                            <p className="text-sm text-slate-500 italic">No hay tareas definidas para esta actividad.</p>
                                        )}
                                    </div>

                                    {/* Material Consumptions Listing */}
                                    {activityMaterialConsumptions.filter(c => c.vehicle_activity_id === vAct.id).length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                            <div className="text-sm font-medium text-slate-500 mb-2">Insumos Utilizados en Actividad</div>
                                            {activityMaterialConsumptions.filter(c => c.vehicle_activity_id === vAct.id).map(cons => {
                                                const batch = supplyBatches.find(b => b.id === cons.supply_batch_id)
                                                const supply = supplies.find(s => s.id === batch?.supply_id)
                                                return (
                                                    <div key={cons.id} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm border border-slate-100">
                                                        <div className="flex flex-col flex-1">
                                                            <span className="font-semibold text-slate-700">{supply?.name || 'Insumo'} <span className="text-slate-500 font-normal">({supply?.family})</span></span>
                                                            {editingConsumptionId === cons.id ? (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-slate-500">Cantidad:</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={editingQuantity}
                                                                        onChange={e => setEditingQuantity(parseInt(e.target.value) || 0)}
                                                                        className="w-20 h-7 text-xs px-2 py-0 bg-white"
                                                                        min={1}
                                                                        max={cons.quantity_used + (batch?.available_quantity || 0)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            if (editingQuantity === cons.quantity_used) {
                                                                                setEditingConsumptionId(null);
                                                                                return;
                                                                            }
                                                                            const res = await updateMaterialConsumption(cons.id, editingQuantity);
                                                                            if (res.success) {
                                                                                setEditingConsumptionId(null);
                                                                            } else {
                                                                                alert(res.message);
                                                                            }
                                                                        }}
                                                                        className="text-green-600 hover:text-green-800 text-xs font-bold px-2 py-1 hover:bg-green-100 rounded transition-colors"
                                                                    >
                                                                        Guardar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingConsumptionId(null)}
                                                                        className="text-slate-500 hover:text-slate-700 text-xs font-bold px-2 py-1 hover:bg-slate-200 rounded transition-colors"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-500">
                                                                    Cantidad: {cons.quantity_used} | Lote: {batch?.batch_number || 'N/A'} {cons.serial_number ? `| S/N: ${cons.serial_number}` : ''}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-slate-400">Por {getOperatorName(cons.operator_id)} el {new Date(cons.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        {isOperator && vAct.status !== 'completed' && vAct.status !== 'pending_review' && (
                                                            <div className="flex items-center gap-1">
                                                                {!cons.serial_number && editingConsumptionId !== cons.id && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                                                                        onClick={() => {
                                                                            setEditingConsumptionId(cons.id);
                                                                            setEditingQuantity(cons.quantity_used);
                                                                        }}
                                                                        title="Editar cantidad"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {editingConsumptionId !== cons.id && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                                        onClick={async () => {
                                                                            if (confirm('¿Desea eliminar este consumo y devolver el stock al depósito?')) {
                                                                                await removeMaterialConsumption(cons.id, currentUser!.name)
                                                                                alert(`El consumo del material "${supply?.name || 'Insumo'}" ha sido eliminado y el stock devuelto al depósito.`)
                                                                            }
                                                                        }}
                                                                        title="Eliminar insumo"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            {/* Consume Material Modal */}
            {isConsumeModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className={`bg-white rounded-xl shadow-2xl w-full border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${isModalExpanded ? 'max-w-4xl h-[80vh]' : 'max-w-md h-auto'}`}>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Registrar Uso de Insumo</h2>
                            <button
                                type="button"
                                onClick={() => setIsModalExpanded(!isModalExpanded)}
                                className="text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                                title={isModalExpanded ? "Reducir ventana" : "Ampliar ventana"}
                            >
                                {isModalExpanded ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        
                        <form onSubmit={handleConsumeSubmit} className="p-6 flex flex-col h-full overflow-hidden space-y-4">
                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100">
                                Busque el insumo que va a consumir. El sistema verificará el stock inmediatamente y descontará la cantidad seleccionada.
                            </div>

                            <div className={`flex-1 ${isModalExpanded ? 'grid grid-cols-2 gap-6 overflow-hidden' : 'space-y-4'}`}>
                                <div className="space-y-4 flex flex-col justify-start">
                                    <div className="space-y-2 relative">
                                        <label className="text-sm font-semibold text-slate-700">Seleccionar Material</label>

                                        {!selectedBatchId ? (
                                             <div className="space-y-2 relative">
                                                 <div className="relative">
                                                     <Input
                                                         placeholder="Buscar por nombre, categoría, lote o N° de serie..."
                                                         value={searchQuery}
                                                         onChange={(e) => {
                                                             setSearchQuery(e.target.value);
                                                             setIsDropdownOpen(true);
                                                         }}
                                                         onFocus={() => setIsDropdownOpen(true)}
                                                         className="pr-10"
                                                         autoFocus
                                                     />
                                                     <button
                                                         type="button"
                                                         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                         className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                     >
                                                         <ChevronDown className="h-5 w-5" />
                                                     </button>
                                                 </div>
                                                 {isDropdownOpen && (
                                                     <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto w-full border border-slate-200 rounded-md bg-white shadow-lg">
                                                         {filteredBatches.length > 0 ? (
                                                             filteredBatches.map(b => (
                                                                 <div
                                                                     key={b.id}
                                                                     className="p-3 border-b border-slate-100 last:border-0 hover:bg-blue-50 cursor-pointer text-sm transition-colors"
                                                                     onClick={() => {
                                                                         setSelectedBatchId(b.id);
                                                                         setIsDropdownOpen(false);
                                                                     }}
                                                                 >
                                                                     <div className="font-semibold text-slate-900">{b.supplyName} <span className="text-slate-500 font-normal">({b.supplyFamily})</span></div>
                                                                     <div className="text-xs text-slate-600 flex justify-between mt-1">
                                                                         <span>Disp: <strong className="text-blue-700">{b.available_quantity} uds</strong></span>
                                                                         <span>{b.batch_number ? `Lote: ${b.batch_number}` : ''} {b.serial_numbers?.length ? `| Varias Series` : ''}</span>
                                                                     </div>
                                                                 </div>
                                                             ))
                                                         ) : (
                                                             <div className="p-4 text-center text-slate-500 text-sm">No se encontraron materiales en stock.</div>
                                                         )}
                                                     </div>
                                                 )}
                                             </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                                                    {selectedBatch && (
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-sm">{selectedBatch.supplyName}</div>
                                                            <div className="text-xs text-slate-600">Stock total: {selectedBatch.available_quantity} | Lote: {selectedBatch.batch_number || 'N/A'}</div>
                                                        </div>
                                                    )}
                                                    <Button variant="ghost" size="sm" type="button" onClick={() => { setSelectedBatchId(null); setSelectedSerialNumber(""); }} className="h-8 text-xs text-slate-500 hover:text-slate-700">Cambiar</Button>
                                                </div>

                                                {/* If it has serial numbers and NOT expanded, show a secondary dropdown to pick exactly which one */}
                                                {!isModalExpanded && selectedBatch?.serial_numbers && selectedBatch.serial_numbers.length > 0 && (
                                                    <div className="space-y-2 pt-2">
                                                        <label className="text-sm font-semibold text-slate-700">Número de Serie Específico</label>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={selectedSerialNumber}
                                                            onChange={e => setSelectedSerialNumber(e.target.value)}
                                                            required
                                                        >
                                                            <option value="" disabled>-- Seleccione el N° de Serie --</option>
                                                            {selectedBatch.serial_numbers.map(sn => (
                                                                <option key={sn} value={sn}>{sn}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-slate-500">Este repuesto está seriado. La cantidad a descontar será 1.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!isModalExpanded && !selectedBatch?.serial_numbers?.length && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Cantidad a utilizar</label>
                                            <Input name="quantity" type="number" min={1} max={selectedBatch ? selectedBatch.available_quantity : 999} defaultValue={1} required disabled={!selectedBatch} />
                                        </div>
                                    )}
                                </div>

                                {isModalExpanded && (
                                    <div className="space-y-4 border-l border-slate-100 pl-6 flex flex-col justify-start">
                                        {!selectedBatchId ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl p-6">
                                                <Box className="h-10 w-10 mb-2 opacity-50 text-slate-300 animate-pulse" />
                                                Seleccione un material del listado izquierdo para configurar el consumo.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Configuración de Consumo</h3>
                                                
                                                {/* If it has serial numbers, show a secondary dropdown to pick exactly which one */}
                                                {selectedBatch?.serial_numbers && selectedBatch.serial_numbers.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-700">Número de Serie Específico</label>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={selectedSerialNumber}
                                                            onChange={e => setSelectedSerialNumber(e.target.value)}
                                                            required
                                                        >
                                                            <option value="" disabled>-- Seleccione el N° de Serie --</option>
                                                            {selectedBatch.serial_numbers.map(sn => (
                                                                <option key={sn} value={sn}>{sn}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-slate-500">Este repuesto está seriado. La cantidad a descontar será 1.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-700">Cantidad a utilizar</label>
                                                        <Input name="quantity" type="number" min={1} max={selectedBatch?.available_quantity || 1} defaultValue={1} required />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <Button type="button" variant="ghost" onClick={() => { setIsConsumeModalOpen(false); setSelectedVehicleActivityId(null); setSelectedBatchId(null); setSelectedSerialNumber(""); setIsDropdownOpen(false); setIsModalExpanded(false); }}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-semibold px-6" disabled={!selectedBatchId || (!!selectedBatch?.serial_numbers?.length && !selectedSerialNumber)}>Consumir</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
