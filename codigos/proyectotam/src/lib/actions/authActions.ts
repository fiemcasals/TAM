"use server"

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createSession, destroySession, getSession } from '@/lib/session'

const prisma = new PrismaClient()

export async function loginUser(email: string, passwordText: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || user.status !== 'active') {
      return { success: false, user: null, message: "Usuario no encontrado o inactivo." }
    }

    const isValid = await bcrypt.compare(passwordText, user.password)
    
    if (isValid) {
      // Don't send password hash to client
      const { password, ...safeUser } = user
      
      // Create secure server session cookie
      await createSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })

      return { success: true, user: safeUser }
    }
    
    return { success: false, user: null, message: "Contraseña incorrecta." }
  } catch (error) {
    console.error("Login Error:", error)
    return { success: false, user: null, message: "Error en el servidor." }
  }
}

export async function logoutUser() {
  try {
    await destroySession()
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function getUsers() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'project_manager' && session.role !== 'supervisor')) {
      return { success: false, users: [], message: "No autorizado." }
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, lastName: true, email: true, role: true, status: true, createdAt: true }
    })
    return { success: true, users }
  } catch (error) {
    return { success: false, users: [], message: "Error en el servidor." }
  }
}

export async function createNewUser(data: { name: string, email: string, role: string, passwordText: string }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager." }
    }

    const hashedPassword = await bcrypt.hash(data.passwordText, 10)
    
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role
      }
    })

    return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status } }
  } catch (error) {
    console.error("Create User Error:", error)
    return { success: false, message: "Error al crear usuario. Verifica que el email no esté en uso." }
  }
}

export async function deactivateUser(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager." }
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'inactive' }
    })
    return { success: true }
  } catch (error) {
    return { success: false, message: "Error al desactivar usuario." }
  }
}

export async function activateUser(id: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager." }
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'active' }
    })
    return { success: true }
  } catch (error) {
    return { success: false, message: "Error al activar usuario." }
  }
}

export async function changeCurrentUserPassword(currentPass: string, newPass: string) {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return { success: false, message: "No autorizado. Sesión inválida." }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user) {
      return { success: false, message: "Usuario no encontrado." }
    }

    const isValid = await bcrypt.compare(currentPass, user.password)
    if (!isValid) {
      return { success: false, message: "La contraseña actual es incorrecta." }
    }

    const hashedPassword = await bcrypt.hash(newPass, 10)
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword }
    })

    return { success: true, message: "Contraseña cambiada con éxito." }
  } catch (error) {
    console.error("Change Password Error:", error)
    return { success: false, message: "Error al cambiar la contraseña." }
  }
}

export async function resetUserPassword(userId: string, newPasswordText: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'project_manager') {
      return { success: false, message: "No autorizado. Se requieren permisos de Project Manager." }
    }

    const hashedPassword = await bcrypt.hash(newPasswordText, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { success: true, message: "Contraseña restablecida con éxito." }
  } catch (error) {
    console.error("Reset User Password Error:", error)
    return { success: false, message: "Error al restablecer la contraseña." }
  }
}
