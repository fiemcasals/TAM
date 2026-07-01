"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { LayoutDashboard, Wrench, Package, ShieldCheck, Users, LogOut, KeyRound, ClipboardList } from "lucide-react"
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal"

export function Sidebar() {
    const pathname = usePathname()
    const { currentUser, logout } = useAuthStore()
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

    if (pathname === '/login') return null

    // Define role-based navigation logic
    const isManager = currentUser?.role === 'project_manager'
    const canSeeDeposit = currentUser?.role === 'project_manager' || currentUser?.role === 'deposit_manager'

    return (
        <div className="flex bg-slate-950 text-slate-300 w-64 flex-col min-h-screen p-4 border-r border-slate-800">
            <div className="mb-8 flex items-center gap-2 px-2">
                <img src="/logo.png" alt="Proyecto TAM Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
                <h1 className="text-xl font-bold text-white tracking-wider">PROYECTO TAM</h1>
            </div>

            <nav className="flex-1 space-y-2">
                <Link
                    href="/"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname === '/' ? 'bg-slate-900 text-white' : 'hover:bg-slate-900 hover:text-white'}`}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    General Dashboard
                </Link>
                <Link
                    href="/planta"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname.startsWith('/planta') ? 'bg-slate-900 text-white' : 'hover:bg-slate-900 hover:text-white'}`}
                >
                    <Wrench className="h-5 w-5" />
                    Línea de Producción
                </Link>
                <Link
                    href="/materiales"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname.startsWith('/materiales') ? 'bg-slate-900 text-white' : 'hover:bg-slate-900 hover:text-white'}`}
                >
                    <ClipboardList className="h-5 w-5" />
                    Control de Materiales
                </Link>

                {canSeeDeposit && (
                    <Link
                        href="/deposito"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname.startsWith('/deposito') ? 'bg-slate-900 text-white' : 'hover:bg-slate-900 hover:text-white'}`}
                    >
                        <Package className="h-5 w-5" />
                        Depósito e Insumos
                    </Link>
                )}

                {isManager && (
                    <Link
                        href="/auditoria/usuarios"
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${pathname.startsWith('/auditoria') ? 'bg-slate-900 text-white' : 'hover:bg-slate-900 hover:text-white'}`}
                    >
                        <Users className="h-5 w-5" />
                        Roles y Usuarios
                    </Link>
                )}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-800 px-2 space-y-3">
                <div>
                    <p className="text-xs text-slate-500">Sesión iniciada:</p>
                    <p className="text-sm font-medium text-slate-200 truncate">{currentUser?.name} {currentUser?.lastName}</p>
                    <p className="text-xs text-blue-400 capitalize">{currentUser?.role.replace('_', ' ')}</p>
                </div>

                <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full justify-start py-1"
                >
                    <KeyRound className="h-3.5 w-3.5 text-slate-500" /> Cambiar Contraseña
                </button>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full justify-start mt-2 py-1"
                >
                    <LogOut className="h-4 w-4" /> Cerrar Sesión
                </button>
            </div>

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </div>
    )
}
