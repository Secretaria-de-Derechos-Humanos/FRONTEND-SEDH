---
name: auto-version-bump
description: 'Actualiza automáticamente la versión en package.json después de cada cambio en el proyecto usando Semantic Versioning (MAJOR.MINOR.PATCH). Detecta el tipo de cambio según palabras clave: BREAKING/major para cambios incompatibles, feature/feat para nuevas funcionalidades, fix/patch para correcciones. Úsalo siempre que se modifiquen componentes, servicios, páginas, configuraciones o cualquier archivo del proyecto.'
user-invocable: false
---

# Auto Version Bump

## Propósito

Mantener actualizada automáticamente la versión del sistema en `package.json` después de cada cambio realizado mediante IA/chat, siguiendo las reglas de **Semantic Versioning**.

## Cuándo Usar

**Este skill debe ejecutarse SIEMPRE después de realizar cualquier cambio en archivos del proyecto**, incluyendo:

- Componentes Angular (`.ts`, `.html`, `.css`)
- Servicios y guards
- Configuraciones (`.json`, `.ts`)
- Rutas y layouts
- Modelos e interfaces
- Estilos globales o documentación

## Reglas de Versionado Semántico

El formato de versión es `MAJOR.MINOR.PATCH` (ejemplo: `2.1.5`):

### MAJOR (X.0.0) - Cambios Incompatibles
Incrementa cuando:
- **Palabras clave**: `BREAKING`, `breaking change`, `incompatible`, `remove API`, `major refactor`, `eliminación de funcionalidad`
- **Ejemplos**: Remover endpoints, cambiar interfaces públicas, eliminar componentes compartidos

### MINOR (0.X.0) - Nuevas Funcionalidades
Incrementa cuando:
- **Palabras clave**: `feature`, `feat`, `add`, `new component`, `new service`, `new page`, `nueva funcionalidad`, `implementar`, `agregar`
- **Ejemplos**: Crear nuevos componentes, añadir servicios, implementar páginas nuevas

### PATCH (0.0.X) - Correcciones y Mejoras
Incrementa cuando (por defecto):
- **Palabras clave**: `fix`, `bug`, `patch`, `update`, `refactor`, `style`, `docs`, `optimize`, `corregir`, `actualizar`, `mejorar`
- **Ejemplos**: Corregir errores, actualizar estilos, refactorizar código, documentación

## Procedimiento de Ejecución

### 1. Detectar Tipo de Cambio

Analiza la descripción del cambio realizado o el mensaje del usuario para identificar palabras clave. Prioridad:

1. **MAJOR**: Si contiene palabras de cambios incompatibles
2. **MINOR**: Si contiene palabras de nuevas funcionalidades
3. **PATCH**: Por defecto o si contiene palabras de correcciones

### 2. Leer Versión Actual

Lee el `package.json` y extrae la versión actual del campo `"version"`.

```json
{
  "version": "0.0.2"
}
```

### 3. Calcular Nueva Versión

Según el tipo de cambio detectado:

- **MAJOR**: `X.Y.Z` → `(X+1).0.0`
  - Ejemplo: `2.1.5` → `3.0.0`
- **MINOR**: `X.Y.Z` → `X.(Y+1).0`
  - Ejemplo: `2.1.5` → `2.2.0`
- **PATCH**: `X.Y.Z` → `X.Y.(Z+1)`
  - Ejemplo: `2.1.5` → `2.1.6`

### 4. Actualizar package.json

Modifica únicamente el campo `"version"` en `package.json` con la nueva versión calculada.

### 5. Confirmar al Usuario

Informa brevemente:
```
Versión actualizada: 0.0.2 → 0.1.0 (MINOR: nueva funcionalidad)
```

## Ejemplos de Uso

### Ejemplo 1: Crear Nuevo Componente
```
Usuario: "Crea un componente de tabla de usuarios con PrimeNG"
→ Detecta: "componente" → MINOR
→ Versión: 0.0.2 → 0.1.0
→ Mensaje: "Versión actualizada: 0.0.2 → 0.1.0 (MINOR: nuevo componente)"
```

### Ejemplo 2: Corregir Bug
```
Usuario: "Arregla el bug del sidebar que no cierra en móvil"
→ Detecta: "bug", "arregla" → PATCH
→ Versión: 0.1.0 → 0.1.1
→ Mensaje: "Versión actualizada: 0.1.0 → 0.1.1 (PATCH: corrección de bug)"
```

### Ejemplo 3: Breaking Change
```
Usuario: "Elimina el servicio de autenticación antiguo y usa uno nuevo incompatible"
→ Detecta: "elimina", "incompatible" → MAJOR
→ Versión: 0.1.1 → 1.0.0
→ Mensaje: "Versión actualizada: 0.1.1 → 1.0.0 (MAJOR: cambio incompatible)"
```

### Ejemplo 4: Actualizar Estilos
```
Usuario: "Actualiza los estilos del navbar para usar variables CSS"
→ Detecta: "actualiza", "estilos" → PATCH
→ Versión: 1.0.0 → 1.0.1
→ Mensaje: "Versión actualizada: 1.0.0 → 1.0.1 (PATCH: actualización de estilos)"
```

## Notas Importantes

- **Ejecutar DESPUÉS del cambio**: Primero completa la tarea solicitada, luego actualiza la versión
- **No preguntar al usuario**: La detección es automática según palabras clave
- **Siempre informar**: Indica qué versión se aplicó y por qué tipo de cambio
- **Un cambio = un incremento**: Aunque se modifiquen múltiples archivos, cuenta como un solo cambio
- **Caso ambiguo**: Si no hay palabras clave claras, usa **PATCH** por defecto

## Integración con Workflow

Este skill se ejecuta automáticamente al final de cada interacción que modifique archivos. El flujo típico es:

1. Usuario solicita cambio
2. Agente ejecuta la tarea (crea/modifica archivos)
3. **Auto Version Bump** se activa
4. Detecta tipo de cambio
5. Actualiza `package.json`
6. Informa al usuario

---

**Versión del Skill**: 1.0.0
**Autor**: Luis Cardona
**Fecha**: Abril 2026
