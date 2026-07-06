"use server"

import { PrismaClient } from '@prisma/client'
import { getSession } from "./authActions"

const prisma = new PrismaClient()

export async function addActivity(name: string, suggested_order: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    const activity = await prisma.activity.create({
      data: { name, suggested_order }
    })

    return { success: true, data: activity }
  } catch (error) {
    return { success: false, message: "Error al crear actividad" }
  }
}

export async function addChecklistItem(activity_id: string, description: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    const item = await prisma.checklistItem.create({
      data: { activity_id, description }
    })

    return { success: true, data: item }
  } catch (error) {
    return { success: false, message: "Error al crear ítem de checklist" }
  }
}

export async function updateActivity(id: string, name: string, suggested_order: number) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: { name, suggested_order }
    })

    return { success: true, data: activity }
  } catch (error) {
    return { success: false, message: "Error al actualizar actividad" }
  }
}

export async function deleteActivity(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    await prisma.activity.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    return { success: false, message: "Error al eliminar actividad" }
  }
}

export async function updateChecklistItem(id: string, description: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    const item = await prisma.checklistItem.update({
      where: { id },
      data: { description }
    })

    return { success: true, data: item }
  } catch (error) {
    return { success: false, message: "Error al actualizar ítem" }
  }
}

export async function deleteChecklistItem(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado." }
    }

    await prisma.checklistItem.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    return { success: false, message: "Error al eliminar ítem" }
  }
}
