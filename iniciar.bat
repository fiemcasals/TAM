@echo off
title Proyecto TAM - Iniciando Entorno Portable...
echo ===================================================
echo             INICIANDO PROYECTO TAM (PORTABLE)
echo ===================================================
echo.

set PORTABLE_DIR=%~dp0codigos\portable
set NODE_DIR=%PORTABLE_DIR%\node
set PG_DIR=%PORTABLE_DIR%\pgsql
set PG_DATA=%PORTABLE_DIR%\data

:: 1. Verificar si existen las herramientas portables, de lo contrario descargarlas
if not exist "%NODE_DIR%" (
    goto download_tools
)
if not exist "%PG_DIR%" (
    goto download_tools
)
goto start_services

:download_tools
echo [INFO] No se detectaron las herramientas portables locales.
echo Descargando e instalando Node.js y PostgreSQL portables (esto se hace solo la primera vez)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0codigos\download_tools.ps1"
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron descargar las herramientas portables.
    echo Asegurate de tener conexion a Internet e intenta de nuevo.
    pause
    exit /b 1
)

:start_services
:: Añadir herramientas locales al PATH de esta sesión de consola
set PATH=%NODE_DIR%;%PG_DIR%\bin;%PATH%

:: 2. Inicializar base de datos PostgreSQL local si no existe la carpeta data
if not exist "%PG_DATA%" (
    echo Inicializando base de datos PostgreSQL local...
    initdb.exe -D "%PG_DATA%" -U userTAM --auth-local=trust --auth-host=trust
    if %errorlevel% neq 0 (
        echo [ERROR] No se pudo inicializar la base de datos local.
        pause
        exit /b 1
    )
)

:: 3. Iniciar el servidor de PostgreSQL local en segundo plano si no está corriendo
echo Verificando si PostgreSQL local esta corriendo...
pg_ctl.exe -D "%PG_DATA%" status >nul 2>&1
if %errorlevel% neq 0 (
    echo Iniciando motor de base de datos PostgreSQL local...
    pg_ctl.exe -D "%PG_DATA%" -l "%PORTABLE_DIR%\pg.log" start
    ping 127.0.0.1 -n 4 >nul
)

:: 4. Verificar/Crear base de datos
:: Crear la base de datos si no existe
createdb.exe -U userTAM -h localhost tam_db >nul 2>&1

cd /d "%~dp0codigos\proyectotam"

:: 4.5. Crear archivo .env si no existe a partir del template
if not exist ".env" (
    echo [INFO] No se encontro el archivo .env. Creandolo a partir de .env.example...
    copy .env.example .env >nul
)

:: 5. Instalar dependencias si falta node_modules (usando el npm portable)
if not exist "node_modules" (
    echo [INFO] Instalando dependencias de Node.js - esto puede tardar unos minutos...
    call npm install
)

:: 6. Sincronizar base de datos y semilla con Prisma (usando el node portable)
echo Sincronizando base de datos Prisma...
call npx prisma db push
echo Cargando datos iniciales de prueba...
call npx prisma db seed

:: 7. Iniciar Next.js y abrir navegador
echo Levantando servidor web Next.js...
start /min cmd /c "npm run dev"

echo Esperando a que el servidor este listo...
ping 127.0.0.1 -n 6 >nul

:: Obtener IP local para mostrarla en red
set LOCAL_IP=localhost
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress -First 1"`) do set LOCAL_IP=%%i

echo Abriendo navegador en http://localhost:3000...
start http://localhost:3000

echo.
echo ==========================================================
echo           !EL PROYECTO TAM SE HA INICIADO CON EXITO!
echo ==========================================================
echo.
echo  - Acceso desde esta PC: http://localhost:3000
echo.
if not "%LOCAL_IP%"=="localhost" (
    if not "%LOCAL_IP%"=="" (
        echo  - Acceso desde otras PC en la misma red local:
        echo    http://%LOCAL_IP%:3000
        echo.
    )
)
echo ==========================================================
echo Manten esta ventana abierta. Presiona cualquier tecla para apagar.
pause

echo Apagando servicios...
pg_ctl.exe -D "%PG_DATA%" stop
exit
