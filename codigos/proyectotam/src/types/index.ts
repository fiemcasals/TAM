export type Role = 'deposit_manager' | 'operator' | 'supervisor' | 'project_manager' | 'admin' | 'ammo_manager'
export type VehicleStatus = 'in_army' | 'in_deposit' | 'in_plant' | 'in_service'
export type ArmyStatus = 'uninspected' | 'selected' | 'discarded'
export type ActivityStatus = 'pending' | 'in_progress' | 'pending_review' | 'completed'

export interface User {
    id: string
    name: string
    lastName?: string
    role: Role
    email: string
    password?: string
    status?: 'active' | 'inactive'
    createdAt?: string
}

export interface Vehicle {
    id: string
    ni: string // Numero de Identificacion
    origen_unit: string
    status: VehicleStatus
    army_status?: ArmyStatus
    entry_date: string
    status_updated_at?: string
    observations?: string
    assigned_operators?: string[]
}

export interface Activity {
    id: string
    name: string
    suggested_order: number
}

export interface ChecklistItem {
    id: string
    activity_id: string
    description: string
}

export interface Supply {
    id: string
    name: string
    description: string
    family?: string
}

export interface SupplyBatch {
    id: string
    supply_id: string
    batch_number?: string
    serial_numbers?: string[] // Optional array of serial numbers
    available_quantity: number
    entry_date: string
}

// Relational Tables
export interface VehicleActivity {
    id: string
    vehicle_id: string
    activity_id: string
    status: ActivityStatus
    operator_id?: string
    supervisor_id?: string
    rejection_reason?: string
    started_at?: string
    completed_at?: string
    verified_at?: string
}

export interface VehicleChecklistItem {
    id: string
    vehicle_activity_id: string
    checklist_id: string
    status: 'pending' | 'in_progress' | 'paused' | 'completed'
    is_completed: boolean
    started_at?: string
    completed_at?: string
    running_since?: string
    accumulated_seconds: number
    operator_id?: string
}

export interface ActivityMaterialConsumption {
    id: string
    vehicle_activity_id: string
    supply_batch_id: string
    serial_number?: string
    quantity_used: number
    operator_id: string
    timestamp: string
}

export interface AuditLog {
    id: string
    user_id: string
    action: string
    entity_type: string
    entity_id: string
    old_value?: string
    new_value?: string
    timestamp: string
}

export interface Ammunition {
    id: string
    type: string
    caliber?: string
    description?: string
    batches?: AmmunitionBatch[]
}

export interface AmmunitionBatch {
    id: string
    ammunition_id: string
    batch_number?: string
    available_quantity: number
    entry_date: string
    ammunition?: Ammunition
}

export interface VehicleAmmunitionAssignment {
    id: string
    vehicle_id: string
    ammunition_batch_id: string
    quantity: number
    operator_id: string
    assigned_at: string
    batch?: AmmunitionBatch
    vehicle?: Vehicle
}
