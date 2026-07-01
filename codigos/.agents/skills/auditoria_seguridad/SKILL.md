---
name: security-audit
description: Audita la seguridad del código del proyecto, incluyendo vulnerabilidades en dependencias, brechas en control de accesos (RBAC), inyección de consultas e información sensible expuesta.
---

# Instrucciones para la Skill de Auditoría de Seguridad

Cuando el usuario solicite una auditoría de seguridad o análisis de vulnerabilidades, debes seguir estrictamente los siguientes pasos:

## 🔍 1. Análisis de Dependencias (Software Composition Analysis)
1. Ejecuta el script `scripts/audit.ps1` para buscar vulnerabilidades conocidas en las dependencias de Node.js en [package.json](file:///C:/Users/mcasals/Desktop/cideso/TAM/proyectotam/package.json).
2. Identifica paquetes desactualizados o vulnerables y clasifica los riesgos según su severidad (Baja, Media, Alta, Crítica).

## 🛡️ 2. Análisis del Control de Acceso (RBAC)
1. Revisa los archivos de Server Actions en [src/lib/actions](file:///C:/Users/mcasals/Desktop/cideso/TAM/proyectotam/src/lib/actions/) y las páginas protegidas.
2. Verifica que las mutaciones de base de datos críticas (como creación de usuarios, eliminación de stock o vehículos) validen correctamente el rol del usuario que realiza la petición (`role === 'project_manager'` o similar).

## 🗄️ 3. Seguridad de Datos e Inyecciones
1. Revisa que las consultas ejecutadas con Prisma en [src/lib/actions](file:///C:/Users/mcasals/Desktop/cideso/TAM/proyectotam/src/lib/actions/) utilicen los métodos seguros de Prisma y no concatenen variables de forma insegura en consultas directas (`$queryRaw`).

## 🔑 4. Exposición de Información Sensible
1. Verifica que no existan variables de entorno, claves de API o credenciales hardcodeadas en los archivos del repositorio (especialmente en archivos `.ts`, `.tsx` o archivos de configuración).
2. Asegúrate de que el archivo `.env` esté listado correctamente en `.gitignore`.

## 📊 5. Estructura del Reporte de Resultados
Genera un reporte de auditoría en formato markdown utilizando un artefacto en el directorio de la conversación llamado `reporte_auditoria_seguridad.md`. Utiliza la siguiente estructura:

* **Resumen Ejecutivo:** Una tabla resumen con la cantidad de vulnerabilidades encontradas por severidad.
* **Detalle de Hallazgos:** Una sección para cada problema detectado que incluya:
  * **Título del Hallazgo**
  * **Severidad:** (Baja / Media / Alta / Crítica)
  * **Ubicación del Código:** Enlace al archivo y línea afectada.
  * **Descripción:** Explicación técnica de la vulnerabilidad.
  * **Recomendación:** Código corregido o acción a tomar.
