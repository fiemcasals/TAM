#!/bin/bash
# ==============================================================================
# Script de Respaldo Automatizado de Base de Datos (PostgreSQL Dockerizado)
# Proyecto TAM 2C
# ==============================================================================

# Nombre de la carpeta de respaldos (relativa a la raíz del proyecto)
BACKUP_DIR_NAME="backups_sistema"

# Determinar directorios basados en la ubicación del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/$BACKUP_DIR_NAME"
TEMP_DIR="/tmp/tam_db_backup"

# Crear directorios necesarios
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

# 1. Cargar variables de entorno desde el archivo .env si existe
ENV_FILE="$SCRIPT_DIR/proyectotam/.env"
if [ -f "$ENV_FILE" ]; then
    echo "[INFO] Cargando configuraciones desde .env..."
    # Leer variables ignorando comentarios y líneas vacías
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^[[:space:]]*$' | xargs)
fi

# Parámetros de base de datos (con valores por defecto si no están definidos)
DB_USER=${POSTGRES_USER:-userTAM}
DB_NAME=${POSTGRES_DB:-tam_db}
DB_PASSWORD=${POSTGRES_PASSWORD:-passwordTAM}
CONTAINER_NAME="tam_db"

# 2. Generar marca de tiempo
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_SQL_FILE="backup_${TIMESTAMP}.sql"
BACKUP_TAR_FILE="backup_${TIMESTAMP}.tar.gz"

echo "=========================================================="
echo "    INICIANDO RESPALDO DE BASE DE DATOS: $DB_NAME"
echo "=========================================================="
echo "Fecha y hora: $(date)"
echo "Contenedor origen: $CONTAINER_NAME"
echo "Usuario base de datos: $DB_USER"
echo "Destino temporal: $TEMP_DIR/$BACKUP_SQL_FILE"

# 3. Verificar si el contenedor está en ejecución
if ! docker ps --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
    echo "[ERROR] El contenedor '$CONTAINER_NAME' no esta en ejecucion."
    echo "Asegurese de levantar los servicios con 'docker compose up -d' primero."
    exit 1
fi

# 4. Generar el volcado de la base de datos sin detener el servicio
echo "[INFO] Extrayendo volcado SQL de la base de datos..."
if docker exec -e PGPASSWORD="$DB_PASSWORD" -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$TEMP_DIR/$BACKUP_SQL_FILE"; then
    echo "[OK] Volcado extraido correctamente."
else
    echo "[ERROR] Fallo la extraccion del volcado de la base de datos."
    exit 1
fi

# 5. Comprimir el archivo en un .tar.gz
echo "[INFO] Comprimiendo respaldo a formato .tar.gz..."
if tar -czf "$BACKUP_DIR/$BACKUP_TAR_FILE" -C "$TEMP_DIR" "$BACKUP_SQL_FILE"; then
    echo "[OK] Respaldo comprimido guardado en: $BACKUP_DIR/$BACKUP_TAR_FILE"
else
    echo "[ERROR] Fallo la compresion del archivo de respaldo."
    rm -f "$TEMP_DIR/$BACKUP_SQL_FILE"
    exit 1
fi

# Limpiar el volcado SQL temporal
rm -f "$TEMP_DIR/$BACKUP_SQL_FILE"

# 6. Limpieza de respaldos locales antiguos (mayores a 7 días)
echo "[INFO] Rotando respaldos locales antiguos (mayores a 7 dias)..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +7 -exec rm -f {} \; -exec echo "[ROTACION] Eliminado respaldo antiguo: {}" \;

# ==============================================================================
# 7. REPLICACIÓN HACIA COMPUTADORAS CLIENTE
# ==============================================================================
echo "[INFO] Preparando replicacion en red local..."

# OPCIÓN A: Replicación activa usando rsync (Requiere llaves SSH configuradas en los clientes)
# Descomente las siguientes líneas y ajuste IPs y rutas de destino según su red local:
# ------------------------------------------------------------------------------
# PC_CLIENTE_1="192.168.1.101"
# PC_CLIENTE_2="192.168.1.102"
# RUTA_DESTINO="/home/usuario/TAM/backups_sistema/"
# USUARIO_CLIENTE="operario"
#
# echo "[RSYNC] Replicando a PC Cliente 1 ($PC_CLIENTE_1)..."
# rsync -avz --delete "$BACKUP_DIR/" "$USUARIO_CLIENTE@$PC_CLIENTE_1:$RUTA_DESTINO"
#
# echo "[RSYNC] Replicando a PC Cliente 2 ($PC_CLIENTE_2)..."
# rsync -avz --delete "$BACKUP_DIR/" "$USUARIO_CLIENTE@$PC_CLIENTE_2:$RUTA_DESTINO"

# OPCIÓN B: Replicación pasiva automatizada usando Syncthing (Recomendado)
# ------------------------------------------------------------------------------
# Syncthing es ideal para este entorno ya que maneja la sincronización en segundo plano sin dependencias de terminal.
# Para configurar Syncthing:
# 1. Instale Syncthing en la PC Servidor y en las 2 PCs clientes de la red.
# 2. En la interfaz web del Servidor (http://localhost:8384), agregue la carpeta local:
#    Ruta: $BACKUP_DIR
# 3. Vincule los IDs de las computadoras clientes en la sección "Dispositivos Remotos".
# 4. Comparta la carpeta agregada con ambos clientes.
# 5. En las interfaces web de las computadoras clientes, acepte la carpeta compartida y defina la ruta local de guardado.
# 6. Syncthing replicará de manera inmediata y bidireccional los nuevos respaldos generados.

echo "=========================================================="
echo "    RESPALDO FINALIZADO CON EXITO"
echo "=========================================================="
echo "Archivo: $BACKUP_TAR_FILE"
echo "Ruta local: $BACKUP_DIR"
echo "=========================================================="
exit 0
