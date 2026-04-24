---
name: rae-grammar
description: Gramática y redacción institucional para textos de interfaz de usuario, basada en las normas de la Real Academia Española (RAE). Aplica a todos los textos visibles en componentes HTML.
---

# SKILL: Gramática RAE para UI

## Cuándo aplicar este skill

Aplica **siempre** que se cree o modifique cualquier texto visible en un template HTML:
- Títulos, subtítulos, encabezados
- Etiquetas de campos (`label`)
- Placeholders de inputs
- Mensajes de error y validación
- Texto de botones y acciones
- Tooltips, descripciones, ayuda contextual
- Mensajes vacíos, confirmaciones, alertas

---

## Tratamiento al usuario

El sistema SEDH es institucional. Se usa siempre **usted** (forma de respeto), nunca tuteo.

| Incorrecto | Correcto |
|---|---|
| Ingresa tu usuario | Ingrese su usuario |
| Escribe tu contraseña | Escriba su contraseña |
| ¿Olvidaste tu contraseña? | ¿Olvidó su contraseña? |
| Tu sesión ha expirado | Su sesión ha expirado |

---

## Mayúsculas

La RAE establece que **solo la primera palabra lleva mayúscula** en títulos y encabezados. No se usa Title Case inglés.

| Incorrecto | Correcto |
|---|---|
| Gestión De Recursos Humanos | Gestión de recursos humanos |
| Iniciar Sesión | Iniciar sesión |
| Nueva Solicitud De Permiso | Nueva solicitud de permiso |
| Datos Del Empleado | Datos del empleado |

**Excepción**: nombres propios, siglas y nombres de entidades oficiales siempre van en mayúscula.

```html
<!-- ✅ Correcto -->
<h1>Gestión de recursos humanos</h1>
<p-button label="Iniciar sesión" />

<!-- ❌ Incorrecto -->
<h1>Gestión De Recursos Humanos</h1>
<p-button label="Iniciar Sesión" />
```

---

## Puntuación en la interfaz

### Labels y encabezados — sin punto final

Los labels, títulos y encabezados **no llevan punto final**.

| Incorrecto | Correcto |
|---|---|
| Nombre del empleado. | Nombre del empleado |
| Fecha de ingreso. | Fecha de ingreso |

### Mensajes de error y validación — con punto final

Los mensajes de error, advertencia y ayuda contextual **sí llevan punto final** porque son oraciones completas.

| Incorrecto | Correcto |
|---|---|
| Este campo es obligatorio | Este campo es obligatorio. |
| La contraseña debe tener al menos 6 caracteres | La contraseña debe tener al menos 6 caracteres. |
| Usuario no encontrado | Usuario no encontrado. |

### Preguntas — signos de apertura y cierre obligatorios

La RAE exige el signo de apertura `¿`.

| Incorrecto | Correcto |
|---|---|
| ¿Olvidó su contraseña? | ¿Olvidó su contraseña? |
| ¿Está seguro que desea eliminar este registro? | ¿Está seguro de que desea eliminar este registro? |

> Nota: La RAE recomienda **"seguro de que"**, no "seguro que".

---

## Acentuación

Respetar siempre las tildes, incluyendo en mayúsculas.

| Incorrecto | Correcto |
|---|---|
| Autenticacion | Autenticación |
| Informacion | Información |
| Gestion | Gestión |
| Numero | Número |
| Ultima sesion | Última sesión |
| AUTENTICACION | AUTENTICACIÓN |

---

## Placeholders

Los placeholders deben ser breves y descriptivos, en **minúscula** (no son títulos) y **sin punto final**.

```html
<!-- ✅ Correcto -->
<input placeholder="Ingrese su usuario" />
<input placeholder="Correo electrónico institucional" />

<!-- ❌ Incorrecto -->
<input placeholder="Usuario" />              <!-- demasiado escueto -->
<input placeholder="Ingrese Su Usuario." />  <!-- mayúscula interna + punto -->
```

---

## Botones y acciones

Los botones usan **infinitivo** para acciones directas. No se usan gerundios ni imperativo en botones primarios.

| Incorrecto | Correcto |
|---|---|
| Guardando | Guardar |
| Guarda | Guardar |
| Envía | Enviar |
| Procesando solicitud | Procesar solicitud |

**Botones de confirmación destructiva** — usar infinitivo con objeto claro:

| Incorrecto | Correcto |
|---|---|
| Sí | Sí, eliminar |
| Confirmar | Confirmar eliminación |
| Borrar | Eliminar registro |

---

## Mensajes de estado vacío

Cuando una lista o tabla no tiene registros, el mensaje sigue la estructura: **oración completa con punto final**.

```html
<!-- ✅ Correcto -->
<p>No se encontraron registros.</p>
<p>No hay solicitudes pendientes.</p>

<!-- ❌ Incorrecto -->
<p>Sin resultados</p>
<p>No hay datos</p>
```

---

## Género gramatical

Usar lenguaje neutro o institucional cuando el género del usuario es desconocido. Preferir sustantivos colectivos o neutros.

| Evitar | Preferir |
|---|---|
| El/la usuario/a | La persona usuaria / El usuario |
| Bienvenido/a | Bienvenido al sistema |
| Estimado/a empleado/a | Estimado colaborador |

---

## Numeración y fechas

Seguir el formato institucional estándar:

```
Fechas:   24 de abril de 2026  (no: 24/04/2026 en textos visibles)
Hora:     14:30 h              (no: 2:30 PM)
Moneda:   $ 1,250.00           (peso mexicano, espacio tras símbolo)
```

---

## Palabras frecuentes en interfaces — versión correcta

| Incorrecto | Correcto |
|---|---|
| Login | Iniciar sesión |
| Logout / Cerrar sesion | Cerrar sesión |
| Dashboard | Panel principal |
| Password | Contraseña |
| Email | Correo electrónico |
| Username | Usuario |
| Settings | Configuración |
| Profile | Perfil |
| Upload | Cargar archivo |
| Download | Descargar |
| Check-in | Registro de entrada |
