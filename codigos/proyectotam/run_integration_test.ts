import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testFlow() {
  console.log("=== INICIANDO PRUEBA DE INTEGRACIÓN DEL SISTEMA ===")
  const report: string[] = []
  
  try {
    // 1. Limpieza de datos de prueba previos (para evitar conflictos de unicidad)
    console.log("Limpiando datos de prueba anteriores...")
    await prisma.activityMaterialConsumption.deleteMany({ where: { operator_id: 'test_operator_id' } })
    await prisma.vehicleChecklistItem.deleteMany({ where: { operator_id: 'test_operator_id' } })
    
    // Obtener id de vehículos de prueba anteriores
    const oldVehicles = await prisma.vehicle.findMany({ where: { ni: 'TAM-2C-TEST' } })
    for (const v of oldVehicles) {
      await prisma.vehicleActivity.deleteMany({ where: { vehicle_id: v.id } })
    }
    await prisma.vehicle.deleteMany({ where: { ni: 'TAM-2C-TEST' } })
    await prisma.user.deleteMany({ where: { email: { in: ['pm@test.com', 'supervisor@test.com', 'deposit@test.com', 'operator@test.com'] } } })
    
    const oldSupplies = await prisma.supply.findMany({ where: { name: 'Repuesto Test A' } })
    for (const s of oldSupplies) {
      await prisma.supplyBatch.deleteMany({ where: { supply_id: s.id } })
    }
    await prisma.supply.deleteMany({ where: { name: 'Repuesto Test A' } })
    
    report.push("✓ Limpieza de datos de prueba anteriores exitosa.")

    // 2. Creación de Usuarios con todos los roles
    console.log("Creando usuarios de prueba...")
    const pass = await bcrypt.hash('testpass123', 10)
    
    const pm = await prisma.user.create({
      data: { name: 'Test PM', email: 'pm@test.com', password: pass, role: 'project_manager' }
    })
    const supervisor = await prisma.user.create({
      data: { name: 'Test Supervisor', email: 'supervisor@test.com', password: pass, role: 'supervisor' }
    })
    const deposit = await prisma.user.create({
      data: { name: 'Test Deposit', email: 'deposit@test.com', password: pass, role: 'deposit_manager' }
    })
    const operator = await prisma.user.create({
      data: { name: 'Test Operator', email: 'operator@test.com', password: pass, role: 'operator' }
    })
    report.push("✓ Creación de usuarios con todos los roles exitosa.")

    // 3. Creación de Tanques (Vehículos)
    console.log("Creando tanque de prueba...")
    const vehicle = await prisma.vehicle.create({
      data: { ni: 'TAM-2C-TEST', origen_unit: 'RC Tan 8', status: 'in_plant' }
    })
    report.push("✓ Creación del vehículo blindado de prueba exitosa.")

    // 4. Inicialización de Actividades para el tanque
    console.log("Inicializando catálogo de actividades para el tanque...")
    const activities = await prisma.activity.findMany()
    if (activities.length === 0) {
      throw new Error("No hay actividades registradas en el catálogo. Ejecuta seed primero.")
    }
    
    await prisma.vehicleActivity.createMany({
      data: activities.map(act => ({
        vehicle_id: vehicle.id,
        activity_id: act.id,
        status: 'pending'
      }))
    })
    report.push("✓ Vinculación de actividades de modernización al vehículo exitosa.")

    // 5. Creación de Repuestos y Lotes
    console.log("Creando insumos y lotes en depósito...")
    const supply = await prisma.supply.create({
      data: { name: 'Repuesto Test A', description: 'Insumo de prueba', family: 'Mecánica' }
    })
    const batch = await prisma.supplyBatch.create({
      data: {
        supply_id: supply.id,
        batch_number: 'BATCH-TEST-99',
        serial_numbers: ['SN-TEST-001', 'SN-TEST-002'],
        available_quantity: 2
      }
    })
    report.push("✓ Registro de insumos y lotes con trazabilidad de series exitosa.")

    // 6. Registro de Actividades en Planta (Operario completa checklist y consume material)
    console.log("Simulando trabajo de operario en planta...")
    // Obtener la primera actividad de vehículo creada
    const vActivity = await prisma.vehicleActivity.findFirst({
      where: { vehicle_id: vehicle.id }
    })
    if (!vActivity) throw new Error("No se encontraron actividades del vehículo.")

    // Obtener el primer checklist para esa actividad
    const checklistItem = await prisma.checklistItem.findFirst({
      where: { activity_id: vActivity.activity_id }
    })
    if (!checklistItem) throw new Error("No se encontraron items de checklist.")

    // 6a. Completar Checklist
    await prisma.vehicleChecklistItem.create({
      data: {
        vehicle_activity_id: vActivity.id,
        checklist_id: checklistItem.id,
        is_completed: true,
        completed_at: new Date(),
        operator_id: 'test_operator_id' // simulando
      }
    })
    report.push("✓ Simulación: Operario completa item del checklist de montaje exitosa.")

    // 6b. Consumir Repuesto con Serie
    await prisma.$transaction([
      prisma.supplyBatch.update({
        where: { id: batch.id },
        data: {
          available_quantity: batch.available_quantity - 1,
          serial_numbers: ['SN-TEST-002'] // Queda el 002
        }
      }),
      prisma.activityMaterialConsumption.create({
        data: {
          vehicle_activity_id: vActivity.id,
          supply_batch_id: batch.id,
          quantity_used: 1,
          operator_id: 'test_operator_id',
          serial_number: 'SN-TEST-001'
        }
      })
    ])
    report.push("✓ Simulación: Consumo de repuesto serializado y descuento de stock exitosa.")

    // 7. Aprobación de Actividad (Supervisor aprueba la etapa)
    console.log("Simulando aprobación de supervisor...")
    await prisma.vehicleActivity.update({
      where: { id: vActivity.id },
      data: {
        status: 'completed',
        supervisor_id: supervisor.id,
        verified_at: new Date()
      }
    })
    report.push("✓ Simulación: Supervisión y aprobación de la etapa de planta exitosa.")

    console.log("\n=== PRUEBA DE INTEGRACIÓN FINALIZADA CON ÉXITO ===")
    return { success: true, report }
  } catch (error) {
    console.error("\n❌ ERROR EN LA PRUEBA:", error)
    return { success: false, report, error: String(error) }
  }
}

testFlow()
  .then(async (res) => {
    await prisma.$disconnect()
    if (!res.success) process.exit(1)
    process.exit(0)
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
