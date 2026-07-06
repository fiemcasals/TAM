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
      if (!vehicle || vehicle.status !== 'in_service') {
         throw new Error("El vehículo debe estar En Servicio para recibir munición")
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
