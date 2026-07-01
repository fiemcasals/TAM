export type Role = 'deposit_manager' | 'operator' | 'supervisor' | 'project_manager'
export type VehicleStatus = 'out_of_service' | 'in_plant' | 'in_service'
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
    entry_date: string
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
    started_at?: string
    completed_at?: string
    verified_at?: string
}

export interface VehicleChecklistItem {
    id: string
    vehicle_activity_id: string
    checklist_id: string
    is_completed: boolean
    completed_at?: string
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
