"use client"

import { useState } from "react"
import type { Role, User } from "@/types"

// Mock user store for the prototype
const mockUsers: Record<Role, User> = {
    deposit_manager: { id: "1", name: "Carlos Depósito", role: "deposit_manager", email: "deposito@tam.gob" },
    operator: { id: "2", name: "Juan Operario", role: "operator", email: "operario@tam.gob" },
    supervisor: { id: "3", name: "Ana Supervisor", role: "supervisor", email: "supervisor@tam.gob" },
    project_manager: { id: "4", name: "Jefe Proyecto", role: "project_manager", email: "jefe@tam.gob" },
}

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<User>(mockUsers.project_manager)

    const switchRole = (role: Role) => {
        setCurrentUser(mockUsers[role])
    }

    return { user: currentUser, switchRole, roles: Object.keys(mockUsers) as Role[] }
}
