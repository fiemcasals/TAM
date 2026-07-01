"use client"

import { useState, useRef, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth"
import type { User, Role } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ShieldAlert, UserCog, UserX, UserCheck, Eye, EyeOff, KeyRound } from "lucide-react"
import { resetUserPassword } from "@/lib/actions/authActions"

export default function UsuariosPage() {
    const users = useAuthStore(state => state.users)
    const addUser = useAuthStore(state => state.addUser)
    const deactivateUser = useAuthStore(state => state.deactivateUser)
    const activateUser = useAuthStore(state => state.activateUser)
    const fetchUsers = useAuthStore(state => state.fetchUsers)

    const [resetUserId, setResetUserId] = useState<string | null>(null)
    const [resetPasswordText, setResetPasswordText] = useState("")
    const [resetLoading, setResetLoading] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetUserId || !resetPasswordText) return
        setResetLoading(true)
        try {
            const res = await resetUserPassword(resetUserId, resetPasswordText)
            if (res.success) {
                alert("Contraseña restablecida con éxito.")
                setResetUserId(null)
                setResetPasswordText("")
                setShowPassword(false)
            } else {
                alert(res.message || "Error al restablecer la contraseña.")
            }
        } catch (err) {
            alert("Error al conectar con el servidor.")
        } finally {
            setResetLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const toggleStatus = (id: string, currentStatus: string) => {
        if (currentStatus === 'active') {
            deactivateUser(id);
        } else {
            activateUser(id);
        }
    }

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const modalRef = useRef<HTMLDivElement>(null)
    const firstInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isModalOpen) {
            setTimeout(() => {
                firstInputRef.current?.focus()
            }, 50)
        }
    }, [isModalOpen])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (!modalRef.current) return
        const focusableElements = modalRef.current.querySelectorAll(
            'input, select, button, [tabindex="0"]'
        )
        if (focusableElements.length === 0) return
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus()
                e.preventDefault()
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus()
                e.preventDefault()
            }
        }
    }

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)

        addUser({
            name: fd.get("name") as string,
            lastName: fd.get("lastName") as string,
            email: fd.get("email") as string,
            password: fd.get("password") as string,
            role: fd.get("role") as Role,
            status: 'active'
        })
        setIsModalOpen(false)
    }

    const roleLabels: Record<Role, string> = {
        project_manager: "Jefe Proyecto",
        supervisor: "Supervisor",
        deposit_manager: "Enc. Depósito",
        operator: "Operario"
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Usuarios</h1>
                    <p className="text-slate-500 mt-2">Administración de accesos y roles del personal de planta.</p>
                </div>
                <Button onClick={() => { setIsModalOpen(true); setShowPassword(false); }} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Directorio de Personal</CardTitle>
                        <CardDescription>Visualización de todas las cuentas registradas en el sistema.</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-6">Personal</TableHead>
                                <TableHead>Rol Asignado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Ingreso al Sistema</TableHead>
                                <TableHead className="text-right pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="pl-6">
                                        <div>
                                            <p className="font-medium text-slate-900">{user.name} {user.lastName}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <UserCog className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm text-slate-700">{roleLabels[user.role]}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.status === 'active'
                                            ? <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Activo</Badge>
                                            : <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">Inactivo</Badge>
                                        }
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setResetUserId(user.id)}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-2"
                                        >
                                            <KeyRound className="h-4 w-4 mr-2" /> Restablecer contraseña
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(user.id, user.status || 'active')}
                                            className={user.status === 'active' ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                        >
                                            {user.status === 'active' ? (
                                                <><UserX className="h-4 w-4 mr-2" /> Bloquear acceso</>
                                            ) : (
                                                <><UserCheck className="h-4 w-4 mr-2" /> Restaurar acceso</>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No se encontraron usuarios.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Basic Create User Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onKeyDown={handleKeyDown}
                >
                    <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-blue-500" />
                                Registrar Nuevo Personal
                            </h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nombre</label>
                                    <Input ref={firstInputRef} name="name" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Apellido</label>
                                    <Input name="lastName" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email (Usuario)</label>
                                <Input type="email" name="email" required />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Contraseña Provisoria</label>
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        required 
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Rol del Sistema</label>
                                <select
                                    name="role"
                                    required
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <option value="operator">Operario (Línea)</option>
                                    <option value="supervisor">Supervisor (Auditoría Técnica)</option>
                                    <option value="deposit_manager">Encargado de Depósito</option>
                                    <option value="project_manager">Jefe de Proyecto (Admin)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Completar Registro</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Reset Password Modal */}
            {resetUserId && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-slate-800">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-blue-500" />
                                Restablecer Contraseña
                            </h2>
                        </div>
                        <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nueva Contraseña Provisoria</label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={resetPasswordText}
                                        onChange={(e) => setResetPasswordText(e.target.value)}
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => { setResetUserId(null); setResetPasswordText(""); setShowPassword(false); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={resetLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                    {resetLoading ? "Guardando..." : "Guardar Contraseña"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
