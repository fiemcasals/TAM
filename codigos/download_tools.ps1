# download_tools.ps1
$ErrorActionPreference = "Stop"

# Directorio portable
$portableDir = Join-Path $PSScriptRoot "portable"
if (-not (Test-Path $portableDir)) {
    New-Item -ItemType Directory -Path $portableDir | Out-Null
}

$tempDir = Join-Path $portableDir "temp"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# 1. Descargar y Extraer Node.js
$nodeZip = Join-Path $tempDir "node.zip"
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$nodeDest = Join-Path $portableDir "node"

if (-not (Test-Path $nodeDest)) {
    Write-Host "[1/2] Descargando Node.js portable..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeZip -UseBasicParsing
    
    Write-Host "[1/2] Extrayendo Node.js..."
    Expand-Archive -Path $nodeZip -DestinationPath $tempDir -Force
    
    # Mover la carpeta extraída a su destino final
    $extractedNodeDir = Get-ChildItem -Path $tempDir -Filter "node-v20.11.1-win-x64" -Directory | Select-Object -First 1
    Move-Item -Path $extractedNodeDir.FullName -Destination $nodeDest -Force
}

# 2. Descargar y Extraer PostgreSQL
$pgZip = Join-Path $tempDir "postgresql.zip"
$pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64-binaries.zip"
$pgDest = Join-Path $portableDir "pgsql"

if (-not (Test-Path $pgDest)) {
    Write-Host "[2/2] Descargando PostgreSQL binaries..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $pgUrl -OutFile $pgZip -UseBasicParsing
    
    Write-Host "[2/2] Extrayendo PostgreSQL..."
    Expand-Archive -Path $pgZip -DestinationPath $tempDir -Force
    
    # Mover la carpeta extraída ('pgsql') a su destino final
    $extractedPgDir = Join-Path $tempDir "pgsql"
    Move-Item -Path $extractedPgDir -Destination $pgDest -Force
}

# Limpiar archivos temporales
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

Write-Host "Descarga y extraccion completadas con exito!"
