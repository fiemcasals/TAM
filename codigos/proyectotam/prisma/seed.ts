import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpieza y carga de base de datos (Seeding)...')

  // Borrar en orden inverso de dependencias para evitar errores de claves foráneas
  console.log('Limpiando tablas existentes...')
  await prisma.auditLog.deleteMany()
  await prisma.vehicleAmmunitionAssignment.deleteMany()
  await prisma.ammunitionBatch.deleteMany()
  await prisma.ammunition.deleteMany()
  await prisma.activityMaterialConsumption.deleteMany()
  await prisma.vehicleChecklistItem.deleteMany()
  await prisma.vehicleActivity.deleteMany()
  await prisma.supplyBatch.deleteMany()
  await prisma.supply.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.activity.deleteMany()
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
      name: 'Encargado',
      lastName: 'Municion',
      email: 'municion@mun.com',
      password: 'municion123',
      role: 'ammo_manager',
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

  for (const u of USERS_TO_SEED) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    await prisma.user.create({
      data: {
        name: u.name,
        lastName: u.lastName,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        status: 'active',
      }
    })
    console.log(`Creado usuario: ${u.email} (${u.role})`)
  }

  // 2. Cargar Etapas del proceso de modernización (según Proyecto TAM2C.ods)
  console.log('Cargando catálogo de actividades...')
  const INITIAL_ACTIVITIES = [
    { id: 'act_1', name: 'Desmontaje torre-chasis', suggested_order: 1 },
    { id: 'act_2', name: 'Desarme torre', suggested_order: 2 },
    { id: 'act_3', name: 'Cañón', suggested_order: 3 },
    { id: 'act_4', name: 'Torre', suggested_order: 4 },
    { id: 'act_5', name: 'Chasis', suggested_order: 5 },
    { id: 'act_6', name: 'Montaje de la torre en el chasis', suggested_order: 6 },
    { id: 'act_7', name: 'Certificación', suggested_order: 7 },
  ]

  for (const act of INITIAL_ACTIVITIES) {
    await prisma.activity.create({ data: act })
  }

  // 3. Cargar Tareas de Checklist por Etapa (según Proyecto TAM2C.ods)
  // El número entre corchetes es la referencia (WBS) a la tarea en el documento fuente.
  console.log('Cargando items de checklist...')
  const INITIAL_CHECKLISTS = [
    // Etapa 1: Desmontaje torre-chasis
    { id: 'chk_1_1', activity_id: 'act_1', description: 'Desmontaje torre [1.1.1]' },
    { id: 'chk_1_2', activity_id: 'act_1', description: 'Mover chasis al depósito [1.1.2]' },

    // Etapa 2: Desarme torre
    { id: 'chk_2_1', activity_id: 'act_2', description: 'Desarme torre [1.2.1]' },
    { id: 'chk_2_2', activity_id: 'act_2', description: 'Clasificación de material [1.2.2]' },
    { id: 'chk_2_3', activity_id: 'act_2', description: 'Mover el cañón al depósito [1.2.3]' },

    // Etapa 3: Cañón
    { id: 'chk_3_1', activity_id: 'act_3', description: 'Mover el cañon al sector de mantenimiento [1.3.1]' },
    { id: 'chk_3_2', activity_id: 'act_3', description: 'Mantenimiento [1.3.2]' },
    { id: 'chk_3_3', activity_id: 'act_3', description: 'Montaje de los componentes del cañon [1.3.3]' },
    { id: 'chk_3_4', activity_id: 'act_3', description: 'Control de montaje [1.3.4]' },
    { id: 'chk_3_5', activity_id: 'act_3', description: 'Llenado de amortiguador y freno [1.3.5]' },
    { id: 'chk_3_6', activity_id: 'act_3', description: 'Control de carga de fluidos [1.3.6]' },
    { id: 'chk_3_7', activity_id: 'act_3', description: 'Entrega (a DIGID) y control [1.3.7]' },
    { id: 'chk_3_8', activity_id: 'act_3', description: 'Pintura — Empapelado [1.3.8.1]' },
    { id: 'chk_3_9', activity_id: 'act_3', description: 'Pintura — Pintura [1.3.8.2]' },
    { id: 'chk_3_10', activity_id: 'act_3', description: 'Pintura — Cañon listo para montar [1.3.8.3]' },

    // Etapa 4: Torre
    { id: 'chk_4_1', activity_id: 'act_4', description: 'Mecanizacion de torre y soportes en IMPSA — Traslado a IMPSA [1.4.1.1]' },
    { id: 'chk_4_2', activity_id: 'act_4', description: 'Mecanizacion de torre y soportes en IMPSA — Mecanización de torre [1.4.1.2]' },
    { id: 'chk_4_3', activity_id: 'act_4', description: 'Mecanizacion de torre y soportes en IMPSA — Mecanizado de soportes y partes [1.4.1.3]' },
    { id: 'chk_4_4', activity_id: 'act_4', description: 'Mecanizacion de torre y soportes en IMPSA — Faldones y canastos [1.4.1.4]' },
    { id: 'chk_4_5', activity_id: 'act_4', description: 'Mecanizacion de torre y soportes en IMPSA — Traslado a Boulogne [1.4.1.5]' },
    { id: 'chk_4_6', activity_id: 'act_4', description: 'Recepción y control — Control de mecanización [1.4.2.1]' },
    { id: 'chk_4_7', activity_id: 'act_4', description: 'Pintura — Empapelado [1.4.3.1]' },
    { id: 'chk_4_8', activity_id: 'act_4', description: 'Pintura — Pintado [1.4.3.2]' },
    { id: 'chk_4_9', activity_id: 'act_4', description: 'Pintura — Traslado de torre a la línea [1.4.3.3]' },
    { id: 'chk_4_10', activity_id: 'act_4', description: 'Armado de la torre > Preparación inicial — Montaje en posatorre [1.4.4.1.1]' },
    { id: 'chk_4_11', activity_id: 'act_4', description: 'Armado de la torre > Preparación inicial — Repaso de roscas de boses [1.4.4.1.2]' },
    { id: 'chk_4_12', activity_id: 'act_4', description: 'Armado de la torre > Inicio del armado de torre — Montaje del piso [1.4.4.2.1]' },
    { id: 'chk_4_13', activity_id: 'act_4', description: 'Armado de la torre > Inicio del armado de torre — Colocación del cañón [1.4.4.2.2]' },
    { id: 'chk_4_14', activity_id: 'act_4', description: 'Armado de la torre > Inicio del armado de torre — Frontis + columna derecha [1.4.4.2.3]' },
    { id: 'chk_4_15', activity_id: 'act_4', description: 'Armado de la torre > Montar soportes del Cñ y Elevación — Montar soportes del cañón, contrapesos, etc [1.4.4.3.1]' },
    { id: 'chk_4_16', activity_id: 'act_4', description: 'Armado de la torre > Montar soportes del Cñ y Elevación — Cilintro de elevación y motor eléctrico con soporte [1.4.4.3.2]' },
    { id: 'chk_4_17', activity_id: 'act_4', description: 'Armado de la torre > Montar Giro — Montaje completo de mandos, soportes, motor, etc [1.4.4.4.1]' },
    { id: 'chk_4_18', activity_id: 'act_4', description: 'Armado de la torre > Canasto — Colocación [1.4.4.5.1]' },
    { id: 'chk_4_19', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Soportes de componentes electrónicos (IMPSA) [1.4.4.6.1]' },
    { id: 'chk_4_20', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Soportes de componentes electrónicos (Elbit) [1.4.4.6.2]' },
    { id: 'chk_4_21', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Soportes del TAM original [1.4.4.6.3]' },
    { id: 'chk_4_22', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Electrónica [1.4.4.6.4]' },
    { id: 'chk_4_23', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Componentes en cola de pato [1.4.4.6.5]' },
    { id: 'chk_4_24', activity_id: 'act_4', description: 'Armado de la torre > Soportería restante (traba de torre, etc) — Detectores de amenaza laser [1.4.4.6.6]' },
    { id: 'chk_4_25', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Soporte (IMPSA) y PCU [1.4.4.7.1]' },
    { id: 'chk_4_26', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Componentes y dispositivos Elbit [1.4.4.7.2]' },
    { id: 'chk_4_27', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Rotor del COAPS y COAPS J Tan [1.4.4.7.3]' },
    { id: 'chk_4_28', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Control de torques! [1.4.4.7.4]' },
    { id: 'chk_4_29', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Otros componentes internos de torre [1.4.4.7.5]' },
    { id: 'chk_4_30', activity_id: 'act_4', description: 'Armado de la torre > Colocación de soportes y dispositivos — Cableado guia [1.4.4.7.6]' },
    { id: 'chk_4_31', activity_id: 'act_4', description: 'Armado de la torre > Componentes y dispositivos con sus soportes — Componentes y dispositivos [1.4.4.8.1]' },
    { id: 'chk_4_32', activity_id: 'act_4', description: 'Armado de la torre > Componentes y dispositivos con sus soportes — Anillo colector [1.4.4.8.2]' },
    { id: 'chk_4_33', activity_id: 'act_4', description: 'Armado de la torre > Componentes y dispositivos con sus soportes — TPDB [1.4.4.8.3]' },
    { id: 'chk_4_34', activity_id: 'act_4', description: 'Armado de la torre > Componentes y dispositivos con sus soportes — Otros dispositivos [1.4.4.8.4]' },
    { id: 'chk_4_35', activity_id: 'act_4', description: 'Armado de la torre > Componentes y dispositivos con sus soportes — COAPS Apuntador [1.4.4.8.5]' },
    { id: 'chk_4_36', activity_id: 'act_4', description: 'Armado de la torre > Control Elbit en Potro — Traslado al potro [1.4.4.9.1]' },
    { id: 'chk_4_37', activity_id: 'act_4', description: 'Armado de la torre > Control Elbit en Potro — Control y ajustes [1.4.4.9.2]' },
    { id: 'chk_4_38', activity_id: 'act_4', description: 'Armado de la torre > Control Elbit en Potro — Traslado a la línea [1.4.4.9.3]' },
    { id: 'chk_4_39', activity_id: 'act_4', description: 'Armado de la torre > Trabajos post Potro — Ajuste de precintos [1.4.4.10.1]' },
    { id: 'chk_4_40', activity_id: 'act_4', description: 'Armado de la torre > Trabajos post Potro — Bloc de cierre, cesto de vainas etc [1.4.4.10.2]' },
    { id: 'chk_4_41', activity_id: 'act_4', description: 'Armado de la torre > Trabajos post Potro — TZF + periscopios [1.4.4.10.3]' },
    { id: 'chk_4_42', activity_id: 'act_4', description: 'Armado de la torre > Trabajos post Potro — Sistema contra incendios [1.4.4.10.4]' },
    { id: 'chk_4_43', activity_id: 'act_4', description: 'Armado de la torre > Trabajos post Potro — Control [1.4.4.10.5]' },
    { id: 'chk_4_44', activity_id: 'act_4', description: 'Torre lista para montar [1.4.5]' },

    // Etapa 5: Chasis
    { id: 'chk_5_1', activity_id: 'act_5', description: 'Mover el chasis del depósito a la línea [1.5.1]' },
    { id: 'chk_5_2', activity_id: 'act_5', description: 'Desarmar — Grupo motopropulsor [1.5.2.1]' },
    { id: 'chk_5_3', activity_id: 'act_5', description: 'Desarmar — Sistema de rodamiento [1.5.2.2]' },
    { id: 'chk_5_4', activity_id: 'act_5', description: 'Desarmar — Sistema de refrigeración [1.5.2.3]' },
    { id: 'chk_5_5', activity_id: 'act_5', description: 'Desarmar — Sistema de alimentación (combustible) [1.5.2.4]' },
    { id: 'chk_5_6', activity_id: 'act_5', description: 'Desarmar — Sistema de freno [1.5.2.5]' },
    { id: 'chk_5_7', activity_id: 'act_5', description: 'Desarmar — Sistema contra incendio [1.5.2.6]' },
    { id: 'chk_5_8', activity_id: 'act_5', description: 'Desarmar — Tanques de combustible [1.5.2.7]' },
    { id: 'chk_5_9', activity_id: 'act_5', description: 'Desarmar — Lavado [1.5.2.8]' },
    { id: 'chk_5_10', activity_id: 'act_5', description: 'Mantenimiento — Grupo motopropulsor [1.5.3.1]' },
    { id: 'chk_5_11', activity_id: 'act_5', description: 'Mantenimiento — Sistema de rodamiento [1.5.3.2]' },
    { id: 'chk_5_12', activity_id: 'act_5', description: 'Mantenimiento — Sistema de refrigeración [1.5.3.3]' },
    { id: 'chk_5_13', activity_id: 'act_5', description: 'Mantenimiento — Sistema de alimentación (combustible) [1.5.3.4]' },
    { id: 'chk_5_14', activity_id: 'act_5', description: 'Mantenimiento — Sistema de freno [1.5.3.5]' },
    { id: 'chk_5_15', activity_id: 'act_5', description: 'Mantenimiento — Sistema contra incendio [1.5.3.6]' },
    { id: 'chk_5_16', activity_id: 'act_5', description: 'Mantenimiento — Tanques de combustible [1.5.3.7]' },
    { id: 'chk_5_17', activity_id: 'act_5', description: 'Soldaduras — Soportes de tanques suplementarios [1.5.4.1]' },
    { id: 'chk_5_18', activity_id: 'act_5', description: 'Soldaduras — Soportes del sistema para el conductor [1.5.4.2]' },
    { id: 'chk_5_19', activity_id: 'act_5', description: 'Soldaduras — Soportes APU [1.5.4.3]' },
    { id: 'chk_5_20', activity_id: 'act_5', description: 'Montaje — Grupo motopropulsor [1.5.5.1]' },
    { id: 'chk_5_21', activity_id: 'act_5', description: 'Montaje — Sistema de rodamiento [1.5.5.2]' },
    { id: 'chk_5_22', activity_id: 'act_5', description: 'Montaje — Sistema de refrigeración [1.5.5.3]' },
    { id: 'chk_5_23', activity_id: 'act_5', description: 'Montaje — Sistema de alimentación (combustible) [1.5.5.4]' },
    { id: 'chk_5_24', activity_id: 'act_5', description: 'Montaje — Sistema de freno [1.5.5.5]' },
    { id: 'chk_5_25', activity_id: 'act_5', description: 'Montaje — Sistema contra incendio [1.5.5.6]' },
    { id: 'chk_5_26', activity_id: 'act_5', description: 'Montaje — Tanques de combustible [1.5.5.7]' },
    { id: 'chk_5_27', activity_id: 'act_5', description: 'Entrega/Recepción chasis — Control electrico (cableado) [1.5.6.1]' },
    { id: 'chk_5_28', activity_id: 'act_5', description: 'Entrega/Recepción chasis — Controles [1.5.6.2]' },

    // Etapa 6: Montaje de la torre en el chasis
    { id: 'chk_6_1', activity_id: 'act_6', description: 'Instalación de dispositivos en el chasis — Electrónica y cableado [1.6.1.1]' },
    { id: 'chk_6_2', activity_id: 'act_6', description: 'Instalación de dispositivos en el chasis — Control [1.6.1.2]' },
    { id: 'chk_6_3', activity_id: 'act_6', description: 'Instalación APU [1.6.2]' },
    { id: 'chk_6_4', activity_id: 'act_6', description: 'Instalación de caja telefónica [1.6.3]' },
    { id: 'chk_6_5', activity_id: 'act_6', description: 'Instalación de sensor contra incendio [1.6.4]' },
    { id: 'chk_6_6', activity_id: 'act_6', description: 'Control APU + caja telefónica + sensor contra incendios [1.6.5]' },
    { id: 'chk_6_7', activity_id: 'act_6', description: 'Montar torre en chasis [1.6.6]' },
    { id: 'chk_6_8', activity_id: 'act_6', description: 'Control de torque [1.6.7]' },
    { id: 'chk_6_9', activity_id: 'act_6', description: 'Instalación del TAS [1.6.8]' },
    { id: 'chk_6_10', activity_id: 'act_6', description: 'Control ATP — Control ATP [1.6.9.1]' },
    { id: 'chk_6_11', activity_id: 'act_6', description: 'Control ATP — Resolver novedades detectadas [1.6.9.2]' },
    { id: 'chk_6_12', activity_id: 'act_6', description: 'Control ATP — Control ATP [1.6.9.3]' },
    { id: 'chk_6_13', activity_id: 'act_6', description: 'Tareas finales — Ajustes finales posteriores al ATP [1.6.10.1]' },
    { id: 'chk_6_14', activity_id: 'act_6', description: 'Tareas finales — Preparar para pintura [1.6.10.2]' },
    { id: 'chk_6_15', activity_id: 'act_6', description: 'Pintura — Pintura tanque [1.6.11.1]' },
    { id: 'chk_6_16', activity_id: 'act_6', description: 'Pintura — Pintura faldones [1.6.11.2]' },
    { id: 'chk_6_17', activity_id: 'act_6', description: 'Tanque listo para certificar [1.6.12]' },

    // Etapa 7: Certificación
    { id: 'chk_7_1', activity_id: 'act_7', description: 'Coordinación con el J RC Tan 8 y Cte Br Bl I [1.7.1]' },
    { id: 'chk_7_2', activity_id: 'act_7', description: 'Reserva del espacio aéreo [1.7.2]' },
    { id: 'chk_7_3', activity_id: 'act_7', description: 'Transporte (Tan y Mun) — Pedido de transporte (Tan y Mun) [1.7.3.1]' },
    { id: 'chk_7_4', activity_id: 'act_7', description: 'Transporte (Tan y Mun) — Tansporte [1.7.3.2]' },
    { id: 'chk_7_5', activity_id: 'act_7', description: 'Sesión de tiro — Sesión de tiro (Sem 1) [1.7.4.1]' },
    { id: 'chk_7_6', activity_id: 'act_7', description: 'Sesión de tiro — Sesión de tiro (Sem 2) [1.7.4.2]' },
    { id: 'chk_7_7', activity_id: 'act_7', description: 'Regreso [1.7.5]' },
    { id: 'chk_7_8', activity_id: 'act_7', description: 'Preparación de informes, documentos y puesta a disposición del TAM 2C A2 [1.7.6]' },
  ]

  for (const chk of INITIAL_CHECKLISTS) {
    await prisma.checklistItem.create({ data: chk })
  }

  // 4. Cargar Materiales en Catálogo de Insumos
  console.log('Cargando materiales en catálogo de insumos...')
  const s1 = await prisma.supply.create({ data: { name: 'Funda Térmica de Cañón', family: 'Cañón', description: 'Funda protectora térmica para cañón de 105mm' } })
  const s2 = await prisma.supply.create({ data: { name: 'Placa PCU', family: 'Torre', description: 'Placa electrónica de control de unidad de potencia de torre' } })
  const s3 = await prisma.supply.create({ data: { name: 'Corona de Giro de Torre', family: 'Corona', description: 'Corona giratoria de rodamiento para torre TAM' } })
  const s4 = await prisma.supply.create({ data: { name: 'Pernos de Alta Resistencia M16', family: 'Tornillería', description: 'Pernos de alta resistencia para fijación de corona' } })
  const s5 = await prisma.supply.create({ data: { name: 'Evacuador de Gases', family: 'Cañón', description: 'Evacuador de gases para cañón L7 de 105mm' } })
  const s6 = await prisma.supply.create({ data: { name: 'Junta de Hermeticidad Frontis', family: 'Torre', description: 'Junta de hermeticidad de goma para frontis de torre' } })

  // 5. Cargar Lotes de Insumos (Stock en Depósito)
  console.log('Cargando lotes de insumos (Stock)...')
  await prisma.supplyBatch.create({
    data: {
      supply_id: s1.id,
      batch_number: 'LOTE-FT-2026',
      serial_numbers: ['FT-SN-101', 'FT-SN-102', 'FT-SN-103'],
      available_quantity: 3,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
    }
  })
  await prisma.supplyBatch.create({
    data: {
      supply_id: s2.id,
      batch_number: 'LOTE-PCU-2026',
      serial_numbers: ['PCU-SN-501', 'PCU-SN-502', 'PCU-SN-503', 'PCU-SN-504'],
      available_quantity: 4,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25)
    }
  })
  await prisma.supplyBatch.create({
    data: {
      supply_id: s3.id,
      batch_number: 'LOTE-COR-2026',
      serial_numbers: ['COR-SN-201', 'COR-SN-202'],
      available_quantity: 2,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)
    }
  })
  await prisma.supplyBatch.create({
    data: {
      supply_id: s4.id,
      batch_number: 'LOTE-PER-2026',
      serial_numbers: [],
      available_quantity: 100,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
    }
  })
  await prisma.supplyBatch.create({
    data: {
      supply_id: s5.id,
      batch_number: 'LOTE-EV-2026',
      serial_numbers: ['EV-SN-301', 'EV-SN-302'],
      available_quantity: 2,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
    }
  })
  await prisma.supplyBatch.create({
    data: {
      supply_id: s6.id,
      batch_number: 'LOTE-JUN-2026',
      serial_numbers: [],
      available_quantity: 20,
      entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
    }
  })

  // 6. Cargar Munición (Stock inicial para el módulo de Munición)
  console.log('Cargando catálogo y stock de munición...')
  const ammo1 = await prisma.ammunition.create({ data: { type: 'Proyectil 105mm HE', caliber: '105mm', description: 'Proyectil de alto explosivo para cañón L7' } })
  const ammo2 = await prisma.ammunition.create({ data: { type: 'Munición 7.62mm', caliber: '7.62mm', description: 'Munición para ametralladora coaxial' } })
  await prisma.ammunitionBatch.create({ data: { ammunition_id: ammo1.id, batch_number: 'LOTE-105-2026', available_quantity: 40 } })
  await prisma.ammunitionBatch.create({ data: { ammunition_id: ammo2.id, batch_number: 'LOTE-762-2026', available_quantity: 2000 } })

  console.log('Carga de base de datos terminada con éxito.')
  console.log('Nota: los vehículos (flota) no se cargan por seed. Se importan desde el listado real de 230 tanques.')
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
