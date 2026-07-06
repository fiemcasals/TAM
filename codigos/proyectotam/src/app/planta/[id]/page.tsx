"use client"

import { use, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/lib/store/app"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Clock, Box, Plus, Trash2, Maximize2, Minimize2, Pencil, Users, MessageSquareText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ObservationsModal } from "@/components/vehicles/ObservationsModal"
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
        updateActivityStatus,
        assignOperatorsToVehicle,
        addActivityParticipant,
        addChecklistItemParticipant,
        updateVehicle
    } = useAppStore()

    const currentUser = useAuthStore(state => state.currentUser)
    const users = useAuthStore(state => state.users)
    const fetchUsers = useAuthStore(state => state.fetchUsers)

    const getOperatorName = (operatorId?: string) => {
        if (!operatorId) return "Operario Desconocido"
        const user = users.find(u => u.id === operatorId)
        if (!user) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operatorId)
            return isUuid ? `Operario #${operatorId.substring(0, 4)}` : operatorId
        }
        return `${user.name} ${user.lastName || ""}`.trim()
    }

    const formatDuration = (start?: string | Date | null, end?: string | Date | null) => {
        if (!start) return "N/A"
        const startTime = new Date(start).getTime()
        const endTime = end ? new Date(end).getTime() : Date.now()
        const diffMs = endTime - startTime
        if (diffMs < 0) return "0 min"

        const diffMins = Math.floor(diffMs / (1000 * 60))
        if (diffMins < 60) return `${diffMins} min`

        const diffHours = Math.floor(diffMins / 60)
        const remainingMins = diffMins % 60
        if (diffHours < 24) {
            return `${diffHours}h ${remainingMins}m`
        }

        const diffDays = Math.floor(diffHours / 24)
        const remainingHours = diffHours % 24
        return `${diffDays}d ${remainingHours}h ${remainingMins}m`
    }

    // Discriminates participants by where they actually worked: each checklist task,
    // material consumption, or manually added at the activity/etapa level (not tied to a task).
    const getParticipantsBreakdownForActivity = (vActId: string) => {
        const groups: { label: string, names: string[] }[] = []

        const checks = checklistItems.filter(c => vehicleChecklistItems.some(vci => vci.vehicle_activity_id === vActId && vci.checklist_id === c.id))
        checks.forEach(check => {
            const vciLog = vehicleChecklistItems.find(vci => vci.vehicle_activity_id === vActId && vci.checklist_id === check.id)
            const names = new Set<string>()
            if (vciLog?.operator_id) names.add(getOperatorName(vciLog.operator_id))
            vciLog?.additional_operators?.forEach(operatorId => names.add(getOperatorName(operatorId)))
            if (names.size > 0) groups.push({ label: check.description, names: Array.from(names) })
        })

        const consumptionNames = new Set<string>()
        activityMaterialConsumptions.filter(c => c.vehicle_activity_id === vActId).forEach(c => {
            if (c.operator_id) consumptionNames.add(getOperatorName(c.operator_id))
        })
        if (consumptionNames.size > 0) groups.push({ label: "Consumo de materiales", names: Array.from(consumptionNames) })

        const vAct = vehicleActivities.find(va => va.id === vActId)
        const generalNames = new Set<string>()
        vAct?.additional_operators?.forEach(operatorId => generalNames.add(getOperatorName(operatorId)))
        if (generalNames.size > 0) groups.push({ label: "General de la etapa", names: Array.from(generalNames) })

        return groups
    }

    // UI State
    const [expandedActivity, setExpandedActivity] = useState<string | null>(null)
    const [isConsumeModalOpen, setIsConsumeModalOpen] = useState(false)
    const [selectedVehicleActivityId, setSelectedVehicleActivityId] = useState<string | null>(null)
    const [isObservationsModalOpen, setIsObservationsModalOpen] = useState(false)

    // Modal specific state
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
    const [selectedSerialNumber, setSelectedSerialNumber] = useState<string>("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isModalExpanded, setIsModalExpanded] = useState(false)
    // Assign Operators state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedOperators, setSelectedOperators] = useState<string[]>([])

    // Add participant to activity state
    const [addingParticipantFor, setAddingParticipantFor] = useState<string | null>(null)
    const [newParticipantId, setNewParticipantId] = useState("")

    // Add participant to a single checklist task state
    const [addingTaskParticipantFor, setAddingTaskParticipantFor] = useState<string | null>(null)
    const [newTaskParticipantId, setNewTaskParticipantId] = useState("")

    // Inline editing consumption state
    const [editingConsumptionId, setEditingConsumptionId] = useState<string | null>(null)
    const [editingQuantity, setEditingQuantity] = useState<number>(0)

    // Live ticking clock, used to show running task counters in real time
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

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

    // Initialize selected operators state once vehicle is loaded
    useEffect(() => {
        if (vehicle && selectedOperators.length === 0 && !isAssignModalOpen) {
            setSelectedOperators(vehicle.assigned_operators || [])
        }
    }, [vehicle, isAssignModalOpen, selectedOperators.length])

    if (!vehicle) {
        return <div className="p-8 text-center text-slate-500">Vehículo no encontrado</div>
    }

    const getActivityDetails = (actId: string) => activities.find(a => a.id === actId)!
    const getChecklistsForActivity = (actId: string) => checklistItems.filter(c => c.activity_id === actId)

    const handleToggleChecklist = (vActId: string, actId: string, checkId: string, actionType: 'start' | 'pause' | 'resume' | 'complete' | 'reset') => {
        if (!currentUser) return
        toggleChecklistItem(id, actId, checkId, currentUser.name, actionType)
    }

    const handleAddParticipant = async (vehicleActivityId: string) => {
        if (!newParticipantId) return
        await addActivityParticipant(vehicleActivityId, newParticipantId)
        setAddingParticipantFor(null)
        setNewParticipantId("")
    }

    const getChecklistItemParticipants = (vci?: { operator_id?: string, additional_operators?: string[] }) => {
        if (!vci) return []
        const names = new Set<string>()
        if (vci.operator_id) names.add(getOperatorName(vci.operator_id))
        vci.additional_operators?.forEach(operatorId => names.add(getOperatorName(operatorId)))
        return Array.from(names)
    }

    const handleAddTaskParticipant = async (vehicleChecklistItemId: string) => {
        if (!newTaskParticipantId) return
        await addChecklistItemParticipant(vehicleChecklistItemId, newTaskParticipantId)
        setAddingTaskParticipantFor(null)
        setNewTaskParticipantId("")
    }

    const formatElapsed = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const getChecklistStatusLabel = (vci?: { status: string }) => {
        if (!vci || vci.status === 'pending') return 'Sin iniciar'
        if (vci.status === 'completed') return 'Terminada'
        return 'En proceso'
    }

    const getChecklistElapsedSeconds = (vci?: { status: string, accumulated_seconds: number, running_since?: string }) => {
        if (!vci) return 0
        if (vci.status === 'in_progress' && vci.running_since) {
            const running = Math.max(0, Math.floor((now - new Date(vci.running_since).getTime()) / 1000))
            return vci.accumulated_seconds + running
        }
        return vci.accumulated_seconds
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

    const handleSendToService = async () => {
        if (!confirm("¿Confirma que el tanque terminó la línea de modernización y pasa a Servicio?")) return
        await updateVehicle(id, { status: 'in_service' })
        router.push('/servicio')
    }

    const canManageObservations = currentUser?.role === 'supervisor' || currentUser?.role === 'project_manager'

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
                    <button
                        type="button"
                        onClick={() => setIsObservationsModalOpen(true)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 mt-1.5"
                    >
                        <MessageSquareText className="h-4 w-4" /> Observaciones
                    </button>
                </div>
                <div className="text-right flex flex-col items-end gap-3 w-48">
                    <div className="w-full">
                        <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                            <span>Progreso Total</span>
                            <span>{calculateProgress()}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${calculateProgress()}%` }} />
                        </div>
                    </div>
                    {isSupervisor && (
                        <Button size="sm" variant="outline" className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => {
                            setSelectedOperators(vehicle.assigned_operators || [])
                            setIsAssignModalOpen(true)
                        }}>
                            <Users className="h-4 w-4 mr-2" />
                            Asignar Operarios
                        </Button>
                    )}
                    {isSupervisor && vehicle.status === 'in_plant' && (
                        <Button
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400"
                            disabled={calculateProgress() !== 100}
                            title={calculateProgress() !== 100 ? 'Se habilita al llegar al 100% de las actividades' : 'Pasar el tanque a Servicio'}
                            onClick={handleSendToService}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Pasar a Servicio
                        </Button>
                    )}
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
                                    <div className="flex flex-col items-end mr-4">
                                        {vAct.started_at && (
                                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                Inicio: {new Date(vAct.started_at).toLocaleDateString()} {new Date(vAct.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                        {vAct.completed_at && (
                                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                Fin: {new Date(vAct.completed_at).toLocaleDateString()} {new Date(vAct.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                        {vAct.started_at && vAct.completed_at && (
                                            <span className="text-xs font-bold text-blue-600">
                                                {Math.round((new Date(vAct.completed_at).getTime() - new Date(vAct.started_at).getTime()) / (1000 * 60 * 60))}h {Math.round(((new Date(vAct.completed_at).getTime() - new Date(vAct.started_at).getTime()) / (1000 * 60)) % 60)}m
                                            </span>
                                        )}
                                    </div>
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
                                                <>
                                                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => {
                                                        const reason = window.prompt("Motivo del rechazo de la etapa:")
                                                        if (reason) {
                                                            updateActivityStatus(vAct.id, 'in_progress', currentUser!.name, reason)
                                                        } else if (reason !== null) {
                                                            alert("Debe ingresar un motivo para rechazar.")
                                                        }
                                                    }}>
                                                        Rechazar Etapa
                                                    </Button>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-medium" onClick={() => updateActivityStatus(vAct.id, 'completed', currentUser!.name)}>
                                                        Aprobar Etapa
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                        {/* Left Side: Tasks and Materials (2 columns) */}
                                        <div className="md:col-span-2 space-y-6">
                                            {vAct.rejection_reason && vAct.status === 'in_progress' && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                                    <strong>Etapa Rechazada:</strong> {vAct.rejection_reason}
                                                </div>
                                            )}
                                            {/* Checklist Items */}
                                            <div className="space-y-3">
                                                <div className="text-sm font-semibold text-slate-700 mb-1">Tareas del Checklist</div>
                                                {checks.map(check => {
                                                    const vciLog = vehicleChecklistItems.find(vci => vci.checklist_id === check.id && vci.vehicle_activity_id === vAct.id)
                                                    const isChecked = !!vciLog?.is_completed
                                                    const isDisabled = !isOperator || vAct.status === 'completed' || vAct.status === 'pending_review'
                                                    const elapsedSeconds = getChecklistElapsedSeconds(vciLog)

                                                    return (
                                                        <div key={check.id} className="flex flex-col gap-2 p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-slate-100">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <p className={`text-base font-semibold ${isChecked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                                                    {check.description}
                                                                </p>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    {!isWorkMode ? (
                                                                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                                            vciLog?.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                            vciLog ? 'bg-amber-100 text-amber-800' :
                                                                            'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                            {getChecklistStatusLabel(vciLog)}
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            {(!vciLog || vciLog.status === 'in_progress') && (
                                                                                <span className={`font-mono text-xs px-2 py-1 rounded ${vciLog?.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'text-slate-300'}`}>
                                                                                    {formatElapsed(elapsedSeconds)}
                                                                                </span>
                                                                            )}
                                                                            {vciLog?.status === 'paused' && (
                                                                                <span className="font-mono text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">
                                                                                    {formatElapsed(elapsedSeconds)} (en pausa)
                                                                                </span>
                                                                            )}
                                                                            {!vciLog && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    disabled={isDisabled}
                                                                                    onClick={() => {
                                                                                        if (vAct.status === 'pending') updateActivityStatus(vAct.id, 'in_progress', currentUser!.name)
                                                                                        handleToggleChecklist(vAct.id, activity.id, check.id, 'start')
                                                                                    }}
                                                                                >
                                                                                    Iniciar
                                                                                </Button>
                                                                            )}
                                                                            {vciLog?.status === 'in_progress' && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                                                                                    disabled={isDisabled}
                                                                                    onClick={() => handleToggleChecklist(vAct.id, activity.id, check.id, 'pause')}
                                                                                >
                                                                                    Detener
                                                                                </Button>
                                                                            )}
                                                                            {vciLog?.status === 'paused' && (
                                                                                <>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                                                        disabled={isDisabled}
                                                                                        onClick={() => handleToggleChecklist(vAct.id, activity.id, check.id, 'resume')}
                                                                                    >
                                                                                        Retomar
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                                                        disabled={isDisabled}
                                                                                        onClick={() => handleToggleChecklist(vAct.id, activity.id, check.id, 'complete')}
                                                                                    >
                                                                                        Finalizar
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {vciLog?.status === 'completed' && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                                    disabled={isDisabled}
                                                                                    onClick={() => handleToggleChecklist(vAct.id, activity.id, check.id, 'reset')}
                                                                                >
                                                                                    Deshacer
                                                                                </Button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {vciLog && (
                                                                <div className="flex flex-col gap-1 text-xs text-slate-500 bg-slate-50 p-2 rounded mt-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        Inicio: {new Date(vciLog.started_at!).toLocaleString()} por <span className="font-bold text-slate-700">{getOperatorName(vciLog.operator_id)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        Tiempo activo: <span className="font-semibold text-slate-700">{formatElapsed(elapsedSeconds)}</span>
                                                                    </div>
                                                                    {vciLog.is_completed && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                            Fin: {new Date(vciLog.completed_at!).toLocaleString()}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-slate-200/70">
                                                                        <div className="flex flex-wrap items-center gap-1">
                                                                            <Users className="h-3 w-3 text-slate-400" />
                                                                            {getChecklistItemParticipants(vciLog).map(name => (
                                                                                <Badge key={name} variant="secondary" className="bg-slate-200/80 text-slate-700 font-medium px-1.5 py-0 text-[11px]">
                                                                                    {name}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                        {isWorkMode && addingTaskParticipantFor !== vciLog.id && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => { setAddingTaskParticipantFor(vciLog.id); setNewTaskParticipantId("") }}
                                                                                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 shrink-0"
                                                                                title="Agregar operario a esta tarea"
                                                                            >
                                                                                <Plus className="h-3 w-3" /> Agregar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {addingTaskParticipantFor === vciLog.id && (
                                                                        <div className="flex items-center gap-1.5 mt-1">
                                                                            <select
                                                                                className="text-xs border border-slate-200 rounded px-2 py-1 flex-1 bg-white"
                                                                                value={newTaskParticipantId}
                                                                                onChange={(e) => setNewTaskParticipantId(e.target.value)}
                                                                            >
                                                                                <option value="">Seleccionar operario...</option>
                                                                                {users.map(u => (
                                                                                    <option key={u.id} value={u.id}>{u.name} {u.lastName || ""}</option>
                                                                                ))}
                                                                            </select>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleAddTaskParticipant(vciLog.id)}
                                                                                disabled={!newTaskParticipantId}
                                                                                className="text-green-700 hover:text-green-900 text-xs font-bold px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                                                            >
                                                                                OK
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setAddingTaskParticipantFor(null)}
                                                                                className="text-slate-400 hover:text-slate-700 text-xs px-1"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
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
                                                    <div className="text-sm font-semibold text-slate-700 mb-2">Insumos Utilizados en Actividad</div>
                                                    {activityMaterialConsumptions.filter(c => c.vehicle_activity_id === vAct.id).map(cons => {
                                                        const batch = supplyBatches.find(b => b.id === cons.supply_batch_id)
                                                        const supply = supplies.find(s => s.id === batch?.supply_id)
                                                        return (
                                                            <div key={cons.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg text-sm border border-slate-150">
                                                                <div className="flex flex-col flex-1">
                                                                    <span className="font-bold text-slate-800 text-base">{supply?.name || 'Insumo'} <span className="text-slate-500 text-xs font-normal">({supply?.family})</span></span>
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
                                                                        <span className="text-xs text-slate-500 font-medium">
                                                                            Cantidad: {cons.quantity_used} | Lote: {batch?.batch_number || 'N/A'} {cons.serial_number ? `| S/N: ${cons.serial_number}` : ''}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs text-slate-400 mt-0.5">Por <strong className="text-slate-600">{getOperatorName(cons.operator_id)}</strong> el {new Date(cons.timestamp).toLocaleString()}</span>
                                                                </div>
                                                                {isOperator && vAct.status !== 'completed' && vAct.status !== 'pending_review' && (
                                                                    <div className="flex items-center gap-1">
                                                                        {!cons.serial_number && editingConsumptionId !== cons.id && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-10 w-10"
                                                                                onClick={() => {
                                                                                    setEditingConsumptionId(cons.id);
                                                                                    setEditingQuantity(cons.quantity_used);
                                                                                }}
                                                                                title="Editar cantidad"
                                                                            >
                                                                                <Pencil className="h-5 w-5" />
                                                                            </Button>
                                                                        )}
                                                                        {editingConsumptionId !== cons.id && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10"
                                                                                onClick={async () => {
                                                                                    if (confirm('¿Desea eliminar este consumo y devolver el stock al depósito?')) {
                                                                                        await removeMaterialConsumption(cons.id, currentUser!.name)
                                                                                        alert(`El consumo del material "${supply?.name || 'Insumo'}" ha sido eliminado y el stock devuelto al depósito.`)
                                                                                    }
                                                                                }}
                                                                                title="Eliminar insumo"
                                                                            >
                                                                                <Trash2 className="h-5 w-5" />
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

                                        {/* Right Side: Trazabilidad, Tiempos y Participantes */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 h-fit text-sm">
                                            <div className="font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-amber-600" />
                                                Tiempos e Historial
                                            </div>
                                            <div className="space-y-2.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Inicio:</span>
                                                    <span className="font-medium text-slate-800 text-right">
                                                        {vAct.started_at ? new Date(vAct.started_at).toLocaleString() : "No iniciada"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Fin Trabajos:</span>
                                                    <span className="font-medium text-slate-800 text-right">
                                                        {vAct.completed_at ? new Date(vAct.completed_at).toLocaleString() : (vAct.started_at ? "En progreso" : "—")}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Aprobación:</span>
                                                    <span className="font-medium text-slate-800 text-right">
                                                        {vAct.verified_at ? new Date(vAct.verified_at).toLocaleString() : (vAct.completed_at ? "Esperando aprobación" : "—")}
                                                    </span>
                                                </div>

                                                {vAct.started_at && (
                                                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-500">Duración Trabajo:</span>
                                                            <span className="font-bold text-slate-800">
                                                                {formatDuration(vAct.started_at, vAct.completed_at)}
                                                            </span>
                                                        </div>
                                                        {vAct.completed_at && vAct.verified_at && (
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-slate-500">Espera Aprobación:</span>
                                                                <span className="font-bold text-amber-700">
                                                                    {formatDuration(vAct.completed_at, vAct.verified_at)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="font-bold text-slate-800 border-b border-slate-200 pb-2 pt-2 flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                Participantes
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-slate-400">OPERARIOS INVOLUCRADOS</span>
                                                        {isWorkMode && addingParticipantFor !== vAct.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => { setAddingParticipantFor(vAct.id); setNewParticipantId("") }}
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-0.5"
                                                                title="Agregar operario general de la etapa (no ligado a una tarea puntual)"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" /> Agregar
                                                            </button>
                                                        )}
                                                    </div>
                                                    {addingParticipantFor === vAct.id && (
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <select
                                                                className="text-xs border border-slate-200 rounded px-2 py-1 flex-1 bg-white"
                                                                value={newParticipantId}
                                                                onChange={(e) => setNewParticipantId(e.target.value)}
                                                            >
                                                                <option value="">Seleccionar operario...</option>
                                                                {users.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name} {u.lastName || ""}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddParticipant(vAct.id)}
                                                                disabled={!newParticipantId}
                                                                className="text-green-700 hover:text-green-900 text-xs font-bold px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingParticipantFor(null)}
                                                                className="text-slate-400 hover:text-slate-700 text-xs px-1"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}
                                                    {getParticipantsBreakdownForActivity(vAct.id).length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {getParticipantsBreakdownForActivity(vAct.id).map(group => (
                                                                <div key={group.label} className="text-xs">
                                                                    <span className="text-slate-500">{group.label}:</span>{' '}
                                                                    <span className="inline-flex flex-wrap gap-1 align-middle">
                                                                        {group.names.map(name => (
                                                                            <Badge key={name} variant="secondary" className="bg-slate-200/80 hover:bg-slate-200 text-slate-800 font-medium px-1.5 py-0 text-[11px]">
                                                                                {name}
                                                                            </Badge>
                                                                        ))}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">Ningún operario registrado</span>
                                                    )}
                                                </div>

                                                {vAct.supervisor_id && (
                                                    <div className="pt-1.5 border-t border-slate-100">
                                                        <span className="text-xs font-semibold text-slate-400 block mb-1">SUPERVISOR DE ETAPA</span>
                                                        <Badge className="bg-green-50 text-green-700 border border-green-200 font-medium px-2 py-0.5 text-xs">
                                                            {vAct.supervisor_id}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
            {/* Assign Operators Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-slate-900">Asignar Operarios al Tanque</h2>
                        </div>
                        
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-2">Seleccione los operarios que podrán ver y trabajar en este tanque.</p>
                            <div className="space-y-2">
                                {users.filter(u => u.role === 'operator').map(op => (
                                    <label key={op.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input 
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 rounded border-slate-300"
                                            checked={selectedOperators.includes(op.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedOperators([...selectedOperators, op.id])
                                                } else {
                                                    setSelectedOperators(selectedOperators.filter(id => id !== op.id))
                                                }
                                            }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{op.name} {op.lastName || ''}</p>
                                            <p className="text-xs text-slate-500">{op.email}</p>
                                        </div>
                                    </label>
                                ))}
                                {users.filter(u => u.role === 'operator').length === 0 && (
                                    <p className="text-sm text-slate-500 text-center italic py-4">No hay operarios registrados en el sistema.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
                            <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                                await assignOperatorsToVehicle(vehicle.id, selectedOperators)
                                setIsAssignModalOpen(false)
                                alert("Operarios asignados correctamente.")
                            }}>Guardar Asignación</Button>
                        </div>
                    </div>
                </div>
            )}

            {isObservationsModalOpen && (
                <ObservationsModal
                    vehicleId={vehicle.id}
                    vehicleNi={vehicle.ni}
                    authorName={currentUser?.name || "Desconocido"}
                    canAdd={canManageObservations}
                    onClose={() => setIsObservationsModalOpen(false)}
                />
            )}

        </div>
    )
}
