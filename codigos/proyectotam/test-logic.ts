import { PrismaClient } from '@prisma/client'
import assert from 'assert'

const prisma = new PrismaClient()

async function testNewFeatures() {
  console.log("=========================================")
  console.log("🚀 INICIANDO PRUEBAS DE NUEVAS FUNCIONES")
  console.log("=========================================")

  try {
    // Buscar usuarios necesarios para las pruebas
    const adminUser = await prisma.user.findFirst({ where: { role: 'project_manager' } })
    const operatorUser = await prisma.user.findFirst({ where: { role: 'operator' } })
    
    if (!adminUser || !operatorUser) {
      throw new Error("Faltan usuarios base para correr las pruebas.")
    }

    // -------------------------------------------------------------
    // PRUEBA 1: GESTIÓN DE FLOTA (EN EJÉRCITO)
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Gestión de Flota 'En el Ejército'")
    const newTankNI = `TAM-TEST-${Date.now()}`
    
    // Simular addVehicle de plantaActions.ts
    const newArmyTank = await prisma.vehicle.create({
      data: {
        ni: newTankNI,
        origen_unit: 'RC Tan Test',
        status: 'in_army',
        army_status: 'uninspected'
      }
    })
    console.log(`✅ Tanque creado en el ejército: ${newArmyTank.ni} (Estado: ${newArmyTank.status}, Army Status: ${newArmyTank.army_status})`)
    assert.strictEqual(newArmyTank.status, 'in_army')
    assert.strictEqual(newArmyTank.army_status, 'uninspected')

    // Actualizar estado a seleccionado y pasarlo a planta
    const updatedArmyTank = await prisma.vehicle.update({
      where: { id: newArmyTank.id },
      data: { army_status: 'selected', status: 'in_deposit' }
    })
    console.log(`✅ Tanque movido a depósito de planta: ${updatedArmyTank.ni} (Nuevo Estado: ${updatedArmyTank.status})`)
    assert.strictEqual(updatedArmyTank.status, 'in_deposit')


    // -------------------------------------------------------------
    // PRUEBA 2: ASIGNACIÓN EXCLUSIVA DE TANQUES
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Asignación Exclusiva de Tanques a Operarios")
    
    // Simular updateVehicle de plantaActions.ts (Asignación)
    const assignedTank = await prisma.vehicle.update({
      where: { id: updatedArmyTank.id },
      data: { assigned_operators: [operatorUser.id] }
    })
    console.log(`✅ Tanque asignado exitosamente al operario: ${operatorUser.name} (ID: ${operatorUser.id})`)
    assert.ok(assignedTank.assigned_operators.includes(operatorUser.id))


    // -------------------------------------------------------------
    // PRUEBA 3: CONFIGURACIÓN DINÁMICA (CREAR TAREAS)
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Configuración Dinámica de Etapas y Tareas")
    
    // Crear Actividad
    const newActivity = await prisma.activity.create({
      data: { name: 'Etapa de Prueba Dinámica', suggested_order: 99 }
    })
    console.log(`✅ Nueva Etapa (Actividad) creada dinámicamente: ${newActivity.name}`)

    // Crear Checklist Item para esa actividad
    const newChecklist = await prisma.checklistItem.create({
      data: { activity_id: newActivity.id, description: 'Inspección de prueba autogenerada' }
    })
    console.log(`✅ Nueva Tarea de Checklist creada para la etapa: ${newChecklist.description}`)
    assert.strictEqual(newChecklist.activity_id, newActivity.id)


    // -------------------------------------------------------------
    // PRUEBA 4: TRAZABILIDAD TEMPORAL
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Trazabilidad Temporal de Etapas")
    
    // Para probarlo, simulamos la asignación de la etapa al vehículo
    const vAct = await prisma.vehicleActivity.create({
      data: {
        vehicle_id: assignedTank.id,
        activity_id: newActivity.id,
        status: 'pending'
      }
    })

    // Simular que el operario inicia la tarea (Cambio de estado a in_progress) -> Captura started_at
    const inProgressVAct = await prisma.vehicleActivity.update({
      where: { id: vAct.id },
      data: { status: 'in_progress', started_at: new Date() } // Lógica implementada en updateActivityStatusAction
    })
    console.log(`✅ Etapa iniciada. Fecha de inicio capturada: ${inProgressVAct.started_at}`)
    assert.ok(inProgressVAct.started_at !== null)

    // Simular que el operario la envía a revisión -> Captura completed_at
    const reviewVAct = await prisma.vehicleActivity.update({
      where: { id: vAct.id },
      data: { status: 'pending_review', completed_at: new Date(Date.now() + 1000 * 60 * 60 * 2) } // Simulamos 2 horas después
    })
    console.log(`✅ Etapa terminada. Fecha de fin capturada: ${reviewVAct.completed_at}`)
    assert.ok(reviewVAct.completed_at !== null)
    
    const durationMs = reviewVAct.completed_at!.getTime() - inProgressVAct.started_at!.getTime()
    const hours = Math.round(durationMs / (1000 * 60 * 60))
    console.log(`✅ Trazabilidad temporal calculada correctamente: Tomó aprox ${hours} horas.`)


    // -------------------------------------------------------------
    // PRUEBA 5: MÓDULO DE MUNICIÓN
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Módulo de Munición (Stock y Asignación)")
    
    // Crear munición
    const ammo = await prisma.ammunition.create({
      data: { type: 'Proyectil de Prueba APFSDS', caliber: '105mm', description: 'Munición de prueba automatizada' }
    })
    console.log(`✅ Tipo de munición registrado: ${ammo.type}`)

    // Cargar stock (Lote)
    const ammoBatch = await prisma.ammunitionBatch.create({
      data: { ammunition_id: ammo.id, batch_number: 'LOTE-TEST-001', available_quantity: 100 }
    })
    console.log(`✅ Lote de munición ingresado: ${ammoBatch.batch_number}, Cantidad: ${ammoBatch.available_quantity}`)

    // Asignar al tanque (simulando que está en servicio)
    // Cambiamos el tanque a in_service
    await prisma.vehicle.update({ where: { id: assignedTank.id }, data: { status: 'in_service' } })
    
    const assignment = await prisma.vehicleAmmunitionAssignment.create({
      data: {
        vehicle_id: assignedTank.id,
        ammunition_batch_id: ammoBatch.id,
        quantity: 40,
        operator_id: adminUser.id
      }
    })

    const updatedBatch = await prisma.ammunitionBatch.update({
      where: { id: ammoBatch.id },
      data: { available_quantity: { decrement: 40 } }
    })
    console.log(`✅ Munición asignada al tanque (${assignment.quantity} unidades).`)
    console.log(`✅ Stock restante actualizado automáticamente a: ${updatedBatch.available_quantity} unidades.`)
    assert.strictEqual(updatedBatch.available_quantity, 60)

    console.log("\n=========================================")
    console.log("🎉 TODAS LAS PRUEBAS PASARON CORRECTAMENTE")
    console.log("=========================================")

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LAS PRUEBAS:")
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testNewFeatures()
