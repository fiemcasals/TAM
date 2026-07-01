import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { loginUser, getUsers, createNewUser, deactivateUser, logoutUser, activateUser } from '@/lib/actions/authActions'

interface AuthState {
    currentUser: User | null
    users: User[]
    
    // Server-synced actions
    login: (email: string, password?: string) => Promise<boolean>
    logout: () => Promise<void>
    fetchUsers: () => Promise<void>
    addUser: (user: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>
    deactivateUser: (id: string) => Promise<void>
    activateUser: (id: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [],

            login: async (email, password) => {
                if (!password) return false
                const result = await loginUser(email, password)
                if (result.success && result.user) {
                    set({ currentUser: (result.user as unknown) as User })
                    return true
                } else {
                    alert(result.message || "Error al iniciar sesión")
                    return false
                }
            },

            logout: async () => {
                await logoutUser()
                set({ currentUser: null })
            },

            fetchUsers: async () => {
                const res = await getUsers()
                if (res.success) {
                    set({ users: (res.users as unknown) as User[] })
                }
            },

            addUser: async (user) => {
                const res = await createNewUser({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    passwordText: user.password || '123456'
                })
                if (res.success && res.user) {
                    await get().fetchUsers()
                } else {
                    alert(res.message)
                }
            },

            deactivateUser: async (id) => {
                const res = await deactivateUser(id)
                if (res.success) {
                    await get().fetchUsers()
                }
            },

            activateUser: async (id) => {
                const res = await activateUser(id)
                if (res.success) {
                    await get().fetchUsers()
                }
            }
        }),
        {
            name: 'tam-auth-storage', // Keep for currentUser persistence
            partialize: (state) => ({ currentUser: state.currentUser }) // Only persist current user
        }
    )
)
