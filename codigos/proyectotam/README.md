# Proyecto TAM - Sistema de Gestión de Planta y Depósito

El **Proyecto TAM** (anteriormente referido como TAM Defense) es una plataforma integral desarrollada para administrar, auditar y controlar el flujo de trabajo en la línea de producción y modernización de vehículos blindados (TAM 2C). 

El sistema digitaliza el control de tareas en planta, la gestión de inventario en depósito y la asignación de responsabilidades a través de un sistema de control de acceso jerárquico.

---

## 🛠️ Stack Tecnológico

La aplicación está construida sobre una arquitectura moderna y reactiva enfocada en la velocidad y la experiencia del usuario final:

* **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Directory Architecture)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) para tipado estático y seguridad en tiempo de compilación.
* **Estilizado (CSS):** [Tailwind CSS](https://tailwindcss.com/) nativo para un diseño atómico y responsivo.
* **Componentes UI:** [Shadcn/ui](https://ui.shadcn.com/) (basado en Radix UI) para componentes accesibles y atractivos (Botones, Modales, Tarjetas, Inputs).
* **Gestor de Estado (Database Mock):** [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction). Actualmente, toda la "Base de Datos" (Usuarios, Inventario, Actividades, Vehículos) se encuentra **mockeada y gestionada de forma transaccional** íntegramente en memoria mediante Zustand y persistida en el Local Storage del navegador (ver `src/lib/store/app.ts` y `src/lib/store/auth.ts`).
* **Iconografía:** [Lucide React](https://lucide.dev/).

---

## 🗄️ Arquitectura de Datos (Base de Datos)

En su iteración actual (V1.0 - MVP Funcional), **no existe una base de datos relacional externa (SQL/NoSQL)** conectada al backend. Toda la infraestructura de datos está centralizada en el **App Store** (`src/lib/store/app.ts`), diseñado deliberadamente para imitar el comportamiento de una base de datos relacional mediante la vinculación de IDs.

La estructura simula las siguientes entidades:

1. **Usuarios (`users`):** Almacena perfiles de acceso (Nombre, Email, Rol, Estado).
2. **Depósito / Insumos (`supplyBatches`):** Controla el inventario de repuestos, registrando Entradas, Familias, Lotes, **Números de Serie Especiales** y cantidades disponibles.
3. **Vehículos (`vehicles`):** Registro de las unidades (tanques) en planta, incluyendo patente, chasis y estado global.
4. **Catálogo de Actividades (`activities` / `checklists`):** Define el diccionario maestro de tareas (Subgrupo A, Grupo Torre, etc.) que se le debe aplicar a cada vehículo.
5. **Transacciones en Planta (`vehicleActivities`, `vehicleChecklistItems`, `activityMaterialConsumptions`):** Registra el cruce entre un Tanque específico y el catálogo. Guarda qué tareas se completaron, qué repuestos exactos (con número de serie) se utilizaron y quién lo hizo.
6. **Logs de Auditoría (`auditLogs`):** Un registro inmutable de todas las acciones destructivas o críticas (Ej: ingreso manual de stock, eliminación de usuarios).

_Nota: El sistema está diseñado para que la migración futura a un backend real (ej: Node.js + PostgreSQL + Prisma ORM) sea directa, ya que todas las acciones del frontend llaman a funciones centralizadas del AppStore en lugar de manipular objetos directamente._

---

## 👥 Manejo de Usuarios y Roles (RBAC)

El acceso al sistema está fuertemente tipado. El ruteo de Next.js verifica el Rol del usuario y habilita o bloquea secciones de la app automáticamente. Hay 4 roles principales inicializados por defecto en la base de datos:

1. **Project Manager (`project_manager`)**
   * *Ejemplo Login:* `manager@manager.com` / `manager123`
   * *Acceso:* **Total.** Es el único rol capaz de entrar al panel de **Auditoría de Roles y Usuarios** para crear, suspender o activar cuentas.
2. **Supervisor (`supervisor`)**
   * *Ejemplo Login:* `supervisor@sup.com` / `supervisor123`
   * *Acceso:* Alto. Puede ver la planta, revisar el impacto general, y su función principal es auditar y **Aprobar** las tareas completadas por los operarios.
3. **Encargado de Depósito (`deposit_manager`)**
   * *Ejemplo Login:* `deposit@dep.com` / `deposit123`
   * *Acceso:* Depósito e Insumos. Es el único perfil habilitado con botones para **Ingresar** nuevo stock, modificar lotes o agregar repuestos.
4. **Operario (`operator`)**
   * *Ejemplo Login:* `operator@op.com` / `operator123`
   * *Acceso:* Limitado a Planta. Diseñado para tablets/pantallas de fábrica. El operario ingresa a un Tanque, tilda los Checklists de montaje y hace el descargo (consumo) de materiales utilizados.

_Nota: A diferencia de versiones anteriores, los 4 perfiles ahora vienen pre-cargados por defecto mediante el proceso de inicialización (seeding)._

---

## 🚀 Instalación y Uso Local

Sigue estos pasos para correr el Proyecto TAM localmente:

1. Clonar el repositorio.
2. Asegurar tener Node.js instalado (v18 o superior).
3. Instalar dependencias:
   ```bash
   npm install
   ```
4. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abrir el navegador en `http://localhost:3000`.
6. **Ingreso:** Utiliza cualquiera de los usuarios de ejemplo descriptos arriba según el rol que desees probar (ej. `manager@manager.com` / `manager123`).

---

## 🗺️ Vistas Principales

* `/login`: Inicio de sesión protegido con validación de credenciales simulada.
* `/`: Dashboard general resumen.
* `/planta`: Vista de línea de mecanizado donde yacen los Vehículos con el porcentaje individual de construcción completado.
* `/planta/[id]`: Drill-down detallado por tanque. Contiene los grupos de acividades tipo acordeón, el checklist funcional de sub-tareas individuales y el **módulo de consumo de repuestos** con trazabilidad de Números de Serie exactos.
* `/deposito`: CRUD de stock (Exclusivo Encargado/PM).
* `/auditoria/usuarios`: Panel de Alta y Baja de credenciales de operarios (Exclusivo PM).
