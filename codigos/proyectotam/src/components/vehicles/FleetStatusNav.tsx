"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Archive, Wrench, Shield } from "lucide-react"
import type { Vehicle } from "@/types"

interface FleetStatusNavProps {
    vehicles: Vehicle[]
}

export function FleetStatusNav({ vehicles }: FleetStatusNavProps) {
    const pathname = usePathname()
    const currentUser = useAuthStore(state => state.currentUser)
    const canSeeArmy = currentUser?.role === 'project_manager'

    const tankStats = {
        in_service: vehicles.filter(v => v.status === 'in_service').length,
        in_plant: vehicles.filter(v => v.status === 'in_plant').length,
        in_deposit: vehicles.filter(v => v.status === 'in_deposit').length,
        in_army: vehicles.filter(v => v.status === 'in_army').length,
    }

    const allCards = [
        { href: "/servicio", active: pathname.startsWith("/servicio"), label: "En Servicio", count: tankStats.in_service, hint: "Unidades operativas ➔", icon: Activity, color: "blue" },
        { href: "/planta", active: pathname.startsWith("/planta"), label: "En Planta", count: tankStats.in_plant, hint: "En proceso de repotenciación ➔", icon: Wrench, color: "amber" },
        { href: "/en-deposito", active: pathname.startsWith("/en-deposito"), label: "En Depósito", count: tankStats.in_deposit, hint: "A la espera de ingreso ➔", icon: Archive, color: "red" },
        { href: "/flota", active: pathname.startsWith("/flota"), label: "En Ejército", count: tankStats.in_army, hint: "Previo a modernización ➔", icon: Shield, color: "green" },
    ] as const

    const cards = canSeeArmy ? allCards : allCards.filter(c => c.href !== "/flota")

    const colorClasses: Record<string, { ring: string, border: string, bg: string, title: string, iconColor: string, value: string, hint: string }> = {
        blue: { ring: "focus:ring-blue-500", border: "hover:border-blue-500", bg: "bg-blue-50/50", title: "text-blue-700", iconColor: "text-blue-600", value: "text-blue-900", hint: "text-blue-600" },
        amber: { ring: "focus:ring-amber-500", border: "hover:border-amber-500", bg: "bg-amber-50/50", title: "text-amber-700", iconColor: "text-amber-600", value: "text-amber-900", hint: "text-amber-600" },
        red: { ring: "focus:ring-red-500", border: "hover:border-red-500", bg: "bg-red-50/50", title: "text-red-700", iconColor: "text-red-600", value: "text-red-900", hint: "text-red-600" },
        green: { ring: "focus:ring-green-500", border: "hover:border-green-500", bg: "bg-green-50/50", title: "text-green-700", iconColor: "text-green-600", value: "text-green-900", hint: "text-green-600" },
    }

    return (
        <div className={`grid gap-6 ${cards.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {cards.map(card => {
                const c = colorClasses[card.color]
                const Icon = card.icon
                return (
                    <Link key={card.href} href={card.href} className={`block focus:outline-none focus:ring-2 rounded-xl ${c.ring}`}>
                        <Card className={`transition-colors cursor-pointer h-full ${c.bg} ${card.active ? `border-2 ${c.border.replace('hover:', '')} shadow-sm` : c.border}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className={`text-sm font-medium ${c.title}`}>{card.label}</CardTitle>
                                <Icon className={`h-4 w-4 ${c.iconColor}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${c.value}`}>{card.count}</div>
                                <p className={`text-xs mt-1 ${c.hint}`}>{card.hint}</p>
                            </CardContent>
                        </Card>
                    </Link>
                )
            })}
        </div>
    )
}
