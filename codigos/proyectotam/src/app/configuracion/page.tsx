"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth"
import { useAppStore } from "@/lib/store/app"
import { addActivity, addChecklistItem, updateActivity, deleteActivity, updateChecklistItem, deleteChecklistItem } from "@/lib/actions/configActions"
import { Settings, Plus, Edit2, Trash2, Save, X, ListChecks, ChevronDown, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Activity, ChecklistItem } from "@/types"

export default function ConfiguracionPage() {
    const { currentUser } = useAuthStore()
    const isManager = currentUser?.role === 'project_manager'

    const { activities, checklistItems, fetchData } = useAppStore()
    
    // Activity State
    const [editingAct, setEditingAct] = useState<string | null>(null)
    const [actName, setActName] = useState("")
    const [actOrder, setActOrder] = useState(0)

    // Checklist Item State
    const [editingCheck, setEditingCheck] = useState<string | null>(null)
    const [checkDesc, setCheckDesc] = useState("")

    // Which stages have their task list expanded
    const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())

    const toggleExpanded = (id: string) => {
        setExpandedActivities(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (!isManager) {
        return <div className="p-8 text-center text-red-500">Acceso denegado. Se requieren permisos de Project Manager.</div>
    }

    const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const name = fd.get("name") as string
        const order = parseInt(fd.get("order") as string)
        
        const res = await addActivity(name, order)
        if (res.success) {
            fetchData()
            ;(e.target as HTMLFormElement).reset()
        } else {
            alert(res.message)
        }
    }

    const handleCreateChecklist = async (e: React.FormEvent<HTMLFormElement>, activityId: string) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const desc = fd.get("description") as string
        
        const res = await addChecklistItem(activityId, desc)
        if (res.success) {
            fetchData()
            ;(e.target as HTMLFormElement).reset()
        } else {
            alert(res.message)
        }
    }

    const saveActivity = async (id: string) => {
        const res = await updateActivity(id, actName, actOrder)
        if (res.success) {
            setEditingAct(null)
            fetchData()
        } else {
            alert(res.message)
        }
    }

    const saveCheck = async (id: string) => {
        const res = await updateChecklistItem(id, checkDesc)
        if (res.success) {
            setEditingCheck(null)
            fetchData()
        } else {
            alert(res.message)
        }
    }

    const sortedActivities = [...activities].sort((a, b) => a.suggested_order - b.suggested_order)

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Settings className="h-8 w-8 text-slate-700" />
                    Configuración Dinámica de Línea
                </h1>
                <p className="text-slate-500 mt-2">Defina el flujo de trabajo, etapas y tareas de inspección de manera dinámica.</p>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" /> Nueva Etapa / Actividad
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleCreateActivity} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-700">Nombre de la Etapa</label>
                            <Input name="name" required placeholder="Ej: Montaje de Torre" className="mt-1" />
                        </div>
                        <div className="w-32">
                            <label className="text-xs font-semibold text-slate-700">Orden Sugerido</label>
                            <Input name="order" type="number" required placeholder="10" className="mt-1" />
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Crear Etapa</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {sortedActivities.map(act => {
                    const checks = checklistItems.filter(c => c.activity_id === act.id)
                    const isExpanded = expandedActivities.has(act.id)
                    return (
                        <Card key={act.id} className="overflow-hidden border-slate-200">
                            <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
                                {editingAct === act.id ? (
                                    <div className="flex items-center gap-3 w-full max-w-xl">
                                        <Input
                                            value={actOrder}
                                            type="number"
                                            onChange={e => setActOrder(parseInt(e.target.value) || 0)}
                                            onKeyDown={e => { if (e.key === 'Enter') saveActivity(act.id) }}
                                            className="w-20"
                                        />
                                        <Input
                                            value={actName}
                                            onChange={e => setActName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') saveActivity(act.id) }}
                                            className="flex-1"
                                        />
                                        <Button size="sm" onClick={() => saveActivity(act.id)} className="bg-green-600"><Save className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditingAct(null)}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => toggleExpanded(act.id)}
                                        className="flex items-center gap-4 text-left flex-1"
                                    >
                                        {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                        <div className="bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded text-sm">Etapa {act.suggested_order}</div>
                                        <h3 className="font-bold text-lg text-slate-800">{act.name}</h3>
                                        <span className="text-xs text-slate-400">({checks.length} tareas)</span>
                                    </button>
                                )}

                                {editingAct !== act.id && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setEditingAct(act.id); setActName(act.name); setActOrder(act.suggested_order); }}>
                                            <Edit2 className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={async () => {
                                            if(confirm('¿Eliminar etapa y todas sus tareas?')) {
                                                await deleteActivity(act.id); fetchData();
                                            }
                                        }}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-2">
                                        {checks.map(check => (
                                            <div key={check.id} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100 group">
                                                {editingCheck === check.id ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <Input
                                                            value={checkDesc}
                                                            onChange={e => setCheckDesc(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') saveCheck(check.id) }}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                        />
                                                        <Button size="sm" onClick={() => saveCheck(check.id)} className="bg-green-600 h-8"><Save className="h-3 w-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingCheck(null)} className="h-8"><X className="h-3 w-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-slate-700 flex items-center gap-2">
                                                            <ListChecks className="h-4 w-4 text-slate-400" />
                                                            {check.description}
                                                        </span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCheck(check.id); setCheckDesc(check.description); }}>
                                                                <Edit2 className="h-3 w-3 text-blue-500" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                                                                if(confirm('¿Eliminar tarea?')) {
                                                                    await deleteChecklistItem(check.id); fetchData();
                                                                }
                                                            }}>
                                                                <Trash2 className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {checks.length === 0 && <p className="text-sm italic text-slate-400">Sin tareas definidas.</p>}
                                    </div>

                                    <form onSubmit={(e) => handleCreateChecklist(e, act.id)} className="flex gap-2 items-center border-t border-slate-100 pt-3">
                                        <Input name="description" placeholder="Nueva tarea para esta etapa..." className="flex-1 h-9 text-sm" required />
                                        <Button type="submit" size="sm" variant="outline" className="border-slate-300">Añadir Tarea</Button>
                                    </form>
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
