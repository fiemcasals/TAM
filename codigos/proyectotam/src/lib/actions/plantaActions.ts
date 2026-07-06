"use server"

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const prisma = new PrismaClient()

// VEHICLES
export async function getVehicles() {
  const session = await getSession()
  if (!session) {
    return { success: false, vehicles: [], vehicleActivities: [], vehicleChecklistItems: [], message: "No autenticado" }
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { entry_date: 'desc' }
  })
  const vehicleActivities = await prisma.vehicleActivity.findMany()
  const vehicleChecklistItems = await prisma.vehicleChecklistItem.findMany()

  return { success: true, vehicles, vehicleActivities, vehicleChecklistItems }
}

export async function addVehicle(data: { ni: string, origen_unit: string, status: string, army_status?: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager." }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ni: data.ni,
        origen_unit: data.origen_unit,
        status: data.status,
        army_status: data.army_status || 'uninspected'
      }
    })
    
    // Auto init activities
    const activities = await prisma.activity.findMany()
    const mapped = activities.map(act => ({
      vehicle_id: vehicle.id,
      activity_id: act.id,
      status: 'pending'
    }))
    
    if (mapped.length > 0) {
      await prisma.vehicleActivity.createMany({ data: mapped })
    }

    return { success: true, vehicle }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Error al agregar vehículo" }
  }
}

export async function updateVehicleStatus(id: string, status: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'project_manager' && session.role !== 'supervisor')) {
      return { success: false, message: "No autorizado." }
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: "Vehículo no encontrado." }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        status,
        status_updated_at: status !== existing.status ? new Date() : undefined
      }
    })
    return { success: true, vehicle: updated }
  } catch (e) {
    return { success: false, message: "Error al actualizar estado" }
  }
}

export async function updateVehicle(id: string, data: { ni: string, origen_unit: string, status: string, assigned_operators?: string[], army_status?: string }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'project_manager' && session.role !== 'supervisor')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager o Supervisor." }
    }

    const existing = await prisma.vehicle.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, message: "Vehículo no encontrado." }
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ni: data.ni,
        origen_unit: data.origen_unit,
        status: data.status,
        status_updated_at: data.status !== existing.status ? new Date() : undefined,
        assigned_operators: data.assigned_operators,
        army_status: data.army_status
      }
    })
    return { success: true, vehicle: updated }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Error al actualizar vehículo" }
  }
}

// PLANTA / ACTIVITIES
export async function getVehicleDetails(vehicleId: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: "No autenticado." }
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    const vehicleActivities = await prisma.vehicleActivity.findMany({ where: { vehicle_id: vehicleId } })
    const vehicleChecklistItems = await prisma.vehicleChecklistItem.findMany({ 
      where: { vehicleActivity: { vehicle_id: vehicleId } } 
    })
    const activityMaterialConsumptions = await prisma.activityMaterialConsumption.findMany({
      where: { vehicleActivity: { vehicle_id: vehicleId } }
    })
    
    return { success: true, data: { vehicle, vehicleActivities, vehicleChecklistItems, activityMaterialConsumptions } }
  } catch (e) {
    return { success: false, message: "Error getting details" }
  }
}

export async function getCatalogData() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: "No autenticado." }
    }

    const activities = await prisma.activity.findMany({ orderBy: { suggested_order: 'asc' } })
    const checklistItems = await prisma.checklistItem.findMany()
    return { success: true, data: { activities, checklistItems } }
  } catch (e) {
    return { success: false, message: "Error cargando catálogo" }
  }
}

export async function toggleChecklistItemAction(vehicleActivityId: string, checklistId: string, operatorId: string, actionType: 'start' | 'complete' | 'reset') {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'operator' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Operario." }
    }

    const existing = await prisma.vehicleChecklistItem.findFirst({
      where: { vehicle_activity_id: vehicleActivityId, checklist_id: checklistId }
    })

    if (actionType === 'reset') {
      if (existing) await prisma.vehicleChecklistItem.delete({ where: { id: existing.id } })
    } else if (actionType === 'complete') {
      if (existing) {
        await prisma.vehicleChecklistItem.update({
          where: { id: existing.id },
          data: { is_completed: true, completed_at: new Date() }
        })
      }
    } else if (actionType === 'start') {
      if (!existing) {
        await prisma.vehicleChecklistItem.create({
          data: {
            vehicle_activity_id: vehicleActivityId,
            checklist_id: checklistId,
            is_completed: false,
            started_at: new Date(),
            operator_id: operatorId
          }
        })

        // Auto-transition to in_progress if currently pending
        const vAct = await prisma.vehicleActivity.findUnique({ where: { id: vehicleActivityId } })
        if (vAct && vAct.status === 'pending') {
          await prisma.vehicleActivity.update({
            where: { id: vehicleActivityId },
            data: { status: 'in_progress', started_at: new Date() }
          })
        }
      }
    }
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false }
  }
}

export async function updateActivityStatusAction(vehicleActivityId: string, status: string, userId: string, reason?: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: "No autenticado." }
    }

    if (status === 'completed') {
      if (session.role !== 'supervisor' && session.role !== 'project_manager') {
        return { success: false, message: "No autorizado. Se requieren permisos de Supervisor para aprobar la actividad." }
      }
    } else {
      if (session.role !== 'operator' && session.role !== 'supervisor' && session.role !== 'project_manager') {
        return { success: false, message: "No autorizado." }
      }
    }

    const vAct = await prisma.vehicleActivity.findUnique({ where: { id: vehicleActivityId } })
    if (!vAct) {
      return { success: false, message: "Actividad no encontrada." }
    }

    const updateData: any = { status }

    if (status === 'in_progress') {
      if (!vAct.started_at) {
        updateData.started_at = new Date()
      }
      updateData.completed_at = null
      if (reason) {
        updateData.rejection_reason = reason
      }
    } else if (status === 'pending_review') {
      if (!vAct.started_at) {
        updateData.started_at = vAct.started_at || new Date()
      }
      updateData.completed_at = new Date()
      updateData.rejection_reason = null
    } else if (status === 'completed') {
      if (!vAct.started_at) {
        updateData.started_at = vAct.started_at || new Date()
      }
      if (!vAct.completed_at) {
        updateData.completed_at = vAct.completed_at || new Date()
      }
      updateData.verified_at = new Date()
      updateData.supervisor_id = userId
    } else if (status === 'pending') {
      updateData.started_at = null
      updateData.completed_at = null
      updateData.verified_at = null
      updateData.supervisor_id = null
      updateData.rejection_reason = null
    }

    await prisma.vehicleActivity.update({
      where: { id: vehicleActivityId },
      data: updateData
    })
    return { success: true }
  } catch (error) {
     console.error(error)
     return { success: false }
  }
}


