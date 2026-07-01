"use server"

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'

const prisma = new PrismaClient()

export async function getSupplies() {
  const session = await getSession()
  if (!session) {
    return { success: false, data: { supplies: [], supplyBatches: [] }, message: "No autenticado" }
  }

  const supplies = await prisma.supply.findMany()
  const supplyBatches = await prisma.supplyBatch.findMany({
    orderBy: { entry_date: 'desc' }
  })
  return { success: true, data: { supplies, supplyBatches } }
}

export async function addSupplyAction(name: string, description: string, family?: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    const supply = await prisma.supply.create({
      data: { name, description, family }
    })
    return { success: true, supply }
  } catch (error) {
    return { success: false }
  }
}

export async function updateSupplyAction(id: string, name: string, family: string, description?: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    const supply = await prisma.supply.update({
      where: { id },
      data: { name, family, description }
    })
    return { success: true, supply }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteSupplyAction(id: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    await prisma.supply.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function addBatchAction(supplyId: string, batchNumber?: string, serialNumbers: string[] = [], quantity: number = 1) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    const batch = await prisma.supplyBatch.create({
      data: {
        supply_id: supplyId,
        batch_number: batchNumber,
        serial_numbers: serialNumbers,
        available_quantity: quantity
      }
    })
    return { success: true, batch }
  } catch (error) {
    return { success: false }
  }
}

export async function updateBatchAction(id: string, batchNumber?: string, serialNumbers: string[] = [], quantity: number = 1) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    const batch = await prisma.supplyBatch.update({
      where: { id },
      data: {
        batch_number: batchNumber,
        serial_numbers: serialNumbers,
        available_quantity: quantity
      }
    })
    return { success: true, batch }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteBatchAction(id: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'deposit_manager' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Depósito." }
    }

    await prisma.supplyBatch.delete({ where: { id } })
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}

export async function consumeMaterialAction(vehicleActivityId: string, batchId: string, quantity: number, operatorId: string, serialNumber?: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'operator' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Operario." }
    }

    return await prisma.$transaction(async (tx) => {
      const batch = await tx.supplyBatch.findUnique({ where: { id: batchId } })
      if (!batch) {
        return { success: false, message: "Lote de insumo no encontrado" }
      }
      if (batch.available_quantity < quantity) {
        return { success: false, message: `Insuficiente stock en el lote. Disponible: ${batch.available_quantity}` }
      }

      let newSerials = batch.serial_numbers
      if (serialNumber) {
        if (!newSerials.includes(serialNumber)) {
          return { success: false, message: "El repuesto con ese N° de serie ya ha sido utilizado." }
        }
        newSerials = newSerials.filter(s => s !== serialNumber)
      }

      await tx.supplyBatch.update({
        where: { id: batchId },
        data: {
          available_quantity: batch.available_quantity - quantity,
          serial_numbers: newSerials
        }
      })

      await tx.activityMaterialConsumption.create({
        data: {
          vehicle_activity_id: vehicleActivityId,
          supply_batch_id: batchId,
          quantity_used: quantity,
          operator_id: operatorId,
          serial_number: serialNumber
        }
      })

      const vAct = await tx.vehicleActivity.findUnique({ where: { id: vehicleActivityId } })
      if (vAct && vAct.status === 'pending') {
        await tx.vehicleActivity.update({
          where: { id: vehicleActivityId },
          data: { status: 'in_progress' }
        })
      }

      return { success: true }
    })
  } catch (error) {
    console.error("Consume Material Action Error:", error)
    return { success: false, message: "Error al registrar el uso del insumo." }
  }
}

export async function restoreMaterialAction(consumptionId: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'operator' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Operario." }
    }

    return await prisma.$transaction(async (tx) => {
      const consumption = await tx.activityMaterialConsumption.findUnique({ where: { id: consumptionId } })
      if (!consumption) {
        return { success: false, message: "El registro de consumo no existe" }
      }

      const batch = await tx.supplyBatch.findUnique({ where: { id: consumption.supply_batch_id } })
      if (!batch) {
        return { success: false, message: "El lote del insumo ya no existe" }
      }

      let newSerials = batch.serial_numbers
      if (consumption.serial_number && !newSerials.includes(consumption.serial_number)) {
        newSerials = [...newSerials, consumption.serial_number]
      }

      await tx.activityMaterialConsumption.delete({ where: { id: consumptionId } })

      await tx.supplyBatch.update({
        where: { id: batch.id },
        data: {
          available_quantity: batch.available_quantity + consumption.quantity_used,
          serial_numbers: newSerials
        }
      })

      return { success: true }
    })
  } catch (e) {
    console.error("Restore Material Action Error:", e)
    return { success: false, message: "Error al eliminar el consumo." }
  }
}

export async function updateConsumptionAction(consumptionId: string, newQuantity: number) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'operator' && session.role !== 'project_manager')) {
      return { success: false, message: "No autorizado. Se requieren permisos de Operario." }
    }

    if (newQuantity <= 0) {
      return { success: false, message: "La cantidad debe ser mayor a 0." }
    }

    return await prisma.$transaction(async (tx) => {
      const consumption = await tx.activityMaterialConsumption.findUnique({ where: { id: consumptionId } })
      if (!consumption) {
        return { success: false, message: "El registro de consumo no existe." }
      }

      if (consumption.serial_number) {
        return { success: false, message: "No se puede cambiar la cantidad de un insumo seriado." }
      }

      const batch = await tx.supplyBatch.findUnique({ where: { id: consumption.supply_batch_id } })
      if (!batch) {
        return { success: false, message: "El lote del insumo no existe." }
      }

      const diff = newQuantity - consumption.quantity_used
      if (diff > 0 && batch.available_quantity < diff) {
        return { success: false, message: `Stock insuficiente en depósito. Disponible: ${batch.available_quantity}.` }
      }

      await tx.supplyBatch.update({
        where: { id: batch.id },
        data: {
          available_quantity: batch.available_quantity - diff
        }
      })

      await tx.activityMaterialConsumption.update({
        where: { id: consumptionId },
        data: {
          quantity_used: newQuantity
        }
      })

      return { success: true }
    })
  } catch (error) {
    console.error("Update Consumption Error:", error)
    return { success: false, message: "Error al actualizar la cantidad." }
  }
}

export async function getMaterialsReport() {
  try {
    const session = await getSession()
    if (!session) {
      return { success: false, message: "No autenticado" }
    }

    // Obtener todos los materiales con sus lotes
    const supplies = await prisma.supply.findMany({
      include: {
        batches: {
          orderBy: { entry_date: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Obtener todos los consumos de material con sus relaciones
    const consumptions = await prisma.activityMaterialConsumption.findMany({
      include: {
        supplyBatch: {
          include: {
            supply: true
          }
        },
        vehicleActivity: {
          include: {
            vehicle: true,
            activity: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    // Obtener usuarios para poder mapear el operario
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
        supplies: JSON.parse(JSON.stringify(supplies)), 
        consumptions: JSON.parse(JSON.stringify(consumptions)), 
        users: JSON.parse(JSON.stringify(users)) 
      } 
    }
  } catch (error) {
    console.error("getMaterialsReport Error:", error)
    return { success: false, message: "Error al obtener el reporte de materiales." }
  }
}
