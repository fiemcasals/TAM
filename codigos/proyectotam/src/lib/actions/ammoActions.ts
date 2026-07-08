"use server"

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const prisma = new PrismaClient()

export async function getAmmunition() {
  try {
    const ammo = await prisma.ammunition.findMany({
      include: {
        batches: {
          orderBy: { entry_date: 'desc' }
        }
      },
      orderBy: { type: 'asc' }
    })
    
    // Convert Dates to ISO strings to pass to client
    const serializedAmmo = ammo.map(a => ({
      ...a,
      batches: a.batches.map(b => ({
        ...b,
        entry_date: b.entry_date.toISOString()
      }))
    }))
    
    return { success: true, data: serializedAmmo }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Error al cargar la munición" }
  }
}

export async function addAmmunition(type: string, caliber: string, description: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ammo_manager' && session.role !== 'project_manager' && session.role !== 'admin')) {
      return { success: false, message: "No autorizado" }
    }

    const ammo = await prisma.ammunition.create({
      data: { type, caliber, description }
    })

    await prisma.auditLog.create({
      data: {
        user_id: session.userId,
        action: 'CREATE_AMMO',
        entity_type: 'Ammunition',
        entity_id: ammo.id,
        new_value: JSON.stringify({ type, caliber })
      }
    })

    return { success: true, data: ammo }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Error al crear munición" }
  }
}

export async function addAmmunitionBatch(ammunitionId: string, batchNumber: string, quantity: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ammo_manager' && session.role !== 'project_manager' && session.role !== 'admin')) {
      return { success: false, message: "No autorizado" }
    }

    const batch = await prisma.ammunitionBatch.create({
      data: {
        ammunition_id: ammunitionId,
        batch_number: batchNumber,
        available_quantity: quantity
      }
    })

    await prisma.auditLog.create({
      data: {
        user_id: session.userId,
        action: 'CREATE_AMMO_BATCH',
        entity_type: 'AmmunitionBatch',
        entity_id: batch.id,
        new_value: JSON.stringify({ batchNumber, quantity })
      }
    })

    return { success: true, data: batch }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Error al crear lote de munición" }
  }
}

export async function assignAmmunition(vehicleId: string, batchId: string, quantity: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ammo_manager' && session.role !== 'project_manager' && session.role !== 'admin')) {
      return { success: false, message: "No autorizado" }
    }

    if (quantity <= 0) return { success: false, message: "Cantidad inválida" }

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.ammunitionBatch.findUnique({ where: { id: batchId } })
      if (!batch || batch.available_quantity < quantity) {
        throw new Error("Stock insuficiente")
      }

      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } })
      if (!vehicle || vehicle.status !== 'in_plant') {
         throw new Error("El vehículo debe estar En Planta para recibir munición")
      }

      await tx.ammunitionBatch.update({
        where: { id: batchId },
        data: { available_quantity: batch.available_quantity - quantity }
      })

      const assignment = await tx.vehicleAmmunitionAssignment.create({
        data: {
          vehicle_id: vehicleId,
          ammunition_batch_id: batchId,
          quantity,
          operator_id: session.userId
        }
      })

      await tx.auditLog.create({
        data: {
          user_id: session.userId,
          action: 'ASSIGN_AMMO',
          entity_type: 'VehicleAmmunitionAssignment',
          entity_id: assignment.id,
          new_value: JSON.stringify({ vehicleId, batchId, quantity })
        }
      })

      return assignment
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error(error)
    return { success: false, message: error.message || "Error al asignar munición" }
  }
}

export async function restoreAmmunitionAction(assignmentId: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ammo_manager' && session.role !== 'project_manager' && session.role !== 'admin')) {
      return { success: false, message: "No autorizado" }
    }

    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.vehicleAmmunitionAssignment.findUnique({ where: { id: assignmentId } })
      if (!assignment) {
        return { success: false, message: "La asignación no existe" }
      }

      const batch = await tx.ammunitionBatch.findUnique({ where: { id: assignment.ammunition_batch_id } })
      if (!batch) {
        return { success: false, message: "El lote de munición ya no existe" }
      }

      await tx.vehicleAmmunitionAssignment.delete({ where: { id: assignmentId } })

      await tx.ammunitionBatch.update({
        where: { id: batch.id },
        data: { available_quantity: batch.available_quantity + assignment.quantity }
      })

      await tx.auditLog.create({
        data: {
          user_id: session.userId,
          action: 'REVERT_AMMO',
          entity_type: 'VehicleAmmunitionAssignment',
          entity_id: assignmentId,
          old_value: JSON.stringify({ vehicleId: assignment.vehicle_id, batchId: assignment.ammunition_batch_id, quantity: assignment.quantity })
        }
      })

      return { success: true }
    })
  } catch (error) {
    console.error("Restore Ammunition Action Error:", error)
    return { success: false, message: "Error al revertir la asignación de munición." }
  }
}

export async function getAmmunitionReport() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: "No autenticado" }
    }

    const assignments = await prisma.vehicleAmmunitionAssignment.findMany({
      include: {
        batch: {
          include: {
            ammunition: true
          }
        },
        vehicle: true
      },
      orderBy: { assigned_at: 'desc' }
    })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true
      }
    })

    return {
      success: true,
      data: {
        assignments: JSON.parse(JSON.stringify(assignments)),
        users: JSON.parse(JSON.stringify(users))
      }
    }
  } catch (error) {
    console.error("getAmmunitionReport Error:", error)
    return { success: false, message: "Error al obtener el reporte de munición." }
  }
}

export async function getAssignedAmmunition(vehicleId: string) {
    try {
        const assignments = await prisma.vehicleAmmunitionAssignment.findMany({
            where: { vehicle_id: vehicleId },
            include: {
                batch: {
                    include: {
                        ammunition: true
                    }
                }
            },
            orderBy: { assigned_at: 'desc' }
        })
        
        return { success: true, data: assignments }
    } catch (error) {
        return { success: false }
    }
}
