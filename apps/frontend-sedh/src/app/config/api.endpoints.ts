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
export const EP_RRHH_PERMISOS_OFICIALES_INSERTAR        = '/rrhh/permisos-oficiales/insertar';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Aprobaciones
// ─────────────────────────────────────────────────────────────────────────────

export const EP_RRHH_JEFE_INMEDIATO_PENDIENTES = '/rrhh/jefe-inmediato/pendientes';
export const EP_RRHH_JEFE_INMEDIATO_RESPONDER  = '/rrhh/jefe-inmediato/responder';
export const EP_RRHH_SUBGERENTE_PENDIENTES     = '/rrhh/subgerente/pendientes';
export const EP_RRHH_SUBGERENTE_RESPONDER      = '/rrhh/subgerente/responder';
export const EP_RRHH_AGENTE_SEGURIDAD_SOLICITUDES = '/rrhh/agente-seguridad/solicitudes';
export const EP_RRHH_AGENTE_SEGURIDAD_HORA_SALIDA  = '/rrhh/agente-seguridad/hora-salida';
export const EP_RRHH_AGENTE_SEGURIDAD_HORA_RETORNO = '/rrhh/agente-seguridad/hora-retorno';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Reportes
// ─────────────────────────────────────────────────────────────────────────────

export const EP_RRHH_REPORTES_PERMISOS_POR_MES = '/rrhh/reportes-permisos/por-mes';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Recursos Humanos — Gestión de empleados
// ─────────────────────────────────────────────────────────────────────────────

export const EP_RRHH_EMPLEADOS_BUSCAR = '/rrhh/empleados/buscar';


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Almacén
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Finanzas
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO: Administrativa
// ─────────────────────────────────────────────────────────────────────────────
