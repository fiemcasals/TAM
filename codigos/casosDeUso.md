# Guía de Casos de Uso y Pruebas del Sistema - TAM 2C

Este documento describe paso a paso cómo testear cada una de las funcionalidades de la plataforma de gestión de planta y depósito del **Proyecto TAM 2C**.

---

## ⚡ Preparación de la Base de Datos para Pruebas (En la PC Destino)

Para realizar pruebas completas con datos reales, ejecuta el script semilla (seed) que limpia e inicializa la base de datos local de la PC de destino con usuarios ficticios, tanques, repuestos e instalaciones preestablecidas.

### Cómo ejecutar la semilla de datos:
1. Abre la carpeta del proyecto en el disco de la PC de destino (donde copiaste los archivos).
2. Asegúrate de tener la aplicación ejecutándose localmente (habiendo ejecutado `iniciar.bat` en la raíz de la PC).
3. Abre la consola de comandos de Windows en la subcarpeta `codigos/proyectotam` del proyecto local.
4. Ejecuta el siguiente comando:
   ```cmd
   npx prisma db seed
   ```
5. Verás en pantalla el log confirmando la creación de usuarios, vehículos, insumos y consumos.

---

## 👥 Casos de Uso por Rol

### 1. Rol: Jefe de Proyecto / Administrador (`project_manager`)
**Credenciales de Prueba:** `manager@manager.com` / `manager123`

* **Caso de Uso 1: Gestión de Usuarios**
  1. Inicia sesión y ve al menú **Roles y Usuarios** (`/auditoria/usuarios`).
  2. Haz clic en **"Nuevo Usuario"** y crea un operario (ej: `test@op.com`).
  3. Modifica el estado de un usuario de "Activo" a "Inactivo" en la lista para verificar que no pueda loguearse.
* **Caso de Uso 2: Restablecer Contraseña de Terceros**
  1. En la lista de usuarios, haz clic en **"Restablecer contraseña"** sobre la fila de un operario.
  2. Introduce una clave provisoria y guárdala. Verifica que el operario pueda iniciar sesión con ella.
* **Caso de Uso 3: Registro Inmutable de Auditoría**
  1. Realiza cualquier acción crítica en el sistema (ej: crear un usuario o cambiar un estado).
  2. Ve al menú **Roles y Usuarios** y desplázate al final de la página.
  3. Verifica que en el cuadro de **Historial de Auditoría** figure la acción detallada con fecha, hora, usuario e ID.

---

### 2. Rol: Encargado de Depósito (`deposit_manager`)
**Credenciales de Prueba:** `deposit@dep.com` / `deposit123`

* **Caso de Uso 1: Crear Catálogo de Insumos**
  1. Inicia sesión y navega a **Depósito e Insumos** (`/deposito`).
  2. Haz clic en **"Nuevo Insumo"** y completa el nombre (ej. `Batería Gel 12V`) y la familia (ej. `Eléctrico`).
* **Caso de Uso 2: Cargar Lotes y Series**
  1. En el insumo creado, haz clic en **"Nuevo Lote"**.
  2. Define el número de lote (ej: `LOTE-BAT-01`).
  3. Si el insumo es seriado, escribe los números de serie separados por comas (ej: `SN-BAT-001, SN-BAT-002`) y el sistema calculará el stock automáticamente. Si no es seriado, simplemente define la cantidad.
  4. Verifica que el stock se actualice en la tabla general de depósito.

---

### 3. Rol: Operario de Línea (`operator`)
**Credenciales de Prueba:** `operator1@op.com` / `operator123` (Juan Pérez)

* **Caso de Uso 1: Trabajar en un Tanque y Expandir Actividades**
  1. Navega a **Línea de Producción** (`/planta`) y haz clic en **"Trabajar"** en el vehículo `TAM-2C-101`.
  2. Observa la lista de actividades en formato de acordeón.
  3. Haz clic en la cabecera de una actividad (ej: *Paso 1: Actividades previas*) para expandir su panel. Verifica que se muestren las tareas de checklist correspondientes y los insumos utilizados en esa etapa.
* **Caso de Uso 2: Ejecutar Checklist y Control de Avance**
  1. En la etapa en desarrollo, marca un ítem del checklist como completado.
  2. Observa que el estado de la etapa cambia automáticamente de "Pendiente" a "En Progreso" y que el progreso general del tanque incrementa.
* **Caso de Uso 3: Descargo de Repuestos (Consumo)**
  1. En la etapa activa, haz clic en **"Usar Material"**.
  2. En el buscador escribe `Pla` para encontrar la *Placa PCU*.
  3. Como es un repuesto seriado, selecciona un número de serie de la lista desplegable y presiona **"Consumir"**.
  4. Verifica que el insumo aparezca en el listado de materiales instalados de la etapa, detallando la serie y el operario que lo instaló.
  5. Desconéctate y verifica que el stock del lote en Depósito se haya descontado en una unidad.
* **Caso de Uso 4: Solicitar Aprobación**
  1. Completa todas las tareas del checklist de la etapa seleccionada.
  2. Haz clic en el botón **"Solicitar Aprobación"** que aparece en el panel de control de la etapa.
  3. Verifica que el estado de la etapa cambia a "Esperando Aprobación".

---

### 4. Rol: Supervisor (`supervisor`)
**Credenciales de Prueba:** `supervisor@sup.com` / `supervisor123`

* **Caso de Uso 1: Validar y Firmar Etapa**
  1. Inicia sesión y ve a **Línea de Producción** (`/planta`) e ingresa en modo **"Trabajar"** en el tanque que tiene una etapa en estado "Esperando Aprobación".
  2. Expande dicha etapa en el acordeón. Revisa las tareas realizadas.
  3. Haz clic en **"Aprobar Etapa"**.
  4. Verifica que el estado cambie a "Verificado y Aprobado" (quedando bloqueada para futuras modificaciones del operario) y se registre tu firma digital.

---

### 5. Control de Materiales y Trazabilidad (Todos los Roles)
**Cualquier rol puede ingresar a consultar este panel de control.**

* **Caso de Uso 1: Consulta de Existencias**
  1. Haz clic en **"Control de Materiales"** (`/materiales`) en la barra lateral.
  2. En la pestaña de **Insumos Existentes**, busca un insumo (ej: `Perno`). Verifica que liste las cantidades y series disponibles en depósito.
* **Caso de Uso 2: Trazabilidad de Materiales Instalados**
  1. Haz clic en la pestaña **Materiales Utilizados (Trazabilidad)**.
  2. Escribe en el buscador de vehículos `TAM-2C-101`.
  3. Verifica que la tabla muestre la trazabilidad exacta de qué componentes tiene instalados ese blindado: número de serie, lote, qué operario lo colocó y la fecha/hora exacta de la instalación.

---

## 🔑 Prueba de Recuperación Física de Clave (Sistemas)

Este caso de uso simula la pérdida total de la contraseña del Administrador/Manager:

1. Ve a la subcarpeta **`codigos/`** en la PC de destino y haz doble clic en el archivo **`restablecer_admin.bat`**.
2. Escribe una nueva contraseña en la interfaz gráfica de Python y confírmala.
3. Haz clic en **"Restablecer Contraseña"**.
4. Abre la web del proyecto en el navegador e ingresa con el usuario `manager@manager.com` y la nueva contraseña que acabas de definir.
