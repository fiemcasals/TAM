"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store/app"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Package, Plus, Search, Trash2, Layers, List, Edit2, ArrowUpDown } from "lucide-react"
import type { SupplyBatch } from "@/types"

export default function DepositoPage() {
    const {
        supplies, supplyBatches,
        updateSupply, updateBatch, deleteBatch
    } = useAppStore()

    const currentUser = useAuthStore(state => state.currentUser)
    const canManageDeposit = currentUser?.role === 'deposit_manager' || currentUser?.role === 'project_manager'

    // Quick filtering
    const [searchTerm, setSearchTerm] = useState("")

    const [isStockModalOpen, setIsStockModalOpen] = useState(false)
    const [stockQuantity, setStockQuantity] = useState(1) // For dynamic serial input generation

    const [isStockEditModalOpen, setIsStockEditModalOpen] = useState(false)
    const [stockToEdit, setStockToEdit] = useState<SupplyBatch | null>(null)

    // Serial detail view modal
    const [viewSerialsModal, setViewSerialsModal] = useState<SupplyBatch | null>(null)

    // Inventory Table Sorting
    const [inventorySortConfig, setInventorySortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    // Handlers
    const handleAddStock = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)

        const categoryName = (fd.get("category") as string).trim()
        const supplyName = (fd.get("supplyName") as string).trim()
        const description = (fd.get("description") as string)?.trim() || ""
        const quantity = Number(fd.get("quantity")) || 1
        const batchNumber = (fd.get("batchNumber") as string).trim()

        // Extract array of multiple serials from the dynamic inputs
        const serials: string[] = []
        for (let i = 0; i < quantity; i++) {
            const s = (fd.get(`serialNumber_${i}`) as string)?.trim()
            if (s) serials.push(s)
        }

        // Simplify for the user: Find or create the supply base implicitly
        let supplyId = ""
        const existingSupply = supplies.find(s =>
            s.name.toLowerCase() === supplyName.toLowerCase() &&
            (s.family || "").toLowerCase() === categoryName.toLowerCase()
        )

        const { addSupply: appAddSupply, addBatch: appAddBatch } = useAppStore.getState()

        if (existingSupply) {
            supplyId = existingSupply.id
            if (!existingSupply.description && description) {
                updateSupply(existingSupply.id, { name: existingSupply.name, family: existingSupply.family || "", description })
            }
        } else {
            const newId = await appAddSupply(supplyName, description, categoryName || "General")
            if (newId) supplyId = newId
        }

        if (supplyId) {
            await appAddBatch(supplyId, batchNumber || undefined, serials, quantity)
        }
        setIsStockModalOpen(false)
        setStockQuantity(1)
    }

    const handleEditStock = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!stockToEdit) return
        const fd = new FormData(e.currentTarget)

        const categoryName = (fd.get("category") as string).trim()
        const supplyName = (fd.get("supplyName") as string).trim()
        const description = (fd.get("description") as string)?.trim() || ""
        const quantity = Number(fd.get("quantity")) || 1
        const batchNumber = (fd.get("batchNumber") as string).trim()

        // Extract array of multiple serials from the dynamic inputs
        const serials: string[] = []
        for (let i = 0; i < quantity; i++) {
            const s = (fd.get(`serialNumber_${i}`) as string)?.trim()
            if (s) serials.push(s)
        }

        // Update supply base (category, name, description) if changed
        updateSupply(stockToEdit.supply_id, { name: supplyName, family: categoryName, description })
        // Update batch
        updateBatch(stockToEdit.id, {
            batch_number: batchNumber || undefined,
            available_quantity: quantity,
            serial_numbers: serials
        })

        setIsStockEditModalOpen(false)
        setStockToEdit(null)
    }

    const handleDeleteBatch = async (id: string, name: string, batchNumber?: string) => {
        const batchLabel = batchNumber ? `Lote ${batchNumber}` : "Lote sin número"
        if (confirm(`¿Está seguro de que desea eliminar el stock de "${name}" (${batchLabel})?`)) {
            await deleteBatch(id)
            alert(`El stock de "${name}" (${batchLabel}) ha sido borrado correctamente del sistema.`)
        }
    }

    const requestInventorySort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (inventorySortConfig && inventorySortConfig.key === key && inventorySortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setInventorySortConfig({ key, direction })
    }

    const sortedInventory = [...supplyBatches].sort((a, b) => {
        if (!inventorySortConfig) return 0

        const supplyA = supplies.find(s => s.id === a.supply_id)
        const supplyB = supplies.find(s => s.id === b.supply_id)

        let valueA: any = ''
        let valueB: any = ''

        switch (inventorySortConfig.key) {
            case 'category':
                valueA = supplyA?.family || ''
                valueB = supplyB?.family || ''
                break
            case 'name':
                valueA = supplyA?.name || ''
                valueB = supplyB?.name || ''
                break
            case 'quantity':
                valueA = a.available_quantity
                valueB = b.available_quantity
                break
            case 'batch':
                valueA = a.batch_number || ''
                valueB = b.batch_number || ''
                break
            default:
                break
        }

        if (valueA < valueB) return inventorySortConfig.direction === 'asc' ? -1 : 1
        if (valueA > valueB) return inventorySortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Insumos en Depósito</h1>
                    <p className="text-slate-500 mt-2">Administración del stock de insumos y materiales.</p>
                </div>
            </div>

            <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Buscar insumo o categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                        {canManageDeposit && (
                            <Button onClick={() => setIsStockModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" /> Ingresar Insumo
                            </Button>
                        )}
                    </div>

                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle>Insumos Disponibles</CardTitle>
                            <CardDescription>Listado directo de todos los insumos almacenados y sus cantidades.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="pl-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestInventorySort('category')}>
                                            <div className="flex items-center gap-1">Categoría / Familia <ArrowUpDown className="h-3 w-3" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestInventorySort('name')}>
                                            <div className="flex items-center gap-1">Nombre del Insumo / Material <ArrowUpDown className="h-3 w-3" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestInventorySort('quantity')}>
                                            <div className="flex items-center gap-1">Cantidad <ArrowUpDown className="h-3 w-3" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestInventorySort('batch')}>
                                            <div className="flex items-center gap-1">N° Lote <ArrowUpDown className="h-3 w-3" /></div>
                                        </TableHead>
                                        <TableHead className="text-right pr-6">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedInventory.map((batch) => {
                                        const supply = supplies.find(s => s.id === batch.supply_id)
                                        const category = supply?.family || "Sin Categoría";
                                        const name = supply?.name || "Desconocido";

                                        if (searchTerm &&
                                            !name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            !category.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            !(batch.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase())
                                        ) return null;

                                        return (
                                            <TableRow key={batch.id}>
                                                <TableCell className="pl-6 font-medium text-slate-900">
                                                    <Badge variant="outline" className="bg-slate-50">{category}</Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-slate-700">{name}</TableCell>
                                                <TableCell className={`font-bold text-lg ${batch.available_quantity > 0 ? 'text-blue-700' : 'text-red-500'}`}>
                                                    <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => (batch.serial_numbers && batch.serial_numbers.length > 0) && setViewSerialsModal(batch)}>
                                                        {batch.available_quantity} <span className="text-xs font-normal text-slate-500">uds</span>
                                                        {batch.serial_numbers && batch.serial_numbers.length > 0 && <List className="h-4 w-4 text-blue-500" data-title="Ver series registradas" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500">{batch.batch_number || '-'}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {canManageDeposit ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => { setStockToEdit(batch); setStockQuantity(batch.available_quantity); setIsStockEditModalOpen(true); }} className="text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBatch(batch.id, name, batch.batch_number)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : <span className="text-xs text-slate-400">Solo Lectura</span>}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}

                                    {supplyBatches.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Layers className="h-8 w-8 text-slate-300" />
                                                    No hay insumos almacenados. Registre un nuevo ingreso.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

            {/* MODALS SECTION */}

            {/* 2. Modal Ingreso Stock Multi-Series */}
            {isStockModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white shadow-2xl w-screen h-screen max-w-none overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                Agregar Insumos al Depósito
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Llene los datos. Las series se desplegarán según la cantidad.</p>
                        </div>
                        <form onSubmit={handleAddStock} className="p-6 space-y-4 overflow-y-auto flex-1">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Categoría / Familia</label>
                                <Input
                                    name="category"
                                    list="categories-datalist"
                                    placeholder="Ej: Grupo Motor"
                                    required
                                    autoFocus
                                />
                                <datalist id="categories-datalist">
                                    {Array.from(new Set(supplies.map(s => s.family).filter(Boolean))).map((cat, i) => (
                                        <option key={i} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nombre del Insumo / Material</label>
                                <Input
                                    name="supplyName"
                                    list="supplies-name-datalist"
                                    placeholder="Ej: Caja Motor"
                                    required
                                />
                                <datalist id="supplies-name-datalist">
                                    {supplies.map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Descripción (Opcional)</label>
                                <Input
                                    name="description"
                                    placeholder="Ej: Caja motor con accesorios para TAM 2C"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">N° Lote (Opcional)</label>
                                    <Input name="batchNumber" placeholder="Ej: LTA-99" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Cantidad Total</label>
                                    <Input
                                        name="quantity"
                                        type="number"
                                        min={1}
                                        max={50} // Sanity limit for UI rendering
                                        value={stockQuantity}
                                        onChange={(e) => setStockQuantity(Math.min(50, Math.max(1, Number(e.target.value))))}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Dynamic Serial Numbers List */}
                            {stockQuantity > 0 && stockQuantity <= 50 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Números de Serie Individuales (Opcional)</p>
                                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 pb-2">
                                        {Array.from({ length: stockQuantity }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="text-xs font-medium text-slate-400 w-8">#{i + 1}</div>
                                                <Input
                                                    name={`serialNumber_${i}`}
                                                    placeholder="N° de Serie..."
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 shrink-0">
                                <Button type="button" variant="ghost" onClick={() => { setIsStockModalOpen(false); setStockQuantity(1); }}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-semibold px-6">Agregar Stock</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2.b Modal Editar Stock */}
            {isStockEditModalOpen && stockToEdit && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white shadow-2xl w-screen h-screen max-w-none overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                Editar Entrada de Stock
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Modifique los datos o números de serie del insumo.</p>
                        </div>
                        <form onSubmit={handleEditStock} className="p-6 space-y-4 overflow-y-auto flex-1">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Categoría / Familia</label>
                                <Input
                                    name="category"
                                    list="categories-datalist-edit"
                                    defaultValue={supplies.find(s => s.id === stockToEdit.supply_id)?.family || ""}
                                    required
                                />
                                <datalist id="categories-datalist-edit">
                                    {Array.from(new Set(supplies.map(s => s.family).filter(Boolean))).map((cat, i) => (
                                        <option key={i} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nombre del Insumo / Material</label>
                                <Input
                                    name="supplyName"
                                    list="supplies-name-datalist-edit"
                                    defaultValue={supplies.find(s => s.id === stockToEdit.supply_id)?.name || ""}
                                    required
                                />
                                <datalist id="supplies-name-datalist-edit">
                                    {supplies.map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Descripción (Opcional)</label>
                                <Input
                                    name="description"
                                    defaultValue={supplies.find(s => s.id === stockToEdit.supply_id)?.description || ""}
                                    placeholder="Ej: Caja motor con accesorios para TAM 2C"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">N° Lote (Opcional)</label>
                                    <Input name="batchNumber" defaultValue={stockToEdit.batch_number} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Cantidad Total</label>
                                    <Input
                                        name="quantity"
                                        type="number"
                                        min={1}
                                        max={50} // Sanity limit for UI rendering
                                        value={stockQuantity}
                                        onChange={(e) => setStockQuantity(Math.min(50, Math.max(1, Number(e.target.value))))}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Dynamic Serial Numbers List */}
                            {stockQuantity > 0 && stockQuantity <= 50 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Números de Serie Individuales (Opcional)</p>
                                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 pb-2">
                                        {Array.from({ length: stockQuantity }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="text-xs font-medium text-slate-400 w-8">#{i + 1}</div>
                                                <Input
                                                    name={`serialNumber_${i}`}
                                                    defaultValue={stockToEdit.serial_numbers?.[i] || ""}
                                                    placeholder="N° de Serie..."
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 shrink-0">
                                <Button type="button" variant="ghost" onClick={() => { setIsStockEditModalOpen(false); setStockToEdit(null); }}>Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-semibold px-6">Guardar Cambios</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Detail View Serials Modal */}
            {viewSerialsModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white shadow-2xl w-screen h-screen max-w-none overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">Series Almacenadas</h2>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {viewSerialsModal.serial_numbers && viewSerialsModal.serial_numbers.length > 0 ? (
                                <ul className="space-y-2">
                                    {viewSerialsModal.serial_numbers.map((sn, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                                            <span className="text-slate-500 text-xs font-medium">Unidad #{idx + 1}</span>
                                            <span className="text-slate-900 font-mono text-sm">{sn}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500 text-center">No se cargaron series para estos insumos.</p>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button variant="outline" onClick={() => setViewSerialsModal(null)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
