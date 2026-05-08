/**
 * Barril de endpoints del sistema SEDH.
 *
 * Convenciones:
 * - Cada constante es la ruta relativa SIN la URL base (sin /api/v1).
 * - En los servicios: `${environment.apiBaseUrl}${EP_NOMBRE}`
 * - Todas las peticiones se realizan con POST y body JSON.
 * - Organizado por módulo. Agrega nuevos endpoints al módulo correspondiente.
 */

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Autenticación
// ─────────────────────────────────────────────────────────────────────────────

export const EP_AUTH_LOGIN          = '/auth/login';
export const EP_AUTH_REFRESH        = '/auth/refresh';
export const EP_AUTH_LOGOUT         = '/auth/logout';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Solicitudes de empleado
// ─────────────────────────────────────────────────────────────────────────────

export const EP_RRHH_MIS_SOLICITUDES                  = '/rrhh/solicitudes-empleados/mis-solicitudes';
export const EP_RRHH_MIS_SOLICITUDES_EMERGENCIA        = '/rrhh/solicitudes-empleados/mis-solicitudes-emergencia';
export const EP_RRHH_DATOS_PERMISO                     = '/rrhh/solicitudes-empleados/datos-permiso';
export const EP_RRHH_PERMISOS_PERSONALES_INSERTAR      = '/rrhh/permisos-personales/insertar';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Aprobaciones
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Gestión de empleados
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Almacén
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Finanzas
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Administrativa
// ─────────────────────────────────────────────────────────────────────────────
