import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TipoSolicitud {
  idTipoSolicitud?: string;
  nomTipo: string;
}

export type OrigenSolicitud =
  | 'PERSONAL'
  | 'OFICIAL'
  | 'VACACIONES';

export interface AprobacionPendiente {
  id: string;
  idPermisoPersonal: string;
  idPermisoOficial?: string | null;
  idPermisoVaca?: string | null;

  categoria:
    | 'PERMISO_PERSONAL'
    | 'PERMISO_OFICIAL'
    | 'VACACIONES';

  origen: OrigenSolicitud;

  emailInstitucional: string;
  fecSolicitud: string;

  motivo?: string | null;
  observaciones?: string | null;

  horSalida?: string | null;
  horRetorno?: string | null;
  horSolicitadas?: string | number | null;
  idHorasDisponibles?: string | number | null;

  catEmergencia: boolean;
  guardiaTurno?: string | null;

  tipoSolicitud: TipoSolicitud;

  estado?: string | null;

  // Datos de vacaciones
  fecInicial?: string | null;
  fecFinal?: string | null;
  fecRetorno?: string | null;
  cantVacaciones?: number | null;

  perAnterior?: string | null;
  cantPerAnterior?: number | null;

  perActual?: string | null;
  cantPerActual?: number | null;

  totDiasPeriodos?: number | null;
  totDiasRestantes?: number | null;
}

export interface AprobacionHistorial {
  id: string;
  categoria: string;
  emailInstitucional: string;
  tipoSolicitud: string;
  fechaSolicitud: string;
  horaSalida: string | null;
  horaRetorno: string | null;
  horasSolicitadas: string | null;
  horasDisponibles: number | null;
  motivo: string;
  emergencia: boolean;
  estado: string;
  procesadoPor: string | null;
  segundaAprobacion: string | null;
  motivoRechazo: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Respuesta utilizada por el endpoint
 * de verificación de saldo de vacaciones.
 */
export interface VerificacionSaldoVacaciones {
  idPermisoVaca?: string;
  idUsuario?: string;
  diasSolicitados?: number;
  diasDisponibles?: number;
  tieneSaldo?: boolean;
  estado?: string;
  message?: string;
}

/**
 * Datos enviados al verificar el saldo.
 */
export interface VerificarSaldoRequest {
  observacion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AprobacionesApiService {

  private readonly http = inject(HttpClient);

  /**
   * Endpoints de aprobaciones generales.
   */
  private readonly apiUrl =
    `${environment.apiBaseUrl}/rrhh/aprobaciones`;

  /**
   * Endpoints específicos de vacaciones.
   */
  private readonly vacacionesUrl =
    `${environment.apiBaseUrl}/rrhh/vacaciones`;


  // ============================================================
  // PERMISOS
  // ============================================================

  listarPendientes(): Observable<AprobacionPendiente[]> {
    return this.http
      .get<ApiResponse<AprobacionPendiente[]>>(
        `${this.apiUrl}/pendientes`,
      )
      .pipe(
        map((respuesta) => respuesta.data ?? []),
      );
  }


  listarHistorial(): Observable<AprobacionHistorial[]> {
    return this.http
      .get<ApiResponse<AprobacionHistorial[]>>(
        `${this.apiUrl}/historial`,
      )
      .pipe(
        map((respuesta) => respuesta.data ?? []),
      );
  }


  aprobar(
    idPermisoPersonal: string,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/personal/${idPermisoPersonal}/aprobar`,
      {},
    );
  }


  rechazar(
    idPermisoPersonal: string,
    motivoRechazo: string,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/personal/${idPermisoPersonal}/rechazar`,
      {
        motivoRechazo,
      },
    );
  }


  // ============================================================
// VACACIONES - VERIFICACIÓN DE SALDO
// ============================================================

listarVacacionesPendientesVerificacion():
  Observable<AprobacionPendiente[]> {

  return this.http
    .get<ApiResponse<AprobacionPendiente[]>>(
      `${this.vacacionesUrl}/pendientes-verificacion`,
    )
    .pipe(
      map((respuesta) => respuesta.data ?? []),
    );
}


/**
 * Verifica el saldo disponible de vacaciones.
 *
 * Si el empleado tiene suficientes días:
 * - Se da visto bueno.
 * - La solicitud continúa hacia Recursos Humanos.
 *
 * Si no tiene suficientes días:
 * - La solicitud se rechaza.
 *
 * POST:
 * /api/v1/rrhh/vacaciones/{id}/verificar-saldo
 */
verificarSaldoVacaciones(
  idPermisoVaca: string,
  observacion = 'Verificación de saldo de vacaciones.',
): Observable<unknown> {

  return this.http.post(
    `${this.vacacionesUrl}/${idPermisoVaca}/verificar-saldo`,
    {
      observacion,
    },
  );
}
}
