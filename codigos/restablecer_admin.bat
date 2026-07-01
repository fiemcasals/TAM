@echo off
title TAM 2C - Recuperador de Administrador
echo ===================================================
echo       INICIANDO PROGRAMA DE RECUPERACION
echo ===================================================
echo.

:: Verificar si python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo encontrar Python en el sistema.
    echo Por favor, asegúrate de tener Python instalado y agregado al PATH de Windows.
    echo Descarga: https://www.python.org/
    echo.
    pause
    exit /b 1
)

:: Ejecutar el script de interfaz gráfica
python "%~dp0restablecer_admin.py"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ocurrio un error al ejecutar el programa de recuperacion.
    pause
)
