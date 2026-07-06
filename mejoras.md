# 🚀 Propuestas de Mejora y Nuevos Requerimientos (Proyecto TAM)

Este documento consolida y estructura todas las mejoras planificadas para evolucionar el sistema de gestión del Proyecto TAM (Tanque Argentino Mediano), comprendiendo la naturaleza del trabajo de modernización y el entorno de fábrica.

---

## ✅ Mejoras Completadas

### 1. Trazabilidad y Control de Tiempos
- [x] **Control de tiempos por tarea:** Implementar el registro exacto de fecha y hora de "Inicio" y "Fin" (Desde/Hasta) en cada tarea de los checklists para poder generar métricas y reportes precisos de tiempo invertido.
- [x] **Historial absoluto (Auditoría Integral):** Todo lo que ocurra en el sistema (acciones, errores, correcciones, rechazos) debe quedar registrado en un historial inmutable para fines de trazabilidad. (Ya estaba implementado parcialmente con AuditLog).
- [x] **Trazabilidad temporal del Vehículo:** Mostrar en el detalle del tanque el tiempo total transcurrido desde que el vehículo ingresó a la planta hasta su salida (tiempo de ciclo), desglosado por cada etapa de producción.

### 2. Asignación de Personal y Retrabajos
- [x] **Asignación exclusiva de tanques:** El Supervisor debe poder designar a cada operario el tanque específico en el que va a trabajar. De esta manera, al operario solo le aparecerá su tanque asignado (y no los 30 de la línea), evitando que se complique ver sus obligaciones o afecte por error el trabajo de otra unidad.

### 3. Control de Calidad, Flujo de Aprobación y Edición
- [x] **Rechazo de tareas por Supervisor:** El Supervisor debe tener un botón para "Rechazar" una etapa o tarea, exigiendo un mensaje o motivo obligatorio al hacerlo.
- [x] **Edición de consumos por el Operario:** Si un operario carga un elemento/insumo a un tanque y se confunde, debe poder editarlo o corregirlo. Esta edición se bloquea una vez que el Supervisor aprueba la tarea, pero vuelve a habilitarse si el Supervisor la rechaza.
- [x] **Edición de inventario en Depósito:** El Encargado de Depósito debe poder editar las entradas de stock o cargos de materiales en caso de haber cometido un error al ingresarlos al sistema.

### 4. Gestión Global de la Flota (Universo de 230 Tanques)
- [x] **Panel de Tanques en Servicio:** Modificar la vista de tanques terminados. Al hacer clic en "En Servicio", se debe mostrar una lista de todos los tanques finalizados junto con su destino/unidad final.
- [x] **Renombramientos de Estados:** Cambiar el estado actual denominado "Fuera de Servicio" por la nomenclatura **"En Depósito"**.
- [x] **Gestión del estado "En el Ejército":** Crear una nueva vista/panel exclusivo para los tanques que están en el ejército. Se debe usar un menú desplegable para indicar su ubicación geográfica - unidad a la que pertenece y su estado actual (Seleccionado, Descartado, sin inspeccionar).
- [x] **Identificadores dinámicos:** Reflejar la realidad de la flota: mientras están en el ejército, solo se conoce el "NI" (Número de Identificación) y la "Unidad". La "Identificación" interna de planta se le asigna recién al momento de su ingreso a la línea de modernización.

### 5. Logística de Insumos y Devoluciones
- [x] **Vista de materiales consolidados:** En la vista de control de materiales ("Materiales Utilizados"), se debe eliminar la columna/agrupación de "Etapa de Montaje". Se mostrará directamente la lista total de insumos utilizados por vehículo sin dividirlos por etapa.

### 6. Nuevo Módulo de Munición
- [x] **Gestión de Munición:** Crear un módulo independiente, paralelo al Depósito, exclusivo para Municiones.
- [x] **Nuevo Rol:** "Encargado de Munición".
- [x] **Lógica del módulo:** Este encargado gestionará el inventario de munición disponible y será el responsable de asignarla y transferirla a cada tanque terminado.

### 7. Panel de Configuración Dinámica (Project Manager)
- [x] **Creación dinámica de Tareas:** El Project Manager debe poder crear y editar nuevas tareas, actividades o pasos del checklist de manera dinámica adaptándose a nuevas necesidades de la línea de producción.

---

## ⏳ Mejoras Pendientes



### 2. Asignación de Personal y Retrabajos
- [ ] **Multiasignación en tareas:** Permitir que el operario principal que registra una tarea pueda agregar a otros operarios que participaron junto con él en esa misma labor.
- [ ] **Flujo condicional de Retrabajo:** Implementar una lógica donde, si ocurre un retrabajo, se abra un formulario condicional (Sí/No). De marcarse "Sí", se debe exigir especificar de qué retrabajo se trata, quién lo ejecutó y qué otros participantes colaboraron.
- [ ] **Trazabilidad colaborativa en insumos:** Al hacer clic sobre el nombre del operario en la tabla de materiales utilizados, se debe desplegar la lista completa de todos los participantes involucrados en esa instalación.



### 5. Logística de Insumos y Devoluciones
- [ ] **Logística Inversa (Devoluciones):** Desarrollar un circuito para devolver repuestos desde un tanque hacia el depósito por motivo de cambio o falla. Esta devolución debe quedar trazada con fecha y descontar la responsabilidad del operario al que se le había asignado.



### 7. Panel de Configuración Dinámica (Project Manager)
- [ ] **Creación dinámica de Roles/Cargos:** El Project Manager debe tener una opción en el sistema para crear nuevos cargos y asignarles nombres personalizados sin requerir intervención de programación.

### 8. Interfaz de Usuario (UX/UI) y Usabilidad en Fábrica
- [ ] **Diseño "Touch-Friendly":** Ampliar el tamaño de todas las ventanas, botones, modales y tipografías. El software es utilizado por operarios en el piso de fábrica, por lo que requiere controles grandes y fáciles de presionar.
- [ ] **Interacciones rápidas:** Privilegiar botones de selección rápida (botones toggle/chips) por sobre la escritura manual (inputs de texto) siempre que sea posible.
