---
name: api-http-conventions
description: 'Convenciones de comunicación HTTP con el backend SEDH. Define cómo construir servicios Angular que consumen la API REST: cliente HTTP, formato de cuerpos, manejo de respuestas y errores. Úsalo SIEMPRE que crees o modifiques un servicio que llame a un endpoint del backend.'
user-invocable: false
---

# SKILL: Convenciones de Comunicación HTTP — SEDH

## Cliente HTTP

El proyecto usa **`HttpClient` de Angular** (`@angular/common/http`).  
**No se usa Axios** ni ninguna otra librería de HTTP externa.  
El interceptor `authInterceptor` inyecta automáticamente el header `Authorization: Bearer <token>` en todas las peticiones que no sean de autenticación.

---

## Regla fundamental: TODO va en el body como JSON

> **Nunca envíes datos como query params (`?param=valor`) ni como segmentos en la URL.**  
> Toda información enviada al backend debe ir en el **cuerpo de la petición como JSON**.

Esto aplica incluso a identificadores como el email del empleado:

```typescript
// ✅ CORRECTO
this.http.post('/api/v1/rrhh/endpoint', { email: 'usuario@sedh.gob.hn' })

// ❌ INCORRECTO — nunca query params
this.http.get('/api/v1/rrhh/endpoint', { params: new HttpParams().set('email', '...') })

// ❌ INCORRECTO — nunca en la URL
this.http.get('/api/v1/rrhh/endpoint/usuario@sedh.gob.hn')
```

---

## Verbo HTTP según operación

| Operación | Verbo | Body |
|---|---|---|
| Consultar datos del usuario autenticado | `POST` | `{ email }` u otros filtros |
| Consultar listados generales (sin datos privados) | `GET` | — |
| Crear un recurso | `POST` | datos del recurso |
| Actualizar un recurso | `PUT` / `PATCH` | datos a actualizar |
| Eliminar un recurso | `DELETE` | `{ id }` u identificador en body |

---

## Cómo obtener el email del usuario autenticado

El email **nunca se hardcodea** — siempre se extrae del JWT en sesión usando `AuthService`:

```typescript
import { AuthService } from '../../../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class MiServicio {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get emailBody(): { email: string } {
    return { email: this.authService.currentUser()?.email ?? '' };
  }
}
```

---

## Estructura de un servicio Angular — plantilla base

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

// ── Interfaces de respuesta API ──────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  path: string;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MiServicio {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = environment.apiBaseUrl;

  private get emailBody(): { email: string } {
    return { email: this.authService.currentUser()?.email ?? '' };
  }

  getMisDatos(): Observable<MiModelo[]> {
    return this.http
      .post<ApiResponse<{ items: MiModeloApi[] }>>(
        `${this.base}/modulo/endpoint`,
        this.emailBody
      )
      .pipe(map(r => r.data.items.map(mapModelo)));
  }
}
```

---

## Estructura de respuesta del backend

Todas las respuestas del backend siguen este formato:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "timestamp": "2026-05-08T00:00:00.000Z",
  "path": "/api/v1/modulo/endpoint"
}
```

Cuando `success` es `false`, el campo `data` puede ser `null` y habrá un campo `error` con detalles:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "No tiene permisos para acceder a este recurso",
    "details": []
  }
}
```

---

## Manejo de errores en el componente

Usa `forkJoin` para llamadas paralelas y maneja errores en el bloque `error`:

```typescript
forkJoin({
  datos: this.miServicio.getMisDatos(),
  extras: this.miServicio.getMisExtras()
}).subscribe({
  next: ({ datos, extras }) => {
    this.datos.set(datos);
    this.extras.set(extras);
    this.isActualizando.set(false);
  },
  error: () => {
    this.errorMessage.set('No fue posible cargar los datos. Intente de nuevo más tarde.');
    this.isActualizando.set(false);
  }
});
```

---

## URL base

| Ambiente | URL base |
|---|---|
| Desarrollo | `/api/v1` (reescrito por proxy a `https://api.sedh.gob.hn/api/v1`) |
| Producción | `https://api.sedh.gob.hn/api/v1` |

Siempre usa `environment.apiBaseUrl` — nunca hardcodees la URL.

---

## Reglas de importación de rutas

El `environment` y `AuthService` están en rutas fijas. Ajusta los `../` según la profundidad del servicio:

```
src/app/
├── services/auth.service.ts          ← AuthService
└── pages/modulo/submodulo/mi.service.ts
    → import AuthService desde '../../../services/auth.service'

src/environments/environment.ts       ← environment
    → import desde '../../../../environments/environment'
```

Cuenta los niveles desde el archivo del servicio hasta `src/app/` para `AuthService`
y hasta `src/` para `environment`.
