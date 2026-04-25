---
name: sedh-design-system
description: Sistema de diseño oficial SEDH. Paleta de colores institucional (azul y dorado), variables CSS, espaciado, theming oscuro/claro e integración con PrimeNG.
---

# SKILL: SEDH Design System

## Cuándo aplicar este skill

Aplica este skill **siempre** que Luis Cardona pida crear o modificar:
- Componentes con estilos visuales
- Layouts, tarjetas, formularios, tablas, botones, badges, alerts
- Cualquier elemento que use color, espaciado, sombra o tipografía

---

## Regla de oro

> **NUNCA uses valores hex directos en archivos `.css` de componentes.**
> Usa siempre las variables `--sedh-*` definidas en `styles.css`.

---

## Paleta de colores SEDH

### Azul institucional — primario

| Variable | Valor | Uso |
|---|---|---|
| `--sedh-primary-50`  | `#F1F4FB` | Fondos muy suaves, hover states |
| `--sedh-primary-100` | `#DEE6F6` | Fondo de chips/badges informativos |
| `--sedh-primary-300` | `#8FA8E0` | Bordes, iconos secundarios |
| `--sedh-primary-400` | `#5F7FD0` | Hover de elementos primarios |
| `--sedh-primary-500` | `#264DA0` | **Color base. Botones, links, iconos activos** |
| `--sedh-primary-700` | `#182F63` | Texto sobre fondo claro, active state |
| `--sedh-primary-900` | `#080F21` | Texto oscuro, énfasis máximo |

### Dorado institucional — secundario

| Variable | Valor | Uso |
|---|---|---|
| `--sedh-secondary-50`  | `#FDF8EB` | Fondo alertas de éxito |
| `--sedh-secondary-100` | `#FAEDC7` | Fondo chips de éxito |
| `--sedh-secondary-300` | `#EABF44` | Iconos, decoraciones |
| `--sedh-secondary-500` | `#AD8411` | **Color base. Acciones secundarias, badges éxito** |
| `--sedh-secondary-700` | `#684F0A` | Hover de elementos secundarios |

### Grises neutros

| Variable | Uso |
|---|---|
| `--sedh-gray-50`  | Fondo general página (modo claro) |
| `--sedh-gray-100` | Fondo de filas alternas en tablas |
| `--sedh-gray-200` | Bordes, divisores |
| `--sedh-gray-500` | Texto muted, placeholders |
| `--sedh-gray-700` | Bordes oscuros, modo oscuro |
| `--sedh-gray-800` | Superficie en modo oscuro |
| `--sedh-gray-900` | Fondo página modo oscuro |

---

## Variables semánticas (USAR ESTAS en componentes)

```css
/* Layout */
--sedh-bg         → fondo de página
--sedh-surface    → fondo de tarjetas/paneles
--sedh-border     → bordes generales
--sedh-text       → texto principal
--sedh-text-muted → texto secundario/placeholder

/* Estados */
--sedh-success        → dorado base  (#AD8411)
--sedh-success-light  → fondo suave éxito
--sedh-success-dark   → hover éxito

--sedh-info           → azul base (#264DA0)
--sedh-info-light     → fondo suave informativo
--sedh-info-dark      → hover informativo

--sedh-warning        → azul medio (#778FCD)
--sedh-warning-light  → fondo suave advertencia
--sedh-warning-dark   → hover advertencia

--sedh-danger         → rojo (#C62828) ← ÚNICO color externo permitido
--sedh-danger-light   → fondo suave error
--sedh-danger-dark    → hover error
```

---

## Cuándo usar azul vs dorado

| Situación | Color a usar | Ejemplo |
|---|---|---|
| Acción principal, CTA | `--sedh-primary-500` | Botón "Guardar", "Enviar" |
| Acción secundaria | `--sedh-secondary-500` | Botón "Ver detalle" |
| Confirmación / Éxito | `--sedh-success` (dorado) | "Registro guardado", checkmark |
| Información / Guía | `--sedh-info` (azul) | Tooltip, ayuda contextual |
| Advertencia suave | `--sedh-warning` (azul medio) | "Datos incompletos" |
| Error / Destructivo | `--sedh-danger` (rojo) | "Campo requerido", "Eliminar" |

---

## Espaciado

```css
--sedh-space-xs:  4px   /* Separación mínima entre iconos/texto */
--sedh-space-sm:  8px   /* Gap interno de chips, badges */
--sedh-space-md:  16px  /* Padding de tarjetas, inputs */
--sedh-space-lg:  24px  /* Separación entre secciones */
--sedh-space-xl:  32px  /* Márgenes de layout */
--sedh-space-2xl: 48px  /* Separación mayor entre bloques */
```

---

## Sombras y radios

```css
--sedh-radius:    6px   /* Componentes normales (cards, inputs, botones) */
--sedh-radius-lg: 12px  /* Modales, paneles grandes */
--sedh-shadow-sm:       /* Tarjetas en reposo */
--sedh-shadow-md:       /* Tarjetas en hover, modales */
```

---

## Breakpoints responsive (mobile-first)

```css
/* xs  < 576px  — Móvil pequeño (base, sin @media) */
/* sm  >= 576px — Móvil */
/* md  >= 768px — Tablet */
/* lg  >= 992px — Desktop */
/* xl  >= 1200px — Desktop grande */
/* xxl >= 1400px — Pantalla ancha */
```

Ejemplo de uso:
```css
.miComponente {
  padding: var(--sedh-space-sm);         /* móvil base */
}
@media (min-width: 768px) {
  .miComponente {
    padding: var(--sedh-space-md);       /* tablet+ */
  }
}
```

---

## Theming: modo claro y oscuro

El tema oscuro se activa con la clase `.dark-theme` en el `<html>` o `<body>`.
Las variables semánticas (`--sedh-bg`, `--sedh-surface`, `--sedh-text`, etc.)
cambian automáticamente — **NO necesitas duplicar reglas en el componente**.

```typescript
// En el servicio de tema
toggleTheme(): void {
  document.body.classList.toggle('dark-theme');
}
```

Los colores primario y secundario **NO cambian** entre temas — solo cambian
los fondos, superficies y textos semánticos.

---

## Integración con PrimeNG

PrimeNG usa el preset **Aura** configurado con `darkModeSelector: '.dark-theme'`.
Para sobrescribir tokens de PrimeNG, usa el layer `primeng`:

```css
/* En el .css del componente */
:host ::ng-deep .p-button {
  background: var(--sedh-primary-500);
  border-color: var(--sedh-primary-500);
}
:host ::ng-deep .p-button:hover {
  background: var(--sedh-primary-400);
}
```

---

## Plantilla base de componente con estilos SEDH

```css
:host {
  display: block;
}

/* — claro — */
.card {
  background: var(--sedh-surface);
  border: 1px solid var(--sedh-border);
  border-radius: var(--sedh-radius);
  box-shadow: var(--sedh-shadow-sm);
  padding: var(--sedh-space-md);
  color: var(--sedh-text);
}

.card__title {
  color: var(--sedh-primary-700);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--sedh-space-sm);
}

.card__subtitle {
  color: var(--sedh-text-muted);
  font-size: 0.875rem;
}

.badge--success {
  background: var(--sedh-success-light);
  color: var(--sedh-success-dark);
  border-radius: var(--sedh-radius);
  padding: 2px var(--sedh-space-sm);
}

.badge--danger {
  background: var(--sedh-danger-light);
  color: var(--sedh-danger-dark);
  border-radius: var(--sedh-radius);
  padding: 2px var(--sedh-space-sm);
}

/* — oscuro — */
.dark-theme .card {
  background: var(--sedh-gray-800);
  border-color: var(--sedh-gray-700);
}

.dark-theme .card__title {
  color: var(--sedh-secondary-300);
}

/* — móvil — */
@media (max-width: 576px) {
  .card {
    padding: var(--sedh-space-sm);
  }
}
```

---

## Organización del CSS por componente

### Regla de estructura

Cada sección o bloque de un componente debe seguir **siempre este orden**:

```
1. Modo claro (base — sin modificador)
2. Modo oscuro (.dark-theme .clase)
3. Responsive (@media)
```

### `:host` — solo al inicio

`:host` solo se usa **al inicio del archivo** para propiedades del propio elemento host (como `display` o `min-height`).

### Comentarios — MÍNIMOS y solo estos tres

Los únicos comentarios permitidos en un `.css` de componente son los marcadores de sección:

```css
/* — claro — */
/* — oscuro — */
/* — móvil — */
```

**No se permiten** comentarios explicativos, anotaciones, aclaraciones ni separadores decorativos dentro de los bloques CSS. El código debe ser legible sin comentarios adicionales.

### Patrón obligatorio

```css
:host {
  display: block;
}

/* — claro — */
.mi-clase {
  background: var(--sedh-surface);
  border: 1px solid var(--sedh-border);
  color: var(--sedh-text);
}

.mi-clase__titulo {
  color: var(--sedh-primary-700);
  font-weight: 600;
}

/* — oscuro — */
.dark-theme .mi-clase {
  background: var(--sedh-gray-800);
}

.dark-theme .mi-clase__titulo {
  color: var(--sedh-secondary-300);
}

/* — móvil — */
@media (max-width: 576px) {
  .mi-clase {
    padding: var(--sedh-space-sm);
  }
}
```

> **PrimeNG**: `:host ::ng-deep` es la única excepción fuera del inicio del archivo. Sigue el mismo orden claro → oscuro.

```css
/* ❌ Prohibido */
:host-context(.dark-theme) .mi-clase { ... }
/* Explicación inline de por qué se usa este color */
/* ===================== separadores =================== */
```

---

## Lo que está prohibido

- ❌ Colores hex directos en `.css` de componentes
- ❌ `color: blue`, `background: white` u otros valores literales
- ❌ Importar o usar Angular Material
- ❌ Generar archivos `.spec.ts`
- ❌ Usar `green` o `orange` para estados — usa los semánticos SEDH
