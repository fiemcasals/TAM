# Plataforma de Gestión y Control - Proyecto TAM 2C

Este documento consolidado contiene las guías de inicio, operación, administración y plan de contingencia del sistema de control y modernización de vehículos blindados **TAM 2C** (Tanque Argentino Mediano).

---

## 💾 Modelo de Instalación y Resguardo de Datos

La aplicación está diseñada para distribuirse y portarse de forma autónoma a través de un **pendrive (unidad USB)** a cualquier equipo de destino con Windows (incluso computadoras "vírgenes" sin conexión a internet ni herramientas de desarrollo).

### Proceso de Instalación en la PC de Destino:
1. **Conectar el Pendrive** en la PC.
2. **Copiar la carpeta completa del proyecto** (la carpeta `TAM` que contiene este archivo) desde el pendrive al almacenamiento local de la PC (por ejemplo, a `C:\TAM` o en el *Escritorio*).
3. **Extraer el pendrive.** El pendrive se usa únicamente como medio de transporte; una vez copiado el proyecto, el sistema correrá al 100% de forma local y autónoma.

### Almacenamiento y Resguardo de la Base de Datos:
* **Persistencia Local:** Los datos (vehículos, operarios, insumos y consumos) se guardan físicamente en la PC destino dentro del subdirectorio `./codigos/portable/data/` de la carpeta copiada.
* **Resguardo y Backups:** Hacer una copia de respaldo es tan simple como copiar o comprimir la carpeta raíz del proyecto local a otra ubicación o pendrive de respaldo. No requiere complejas operaciones de IT.

---

## 🚀 Cómo Iniciar la Aplicación

### Opción 1: Lanzador Automático (Recomendado)
1. Abre la carpeta del proyecto en el disco local de la PC (donde fue copiada).
2. Haz doble clic en el archivo **`iniciar.bat`** (o ejecuta el archivo **`IniciarProyecto.exe`**).
   * *La primera ejecución configurará las herramientas portables locales en segundo plano. Las siguientes ejecuciones serán instantáneas.*
3. El motor de base de datos PostgreSQL se iniciará en segundo plano y el navegador web se abrirá automáticamente en **[http://localhost:3000](http://localhost:3000)**.
4. **Para detener la aplicación:** Presiona cualquier tecla en la ventana de consola abierta. Esto detendrá limpiamente el servidor y la base de datos local.

> [!NOTE]
> **Acceso Multiusuario en Red Local (LAN):** El servidor se configura de manera abierta en la red local. Al finalizar el arranque del script `iniciar.bat`, la consola detectará e imprimirá la dirección IP de la PC servidor (por ejemplo, `http://192.168.1.50:3000`). Cualquier otra computadora de la red local (como las terminales de los operarios en los distintos puestos de montaje o depósito) podrá conectarse simultáneamente a esa dirección utilizando su navegador.

> [!TIP]
> **¿Qué hacer si el puerto 3000 está ocupado?**
> Si el puerto `3000` ya está siendo utilizado por otra aplicación en la computadora local:
> - **Lanzador local (`iniciar.bat`):** Abre el archivo `codigos/proyectotam/package.json` y modifique el script `"dev"` de `"next dev -H 0.0.0.0"` a `"next dev -H 0.0.0.0 -p 3001"` (o cualquier puerto libre de su elección). La aplicación se iniciará en ese nuevo puerto (ej. `http://localhost:3001`).
> - **Docker / Docker Compose:** Abre el archivo `codigos/proyectotam/docker-compose.yml` y cambie el mapeo de puertos del servicio `app` de `- "3000:3000"` a `- "3001:3000"`. Esto expondrá la web en el puerto `3001` de la PC host sin alterar la configuración interna del contenedor.

### Opción 2: Inicio Manual desde Consola (Desarrollador)
Si prefieres ejecutar el entorno paso a paso usando la terminal de Windows en la PC local:
1. Abre la consola de comandos en la carpeta local del proyecto.
2. Agrega las rutas temporales del proyecto local al PATH de la sesión:
   ```cmd
   set PATH=%CD%\codigos\portable\node;%CD%\codigos\portable\pgsql\bin;%PATH%
   ```
3. Navega al subdirectorio del código:
   ```cmd
   cd codigos\proyectotam
   ```
4. Si es la primera vez, instala las dependencias locales en el disco:
   ```cmd
   npm install
   ```
5. Sincroniza la estructura de datos:
   ```cmd
   npx prisma db push
   ```
6. Inicia el servidor de desarrollo:
   ```cmd
   npm run dev
   ```
7. Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador.

### Opción 3: Despliegue en Linux (Recomendado para entornos no Windows)
Si te encuentras en un entorno Linux (como Ubuntu o Debian), puedes utilizar Docker Compose o Node.js de forma nativa.

**Con Docker Compose (Opción más fácil):**
1. Abre una terminal y navega a la carpeta del proyecto:
   ```bash
   cd TAM/codigos/proyectotam
   ```
2. Crea un archivo `.env` en esa misma carpeta con las variables necesarias, por ejemplo:
   ```bash
   POSTGRES_USER=userTAM
   POSTGRES_PASSWORD=passwordTAM
   POSTGRES_DB=tam_db
   ```
3. Levanta los servicios con Docker Compose en segundo plano:
   ```bash
   docker compose up -d
   ```
4. Aplica las migraciones de la base de datos de Prisma y carga los datos semilla (ejecutando dentro del contenedor de la app):
   ```bash
   docker exec -it tam_app npx prisma db push
   docker exec -it tam_app npm run prisma db seed
   ```
5. Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador web.

**Con Node.js de forma nativa:**
1. Navega a la carpeta del proyecto:
   ```bash
   cd TAM/codigos/proyectotam
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura un servicio local de PostgreSQL (o levántalo con Docker) y configura la variable `DATABASE_URL` en tu entorno (ej. en el archivo `.env`).
4. Sincroniza la base de datos e inicia el servidor en modo desarrollo:
   ```bash
   npx prisma db push
   npm run dev
   ```
5. Accede a **[http://localhost:3000](http://localhost:3000)**.

---

## 👥 Roles del Sistema y Acceso Inicial

La aplicación implementa un Control de Acceso Basado en Roles (RBAC):

1. **Jefe de Proyecto / Admin (`project_manager`):** Control total del sistema, administración de cuentas de usuario, visualización del log de auditoría completo y control global de la planta.
2. **Supervisor de Planta (`supervisor`):** Aprobación y firma digital de las etapas de montaje completadas por los operarios.
3. **Encargado de Depósito (`deposit_manager`):** Gestión de stock, alta de insumos, creación de lotes e ingresos de números de serie únicos.
4. **Operario de Línea (`operator`):** Visualización de actividades y checklists de montaje asignados, y descargo (consumo) de repuestos con su correspondiente número de serie.

### 🔑 Primer Acceso e Inicialización (Configuración)

Para la puesta en marcha inicial en una instalación limpia, la base de datos se inicializa con un único usuario administrador temporal:
* **Usuario (Email):** `manager@manager.com`
* **Contraseña temporal:** `manager123`

> [!CAUTION]
> **Acción Requerida:** Tras iniciar sesión por primera vez con esta cuenta de administración temporal, dirígete a la sección de **Gestión de Usuarios** (`/auditoria/usuarios`) para dar de alta las cuentas reales de tu equipo de trabajo y, posteriormente, desactiva o modifica la contraseña de este usuario temporal para evitar accesos no autorizados.

### Cómo Crear Nuevos Usuarios (Desde la Interfaz)
1. Inicia sesión como **Project Manager** (con la cuenta de configuración inicial).
2. Dirígete a la sección de **Auditoría e Inicios de Sesión** > **Gestión de Usuarios** (`/auditoria/usuarios`).
3. Haz clic en el botón **"Nuevo Usuario"** en la esquina superior derecha.
4. Rellena los campos del formulario (Nombre, Apellido, Email, Contraseña provisional y el Rol del sistema).
5. Haz clic en **"Completar Registro"**. La cuenta se creará y estará disponible para iniciar sesión inmediatamente.

### Cómo Cambiar y Gestionar las Contraseñas

El sistema implementa tres flujos seguros para el mantenimiento de contraseñas:

#### 1. Auto-servicio (Cualquier usuario logueado)
Cualquier usuario que tenga una sesión activa en la aplicación puede cambiar su contraseña en cualquier momento:
1. Haz clic en el botón **"Cambiar Contraseña"** en la parte inferior de la barra lateral izquierda (debajo del nombre de usuario).
2. Introduce tu **Contraseña Actual**, tu **Nueva Contraseña** (mínimo 6 caracteres) y confírmala.
3. Haz clic en **"Actualizar Contraseña"**. La nueva clave tendrá efecto inmediato.

#### 2. Restablecimiento por el Manager (Si un operario/supervisor olvida su clave)
Si un usuario de planta (operario, encargado de depósito, supervisor) olvida sus credenciales, debe solicitar asistencia al Jefe de Proyecto (Manager) de guardia:
1. El Manager debe ir al menú **Roles y Usuarios** (`/auditoria/usuarios`).
2. En la fila del usuario afectado, haz clic en el botón **"Restablecer contraseña"**.
3. Introduce la **Nueva Contraseña Provisoria** en el modal y haz clic en **"Guardar Contraseña"**.
4. Entrega esta contraseña provisoria al usuario para que ingrese y posteriormente la cambie usando el método de *Auto-servicio*.

#### 3. Llave de Recuperación de Sistemas (Si el Manager olvida su clave)
Si el Jefe de Proyecto (Manager) pierde su contraseña de acceso, el área de Sistemas de la planta/unidad es responsable de realizar el restablecimiento. **Este programa actúa como llave física de seguridad y debe estar bajo custodia estricta**:
1. El responsable de Sistemas debe abrir la subcarpeta **`codigos/`** del proyecto local y hacer doble clic en el archivo **`restablecer_admin.bat`** (el cual ejecutará la interfaz en python de manera automática).
2. Esto levantará una interfaz gráfica muy sencilla en pantalla.
3. Escribe la nueva contraseña del Administrador, confírmala y presiona **"Restablecer Contraseña"**.
4. El programa modificará de manera directa y encriptada la clave del usuario `manager@manager.com` en la base de datos local y se cerrará automáticamente.

---

## 🖥️ Módulos de la Aplicación

### 1. Panel de Control (Dashboard)
* **Acceso:** Todos los roles.
* **Función:** Vista rápida con métricas del estado de producción (vehículos activos, tareas de checklists pendientes, repuestos críticos y logs de auditoría rápidos).

### 2. Vista de Planta (`/planta`)
* **Acceso:** Todos los roles.
* **Función:** Muestra los tanques en proceso y su porcentaje de construcción.
* **Detalle por Vehículo (`/planta/[id]`):**
  * **Checklists de Actividades:** Acordeones colapsables para cada etapa del flujo de montaje que muestran las tareas correspondientes, los materiales utilizados y los controles de aprobación.
  * **Descargo de repuestos (Solo Operario/PM):** Selección del repuesto, número de lote y número de serie exacto utilizado en la etapa activa.
  * **Aprobación de Etapa (Solo Supervisor/PM):** Botón para validar y cerrar las actividades completadas.

### 3. Control de Materiales (`/materiales`)
* **Acceso:** Todos los roles (modo lectura para consultar trazabilidad).
* **Función:** Reporte centralizado de inventario.
  * **Existencias:** Lotes y series disponibles en el depósito de stock.
  * **Trazabilidad:** Historial de materiales instalados, indicando el vehículo (NI y Unidad de origen), etapa, operario responsable y fecha exacta.

### 4. Depósito e Inventario (`/deposito`)
* **Acceso:** Exclusivo de Encargado de Depósito y PM.
* **Función:** CRUD de insumos. Permite registrar entradas, crear lotes (`SupplyBatch`) y asociar los números de serie únicos correspondientes.

### 5. Auditoría y Usuarios (`/auditoria/usuarios`)
* **Acceso:** Exclusivo de Project Manager (PM).
* **Función:** Administración de cuentas. Permite crear nuevos usuarios, activar o suspender cuentas existentes, y visualizar el log histórico de auditoría inmutable de acciones del sistema.

---

## Plan de Contingencia y Recuperación de Datos

Este plan detalla el procedimiento a seguir para restaurar el sistema desde cero en una computadora nueva ante un fallo físico catastrófico del servidor central local.

### Paso 1: Preparación del Nuevo Entorno
Asegúrese de contar con **Docker Desktop** instalado y en ejecución en la nueva PC que actuará como servidor.

### Paso 2: Transferencia del Proyecto y Backup
1. Copie la carpeta del proyecto `TAM` completa a la nueva computadora.
2. Localice el último archivo de respaldo comprimido (por ejemplo, `backup_2026-07-01_114000.tar.gz`) en la carpeta `backups_sistema/` (o recupérelo de una de las PCs clientes que tenga la carpeta sincronizada).
3. Descomprima el archivo `.sql` del volcado de base de datos ejecutando en su terminal:
   ```bash
   tar -xzf backups_sistema/backup_2026-07-01_114000.tar.gz -C backups_sistema/
   ```

### Paso 3: Inicializar Contenedores Limpios
Navegue con la terminal al subdirectorio donde reside el archivo `docker-compose.yml` (`codigos/proyectotam/`) y levante los contenedores en segundo plano ejecutando el comando exacto:
```bash
docker compose up -d db app
```
*Este comando descargará la imagen de PostgreSQL 15, creará un volumen limpio e iniciará la aplicación de Next.js.*

### Paso 4: Importar los Datos del Backup
Una vez que el contenedor de la base de datos (`tam_db`) esté activo, importe el volcado SQL restaurando toda la información histórica con el comando exacto:
```bash
docker exec -i tam_db psql -U userTAM -d tam_db < backups_sistema/backup_2026-07-01_114000.sql
```
*(Nota: Ajuste el nombre del archivo `.sql` al de su respaldo descomprimido).*

### Paso 5: Verificación
Abra el navegador en `http://localhost:3000` y verifique que las credenciales de los operarios, el historial de trazabilidad y la línea de montaje estén cargados y operativos.

---

## 📑 Documentación Adicional Disponible

En la carpeta `codigos/` del proyecto encontrarás los siguientes manuales técnicos de referencia (con enlaces relativos):

* **[Guía de Casos de Uso y Testeo](./codigos/casosDeUso.md):** Contiene los casos de prueba paso a paso estructurados por rol, checklist sugerido para pruebas humanas de extremo a extremo, y las instrucciones de cómo usar la semilla de datos de prueba para inicializar la base de datos antes del testeo.
