"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/store/auth"
import { ShieldCheck, LogIn, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const login = useAuthStore(state => state.login)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // We attempt login against our mocked store
        const success = login(email, password)

        if (!success) {
            setError("Credenciales inválidas o cuenta inactiva.")
        }
        // AuthProvider will automatically redirect to "/" if successful
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 absolute inset-0 z-50">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
                <CardHeader className="space-y-3 text-center pt-8">
                    <div className="flex justify-center mb-0">
                        <div className="h-20 w-20 flex items-center justify-center">
                            <img src="/logo.png" alt="Proyecto TAM Logo" className="h-full w-full object-contain drop-shadow-md rounded-full bg-white p-1" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-wider">PROYECTO TAM</CardTitle>
                    <CardDescription className="text-slate-400">
                        Control de Acceso • Sistema de Gestión de Planta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Usuario / Email</label>
                            <Input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 text-slate-100 placeholder:text-slate-600"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-slate-950 border-slate-800 focus-visible:ring-blue-500 text-slate-100 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300 focus:outline-none z-10"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-400 mt-4">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                            <LogIn className="mr-2 h-4 w-4" />
                            Ingresar al Sistema
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 justify-center pb-8 border-t border-slate-800 mt-6 pt-6 text-center">
                    <p className="text-xs text-slate-400">
                        🔑 <strong>¿Olvidó su contraseña?</strong> Solicite el restablecimiento al Jefe de Proyecto / Manager.
                    </p>
                    <p className="text-xs text-slate-600">
                        El acceso y uso de este sistema está monitoreado bajo protocolos de seguridad.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
