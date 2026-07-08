"use client"

import { useEffect, useState } from "react"
import { getVehicleObservations, addVehicleObservationAction } from "@/lib/actions/plantaActions"
import { Button } from "@/components/ui/button"
import type { VehicleObservation } from "@/types"

interface ObservationsModalProps {
    vehicleId: string
    vehicleNi: string
    authorName: string
    canAdd: boolean
    onClose: () => void
}

export function ObservationsModal({ vehicleId, vehicleNi, authorName, canAdd, onClose }: ObservationsModalProps) {
    const [observations, setObservations] = useState<VehicleObservation[]>([])
    const [loading, setLoading] = useState(true)
    const [newText, setNewText] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const load = async () => {
        setLoading(true)
        const res = await getVehicleObservations(vehicleId)
        if (res.success) setObservations((res.data as VehicleObservation[]) || [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleId])

    const handleAdd = async () => {
        if (!newText.trim()) return
        setSubmitting(true)
        const res = await addVehicleObservationAction(vehicleId, newText, authorName)
        setSubmitting(false)
        if (res.success) {
            setNewText("")
            await load()
        } else {
            alert(res.message)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white shadow-2xl w-screen h-screen max-w-none overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-slate-900">Observaciones — NI {vehicleNi}</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                    {loading ? (
                        <p className="text-sm text-slate-500 text-center py-6">Cargando...</p>
                    ) : observations.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-6">Sin observaciones registradas.</p>
                    ) : (
                        observations.map(o => (
                            <div key={o.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{o.text}</p>
                                <p className="text-xs text-slate-400 mt-1.5">
                                    {o.author || "Desconocido"} · {new Date(o.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {canAdd ? (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
                        <textarea
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Agregar una nueva observación..."
                            rows={2}
                            className="w-full text-sm border border-slate-200 rounded-md p-2 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
                            <Button
                                type="button"
                                onClick={handleAdd}
                                disabled={submitting || !newText.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Agregar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
                        <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
