"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const currentUser = useAuthStore(state => state.currentUser)
    const [isMounted, setIsMounted] = useState(false)

    // This ensures hydration matches and avoids SSR issues since localStorage is client-only
    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        const isAuthRoute = pathname === "/login"

        // If no user is authenticated and trying to access a protected route
        if (!currentUser && !isAuthRoute) {
            router.push("/login")
        }

        // If user is authenticated and trying to access login page
        if (currentUser && isAuthRoute) {
            router.push("/")
        }

        // Trigger global data fetch if authenticated
        if (currentUser) {
            // Lazy import to avoid circular dep issues in store
            import("@/lib/store/app").then(module => {
                module.useAppStore.getState().fetchData();
            });
            useAuthStore.getState().fetchUsers();
        }

    }, [currentUser, pathname, isMounted, router])

    // Don't render anything until we have mounted to prevent hydration errors from zustand persist
    if (!isMounted) return null

    // If user is not authenticated and not on login page, don't render children children yet to prevent flashing
    if (!currentUser && pathname !== "/login") return null

    return <>{children}</>
}
