# Script de auditoría de seguridad para dependencias
# Ejecuta npm audit en el directorio proyectotam

$projectPath = "C:\Users\mcasals\Desktop\cideso\TAM\proyectotam"

if (Test-Path $projectPath) {
    Write-Output "Posicionándose en $projectPath..."
    Set-Location $projectPath
    Write-Output "Ejecutando npm audit..."
    npm audit
} else {
    Write-Error "No se pudo encontrar el directorio del proyecto en $projectPath"
    exit 1
}
