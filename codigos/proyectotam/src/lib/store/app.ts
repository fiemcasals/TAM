import { create } from 'zustand'
import type { Vehicle, Supply, SupplyBatch, Activity, ChecklistItem, VehicleActivity, VehicleChecklistItem, ActivityMaterialConsumption, AuditLog, ActivityStatus, VehicleStatus } from '@/types'
import { getVehicles, addVehicle, updateVehicleStatus, updateVehicle as updateVehicleAction, getCatalogData, toggleChecklistItemAction, updateActivityStatusAction, initVehicleActivitiesAction } from '@/lib/actions/plantaActions'
import { getSupplies, addSupplyAction, updateSupplyAction, deleteSupplyAction, addBatchAction, updateBatchAction, deleteBatchAction, consumeMaterialAction, restoreMaterialAction, updateConsumptionAction } from '@/lib/actions/supplyActions'

interface AppState {
    vehicles: Vehicle[]
    supplies: Supply[]
    supplyBatches: SupplyBatch[]

    // Planta & Traceability State
    activities: Activity[]
    checklistItems: ChecklistItem[]
    vehicleActivities: VehicleActivity[]
    vehicleChecklistItems: VehicleChecklistItem[]
    activityMaterialConsumptions: ActivityMaterialConsumption[]
    auditLogs: AuditLog[]

    // Initialization (Loads everything from Server)
    fetchData: () => Promise<void>
    fetchVehicleDetails: (id: string) => Promise<void>

    // Vehicle Actions
    addVehicle: (vehicleDTO: Omit<Vehicle, 'id' | 'entry_date'>) => Promise<void>
    updateVehicleStatus: (id: string, status: string) => Promise<void>
    updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>
    assignOperatorsToVehicle: (id: string, operatorIds: string[]) => Promise<void>

    // Stock Actions
    addSupply: (name: string, description: string, family?: string) => Promise<string | null>
    updateSupply: (id: string, data: Partial<Supply>) => Promise<void>
    deleteSupply: (id: string) => Promise<void>

    addBatch: (supplyId: string, batchNumber?: string, serialNumbers?: string[], quantity?: number) => Promise<void>
    updateBatch: (id: string, data: Partial<SupplyBatch>) => Promise<void>
    deleteBatch: (id: string) => Promise<void>

    // Planta Actions
    initVehicleActivities: (vehicleId: string) => Promise<void>
    toggleChecklistItem: (vehicleId: string, activityId: string, checklistId: string, operatorId: string, actionType: 'start' | 'complete' | 'reset') => Promise<void>
    consumeMaterialForActivity: (vehicleActivityId: string, batchId: string, quantity: number, operatorId: string, serialNumber?: string) => Promise<boolean>
    removeMaterialConsumption: (consumptionId: string, userId: string) => Promise<void>
    updateMaterialConsumption: (consumptionId: string, newQuantity: number) => Promise<{ success: boolean; message?: string }>
    updateActivityStatus: (vehicleActivityId: string, status: ActivityStatus, userId: string, reason?: string) => Promise<void>
}

export const useAppStore = create<AppState>()((set, get) => ({
    vehicles: [],
    supplies: [],
    supplyBatches: [],
    activities: [],
    checklistItems: [],
    vehicleActivities: [],
    vehicleChecklistItems: [],
    activityMaterialConsumptions: [],
    auditLogs: [],

    fetchData: async () => {
        const [vRes, sRes, cRes] = await Promise.all([
            getVehicles(),
            getSupplies(),
            getCatalogData()
        ])
        
        set({ 
            vehicles: (vRes.vehicles as unknown) as Vehicle[] || [],
            vehicleActivities: (vRes.vehicleActivities as unknown) as VehicleActivity[] || [],
            vehicleChecklistItems: (vRes.vehicleChecklistItems as unknown) as VehicleChecklistItem[] || [],
            supplies: (sRes.data?.supplies as unknown) as Supply[] || [],
            supplyBatches: (sRes.data?.supplyBatches as unknown) as SupplyBatch[] || [],
            activities: (cRes.data?.activities as unknown) as Activity[] || [],
            checklistItems: cRes.data?.checklistItems as ChecklistItem[] || []
        })
    },

    fetchVehicleDetails: async (id: string) => {
        // Need to import dynamically inside if needed, or import getVehicleDetails at top
        const { getVehicleDetails } = await import('@/lib/actions/plantaActions')
        const res = await getVehicleDetails(id)
        if (res.success && res.data) {
            set((state) => ({
                vehicleActivities: [...state.vehicleActivities.filter(v => v.vehicle_id !== id), ...((res.data.vehicleActivities as unknown) as VehicleActivity[])],
                vehicleChecklistItems: (res.data.vehicleChecklistItems as unknown) as VehicleChecklistItem[], // Simplified, should merge carefully but sufficient for detailed view
                activityMaterialConsumptions: (res.data.activityMaterialConsumptions as unknown) as ActivityMaterialConsumption[]
            }))
        }
    },

    addVehicle: async (vehicleDTO) => {
        const res = await addVehicle(vehicleDTO)
        if (res.success) {
            await get().fetchData()
        }
    },

    updateVehicleStatus: async (id, status) => {
        await updateVehicleStatus(id, status)
        await get().fetchData()
    },

    updateVehicle: async (id, data) => {
        const existing = get().vehicles.find(v => v.id === id)
        if (!existing) return
        await updateVehicleAction(id, {
            ni: data.ni ?? existing.ni,
            origen_unit: data.origen_unit ?? existing.origen_unit,
            status: data.status ?? existing.status,
            assigned_operators: data.assigned_operators ?? existing.assigned_operators,
            army_status: data.army_status ?? existing.army_status,
            observations: data.observations ?? existing.observations
        })
        await get().fetchData()
    },

    assignOperatorsToVehicle: async (id, operatorIds) => {
        const existing = get().vehicles.find(v => v.id === id)
        if (!existing) return
        await updateVehicleAction(id, {
            ni: existing.ni,
            origen_unit: existing.origen_unit,
            status: existing.status,
            assigned_operators: operatorIds
        })
        await get().fetchData()
    },

    addSupply: async (name, description, family) => {
        const res = await addSupplyAction(name, description, family)
        if (res.success && res.supply) {
            await get().fetchData()
            return res.supply.id
        }
        return null
    },

    updateSupply: async (id, data) => {
        await updateSupplyAction(id, data.name || '', data.family || '', data.description || '')
        await get().fetchData()
    },

    deleteSupply: async (id) => {
        await deleteSupplyAction(id)
        await get().fetchData()
    },

    addBatch: async (supplyId, batchNumber, serialNumbers, quantity) => {
        await addBatchAction(supplyId, batchNumber, serialNumbers, quantity)
        await get().fetchData()
    },

    updateBatch: async (id, data) => {
        await updateBatchAction(id, data.batch_number, data.serial_numbers, data.available_quantity)
        await get().fetchData()
    },

    deleteBatch: async (id) => {
        await deleteBatchAction(id)
        await get().fetchData()
    },

    initVehicleActivities: async (vehicleId) => {
        await initVehicleActivitiesAction(vehicleId)
        await get().fetchVehicleDetails(vehicleId)
    },

    toggleChecklistItem: async (vehicleId, activityId, checklistId, operatorId, actionType) => {
        const { vehicleActivities } = get()
        const vActivity = vehicleActivities.find(va => va.vehicle_id === vehicleId && va.activity_id === activityId)
        if (!vActivity) return
        
        // Optimistic UI could be added here, but for simplicity we rely on refetch
        await toggleChecklistItemAction(vActivity.id, checklistId, operatorId, actionType)
        await get().fetchVehicleDetails(vehicleId)
    },

    consumeMaterialForActivity: async (vehicleActivityId, batchId, quantity, operatorId, serialNumber) => {
        const res = await consumeMaterialAction(vehicleActivityId, batchId, quantity, operatorId, serialNumber)
        if (res.success) {
            // Need to fetch both inventory and tank details
            await get().fetchData()
            
            // To get the vehicle ID we look in our store
            const vAct = get().vehicleActivities.find(va => va.id === vehicleActivityId)
            if (vAct) await get().fetchVehicleDetails(vAct.vehicle_id)
            return true
        }
        return false
    },

    removeMaterialConsumption: async (consumptionId, userId) => {
        const res = await restoreMaterialAction(consumptionId)
        if (res.success) {
            await get().fetchData()
            // Assume we're on the tank page, just refetch all tank details by not knowing exactly which one
            // We can optimize this later
            const consumptions = get().activityMaterialConsumptions.find(c => c.id === consumptionId)
            if (consumptions) {
                 const vAct = get().vehicleActivities.find(va => va.id === consumptions.vehicle_activity_id)
                 if (vAct) await get().fetchVehicleDetails(vAct.vehicle_id)
            }
        }
    },

    updateMaterialConsumption: async (consumptionId, newQuantity) => {
        const res = await updateConsumptionAction(consumptionId, newQuantity)
        if (res.success) {
            await get().fetchData()
            const consumption = get().activityMaterialConsumptions.find(c => c.id === consumptionId)
            if (consumption) {
                 const vAct = get().vehicleActivities.find(va => va.id === consumption.vehicle_activity_id)
                 if (vAct) await get().fetchVehicleDetails(vAct.vehicle_id)
            }
            return { success: true }
        }
        return { success: false, message: res.message || "Error al actualizar la cantidad." }
    },

    updateActivityStatus: async (vehicleActivityId, status, userId, reason) => {
        await updateActivityStatusAction(vehicleActivityId, status, userId, reason)
        const vAct = get().vehicleActivities.find(va => va.id === vehicleActivityId)
        if (vAct) await get().fetchVehicleDetails(vAct.vehicle_id)
    }
}))
