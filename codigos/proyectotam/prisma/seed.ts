import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpieza y carga de base de datos (Seeding)...')

  // Borrar en orden inverso de dependencias para evitar errores de claves foráneas
  console.log('Limpiando tablas existentes...')
  await prisma.auditLog.deleteMany()
  await prisma.activityMaterialConsumption.deleteMany()
  await prisma.vehicleChecklistItem.deleteMany()
  await prisma.vehicleActivity.deleteMany()
  await prisma.supplyBatch.deleteMany()
  await prisma.supply.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.user.deleteMany()

  // 1. Cargar Usuarios por Roles
  console.log('Cargando usuarios...')
  const USERS_TO_SEED = [
    {
      name: 'Project',
      lastName: 'Manager',
      email: 'manager@manager.com',
      password: 'manager123',
      role: 'project_manager',
    },
    {
      name: 'Supervisor',
      lastName: 'TAM',
      email: 'supervisor@sup.com',
      password: 'supervisor123',
      role: 'supervisor',
    },
    {
      name: 'Encargado',
      lastName: 'Deposito',
      email: 'deposit@dep.com',
      password: 'deposit123',
      role: 'deposit_manager',
    },
    {
      name: 'Juan',
      lastName: 'Pérez',
      email: 'operator1@op.com',
      password: 'operator123',
      role: 'operator',
    },
    {
      name: 'Carlos',
      lastName: 'Gómez',
      email: 'operator2@op.com',
      password: 'operator123',
      role: 'operator',
    },
    {
      name: 'Luis',
      lastName: 'Rodríguez',
      email: 'operator3@op.com',
      password: 'operator123',
      role: 'operator',
    },
    {
      name: 'Operario',
      lastName: 'Línea',
      email: 'operator@op.com',
      password: 'operator123',
      role: 'operator',
    },
  ]

  const seededUsers = []
  for (const u of USERS_TO_SEED) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    const seeded = await prisma.user.create({
      data: {
        name: u.name,
        lastName: u.lastName,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        status: 'active',
      }
    })
    seededUsers.push(seeded)
    console.log(`Creado usuario: ${u.email} (${u.role})`)
  }

  const op1 = seededUsers.find(u => u.email === 'operator1@op.com')!
  const op2 = seededUsers.find(u => u.email === 'operator2@op.com')!
  const op3 = seededUsers.find(u => u.email === 'operator3@op.com')!

  // 2. Cargar Actividades del Catálogo
  console.log('Cargando catálogo de actividades...')
  const INITIAL_ACTIVITIES = [
    { id: 'act_1', name: 'Actividades previas y recepción de torres', suggested_order: 1 },
    { id: 'act_2', name: 'Retrabajo soporte placas PCU', suggested_order: 2 },
    { id: 'act_3', name: 'Enmascarado de torre parte exterior', suggested_order: 3 },
    { id: 'act_4', name: 'Pintado de Torre y componentes', suggested_order: 4 },
    { id: 'act_5', name: 'Procedimientos en la Torre', suggested_order: 5 },
    { id: 'act_6', name: 'Procedimientos en Batea', suggested_order: 6 },
  ]

  for (const act of INITIAL_ACTIVITIES) {
    await prisma.activity.create({ data: act })
  }

  // 3. Cargar Checklist Items por Actividad
  console.log('Cargando items de checklist...')
  const INITIAL_CHECKLISTS = [
    { id: 'chk_1_1', activity_id: 'act_1', description: 'Inspección Torre Mecanizada' },
    { id: 'chk_1_2', activity_id: 'act_1', description: 'Solicitar entrega de componentes reprogramados' },
    { id: 'chk_1_3', activity_id: 'act_1', description: 'Retrabajo BOSSES soporte pantalla y manillar' },

    { id: 'chk_2_1', activity_id: 'act_2', description: 'Retrabajo soporte placas PCU' },
    { id: 'chk_2_2', activity_id: 'act_2', description: 'Soldar soporte de pala corazón de tres piezas' },
    { id: 'chk_2_3', activity_id: 'act_2', description: 'Agrandar orificios de junta hermeticidad de frontis' },
    { id: 'chk_2_4', activity_id: 'act_2', description: 'Re-instalación de soportes de cañones de ametralladoras' },

    { id: 'chk_3_1', activity_id: 'act_3', description: 'Enmascarado de torre parte exterior' },
    { id: 'chk_3_2', activity_id: 'act_3', description: 'Enmascarado de Cñ y linea elástica' },
    { id: 'chk_3_3', activity_id: 'act_3', description: 'Enmascarado de funda térmica, frontis, evacuador' },

    { id: 'chk_4_1', activity_id: 'act_4', description: 'Pintado de Torre, Cñ, frontis, funda térmica' },
    { id: 'chk_4_2', activity_id: 'act_4', description: 'Limpieza y engrase de corona' },
    { id: 'chk_4_3', activity_id: 'act_4', description: 'Instalación de corona en posa-torre' },

    { id: 'chk_5_1', activity_id: 'act_5', description: 'Colocación de Corona Giratoria' },
    { id: 'chk_5_2', activity_id: 'act_5', description: 'Colocación del cañón y fijación con percha' },
    { id: 'chk_5_3', activity_id: 'act_5', description: 'Instalación de piso de torre y traversa' },

    { id: 'chk_6_1', activity_id: 'act_6', description: 'Recepción y control de Batea ya recorrida' },
    { id: 'chk_6_2', activity_id: 'act_6', description: 'Mecanizar agujeros para APU y DTV' },
    { id: 'chk_6_3', activity_id: 'act_6', description: 'Soldar soportes de APU y protección' },
  ]

  for (const chk of INITIAL_CHECKLISTS) {
    await prisma.checklistItem.create({ data: chk })
  }

  // 4. Cargar Vehículos Blindados
  console.log('Cargando vehículos blindados...')
  const v1 = await prisma.vehicle.create({ data: { ni: 'TAM-2C-101', origen_unit: 'RC Tan 8 (Magdalena)', status: 'in_plant' } })
  const v2 = await prisma.vehicle.create({ data: { ni: 'TAM-2C-102', origen_unit: 'RC Tan 10 (Azul)', status: 'in_plant' } })
  const v3 = await prisma.vehicle.create({ data: { ni: 'TAM-2C-103', origen_unit: 'RC Tan 2 (Olavarría)', status: 'in_plant' } })
  const v4 = await prisma.vehicle.create({ data: { ni: 'TAM-2C-104', origen_unit: 'RC Tan 1 (Villaguay)', status: 'out_of_service' } })
  const v5 = await prisma.vehicle.create({ data: { ni: 'TAM-2C-105', origen_unit: 'RC Tan 6 (Concordia)', status: 'in_service' } })

  const vehicles = [v1, v2, v3, v4, v5]

  // 5. Cargar Actividades de Vehículo (Mapeo de avance de tareas)
  console.log('Inicializando etapas de producción para vehículos...')
  const createdVehicleActivities: any[] = []
  for (const v of vehicles) {
    for (const act of INITIAL_ACTIVITIES) {
      let status = 'pending'
      if (v.status === 'in_service') {
        status = 'completed'
      } else if (v.ni === 'TAM-2C-101') {
        if (act.id === 'act_1') status = 'completed'
        else if (act.id === 'act_2') status = 'in_progress'
      } else if (v.ni === 'TAM-2C-102') {
        if (act.id === 'act_1' || act.id === 'act_2') status = 'completed'
        else if (act.id === 'act_3') status = 'pending_review'
      }

      const va = await prisma.vehicleActivity.create({
        data: {
          vehicle_id: v.id,
          activity_id: act.id,
          status: status,
          started_at: status !== 'pending' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) : null,
          completed_at: status === 'completed' || status === 'pending_review' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) : null,
          verified_at: status === 'completed' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) : null
        }
      })
      createdVehicleActivities.push(va)
    }
  }

  const getVActId = (vehicleId: string, activityId: string) => {
    return createdVehicleActivities.find(va => va.vehicle_id === vehicleId && va.activity_id === activityId)?.id || ""
  }

  // 6. Cargar Materiales en Catálogo de Insumos
  console.log('Cargando materiales en catálogo de insumos...')
  const s1 = await prisma.supply.create({ data: { name: 'Funda Térmica de Cañón', family: 'Cañón', description: 'Funda protectora térmica para cañón de 105mm' } })
  const s2 = await prisma.supply.create({ data: { name: 'Placa PCU', family: 'Torre', description: 'Placa electrónica de control de unidad de potencia de torre' } })
  const s3 = await prisma.supply.create({ data: { name: 'Corona de Giro de Torre', family: 'Corona', description: 'Corona giratoria de rodamiento para torre TAM' } })
  const s4 = await prisma.supply.create({ data: { name: 'Pernos de Alta Resistencia M16', family: 'Tornillería', description: 'Pernos de alta resistencia para fijación de corona' } })
  const s5 = await prisma.supply.create({ data: { name: 'Evacuador de Gases', family: 'Cañón', description: 'Evacuador de gases para cañón L7 de 105mm' } })
  const s6 = await prisma.supply.create({ data: { name: 'Junta de Hermeticidad Frontis', family: 'Torre', description: 'Junta de hermeticidad de goma para frontis de torre' } })

  // 7. Cargar Lotes de Insumos (Stock en Depósito)
  console.log('Cargando lotes de insumos (Stock)...')
  const b1 = await prisma.supplyBatch.create({
    data: {
      supply_id: s1.id,
      batch_number: 'LOTE-FT-2026',
      serial_numbers: ['FT-SN-102', 'FT-SN-103'], // FT-SN-101 consumida
      available_quantity: 2,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    }
  })
  const b2 = await prisma.supplyBatch.create({
    data: {
      supply_id: s2.id,
      batch_number: 'LOTE-PCU-2026',
      serial_numbers: ['PCU-SN-503', 'PCU-SN-504'], // PCU-SN-501 y 502 consumidas
      available_quantity: 2,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25)
    }
  })
  const b3 = await prisma.supplyBatch.create({
    data: {
      supply_id: s3.id,
      batch_number: 'LOTE-COR-2026',
      serial_numbers: ['COR-SN-202'], // COR-SN-201 consumida
      available_quantity: 1,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)
    }
  })
  const b4 = await prisma.supplyBatch.create({
    data: {
      supply_id: s4.id,
      batch_number: 'LOTE-PER-2026',
      serial_numbers: [],
      available_quantity: 80, // Se usaron 20 (12 en V2, 8 en V3)
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
    }
  })
  const b5 = await prisma.supplyBatch.create({
    data: {
      supply_id: s5.id,
      batch_number: 'LOTE-EV-2026',
      serial_numbers: ['EV-SN-302'], // EV-SN-301 consumida
      available_quantity: 1,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
    }
  })
  const b6 = await prisma.supplyBatch.create({
    data: {
      supply_id: s6.id,
      batch_number: 'LOTE-JUN-2026',
      serial_numbers: [],
      available_quantity: 16, // Se usaron 4 (2 en V1, 2 en V3)
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
    }
  })

  // 8. Cargar Consumos / Instalación de Materiales
  console.log('Cargando consumos de insumos por parte de operarios en blindados...')
  const consumptionsToSeed = [
    {
      vehicle_activity_id: getVActId(v1.id, 'act_1'),
      supply_batch_id: b1.id,
      serial_number: 'FT-SN-101',
      quantity_used: 1,
      operator_id: op1.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
    },
    {
      vehicle_activity_id: getVActId(v1.id, 'act_1'),
      supply_batch_id: b6.id,
      serial_number: null,
      quantity_used: 2,
      operator_id: op1.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
    },
    {
      vehicle_activity_id: getVActId(v1.id, 'act_2'),
      supply_batch_id: b2.id,
      serial_number: 'PCU-SN-501',
      quantity_used: 1,
      operator_id: op2.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    },
    {
      vehicle_activity_id: getVActId(v2.id, 'act_1'),
      supply_batch_id: b4.id,
      serial_number: null,
      quantity_used: 12,
      operator_id: op3.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    },
    {
      vehicle_activity_id: getVActId(v2.id, 'act_5'),
      supply_batch_id: b3.id,
      serial_number: 'COR-SN-201',
      quantity_used: 1,
      operator_id: op1.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      vehicle_activity_id: getVActId(v2.id, 'act_5'),
      supply_batch_id: b2.id,
      serial_number: 'PCU-SN-502',
      quantity_used: 1,
      operator_id: op3.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      vehicle_activity_id: getVActId(v3.id, 'act_1'),
      supply_batch_id: b4.id,
      serial_number: null,
      quantity_used: 8,
      operator_id: op2.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
    },
    {
      vehicle_activity_id: getVActId(v3.id, 'act_1'),
      supply_batch_id: b6.id,
      serial_number: null,
      quantity_used: 2,
      operator_id: op2.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
    },
    {
      vehicle_activity_id: getVActId(v5.id, 'act_5'),
      supply_batch_id: b5.id,
      serial_number: 'EV-SN-301',
      quantity_used: 1,
      operator_id: op3.id,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
    }
  ]

  for (const c of consumptionsToSeed) {
    await prisma.activityMaterialConsumption.create({ data: c })
  }

  // 9. Cargar Tareas Completadas del Checklist (Para dar más realismo a la vista de planta)
  console.log('Completando algunos checklists del sistema...')
  const chk1 = await prisma.checklistItem.findMany({ where: { activity_id: 'act_1' } })
  const va1_act1 = getVActId(v1.id, 'act_1')
  for (const item of chk1) {
    await prisma.vehicleChecklistItem.create({
      data: {
        vehicle_activity_id: va1_act1,
        checklist_id: item.id,
        is_completed: true,
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
        operator_id: op1.id
      }
    })
  }

  console.log('Carga de base de datos terminada con éxito.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
