"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Eye, EyeOff, X } from "lucide-react"
import { changeCurrentUserPassword } from "@/lib/actions/authActions"

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [currentPass, setCurrentPass] = useState("")
    const [newPass, setNewPass] = useState("")
    const [confirmPass, setConfirmPass] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!currentPass || !newPass || !confirmPass) {
            setError("Todos los campos son obligatorios.")
            return
        }

        if (newPass !== confirmPass) {
            setError("La nueva contraseña y la confirmación no coinciden.")
            return
        }

        if (newPass.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.")
            return
        }

        setLoading(true)
        try {
            const res = await changeCurrentUserPassword(currentPass, newPass)
            if (res.success) {
                setSuccess(res.message || "Contraseña actualizada.")
                setCurrentPass("")
                setNewPass("")
                setConfirmPass("")
                setTimeout(() => {
                    onClose()
                    setSuccess(null)
                }, 1500)
            } else {
                setError(res.message || "Error al actualizar la contraseña.")
            }
        } catch (err) {
            setError("Error de conexión al servidor.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white shadow-2xl w-screen h-screen max-w-none overflow-y-auto flex flex-col text-slate-800">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-blue-500" />
                        Cambiar Mi Contraseña
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Contraseña Actual</label>
                        <div className="relative">
                            <Input
                                type={showCurrent ? "text" : "password"}
                                value={currentPass}
                                onChange={(e) => setCurrentPass(e.target.value)}
                                required
                                className="pr-10 bg-slate-50 text-slate-900 border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                required
                                className="pr-10 bg-slate-50 text-slate-900 border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Confirmar Nueva Contraseña</label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                required
                                className="pr-10 bg-slate-50 text-slate-900 border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? "Actualizando..." : "Actualizar Contraseña"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
