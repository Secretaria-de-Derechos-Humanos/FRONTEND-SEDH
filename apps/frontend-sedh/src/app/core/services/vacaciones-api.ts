import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface SaldoVacaciones {
  idSaldoVacacion?: string;
  anio: number;
  diasAsignados: number;
  diasUtilizados: number;
  diasReservados: number;
  diasDisponibles: number;
}

export interface CrearSolicitudVacaciones {
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
}

export interface EstadoSolicitudVacaciones {
  idEstadoSolicitud?: string;
  nomEstado?: string;
  nomestado?: string;
}

export interface TipoSolicitudVacaciones {
  idTipoSolicitud?: string;
  nomTipo?: string;
  nomtipo?: string;
}

export interface SolicitudVacaciones {
  idVacaciones?: string;
  idVacacion?: string;

  fecSolicitud: string;
  fecInicial: string;
  fecFinal: string;
  fecRetorno?: string | null;

  cantVacaciones: number;
  observaciones?: string | null;

  idEstadoSolicitud: string;
  estadoSolicitud?: EstadoSolicitudVacaciones;

  idTipoSolicitud?: string;
  tipoSolicitud?: TipoSolicitudVacaciones;

  priAprobacion?: boolean | null;
  segAprobacion?: boolean | null;
  motRechazo?: string | null;

  // Datos del empleado
  idUsuario?: string;
  emailInstitucional?: string;
  numIdentidad?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
}

export interface SolicitudVacacionesCreada {
  message: string;
  diasSolicitados: number;
  diasDisponiblesAntes: number;
  diasDisponiblesDespues: number;
  solicitud: unknown;
}

export interface AprobarVacaciones {
  observacion?: string;
}

export interface RechazarVacaciones {
  motivoRechazo: string;
}

// =========================================================
// REPORTE DE VACACIONES
// =========================================================

export interface ReporteVacacionesEmpleado {
  idUsuario: string;
  identidad: string;
  nombreCompleto: string;
  tipoContratacion: string;
  anio: number;
  diasAsignados: number;
  diasUtilizados: number;
  diasReservados: number;
  diasDisponibles: number;
}

export interface ReporteVacacionesResponse {
  anio: number;
  totalEmpleados: number;
  empleados: ReporteVacacionesEmpleado[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VacacionesApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/rrhh/vacaciones`;

  // =========================================================
  // SALDO
  // =========================================================

  obtenerMiSaldo(): Observable<SaldoVacaciones> {
    return this.http
      .get<ApiResponse<SaldoVacaciones>>(
        `${this.apiUrl}/mi-saldo`,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =========================================================
  // CALCULAR DÍAS
  // =========================================================

  calcularDias(
    fechaInicio: string,
    fechaFin: string,
  ): Observable<number> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http
      .get<ApiResponse<number>>(
        `${this.apiUrl}/calcular-dias`,
        { params },
      )
      .pipe(
        map((respuesta) => Number(respuesta.data)),
      );
  }

  // =========================================================
  // CREAR SOLICITUD
  // =========================================================

  crearSolicitud(
    solicitud: CrearSolicitudVacaciones,
  ): Observable<SolicitudVacacionesCreada> {
    return this.http
      .post<ApiResponse<SolicitudVacacionesCreada>>(
        `${this.apiUrl}/solicitudes`,
        solicitud,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =========================================================
  // MIS SOLICITUDES
  // =========================================================

  obtenerMisSolicitudes(): Observable<SolicitudVacaciones[]> {
    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/mis-solicitudes`,
      )
      .pipe(
        map((respuesta) => respuesta.data ?? []),
      );
  }

  // =========================================================
  // SOLICITUDES PENDIENTES DEL JEFE
  // =========================================================

  obtenerPendientesJefe(): Observable<SolicitudVacaciones[]> {
    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/pendientes-jefe`,
      )
      .pipe(
        map((respuesta) => respuesta.data ?? []),
      );
  }

  // =========================================================
  // APROBAR COMO JEFE
  // =========================================================

  aprobarPorJefe(
    idVacaciones: string,
    observacion?: string,
  ): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/aprobar-jefe`,
        {
          observacion: observacion?.trim() || undefined,
        },
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =========================================================
  // PENDIENTES DE SUBGERENCIA
  // =========================================================

  obtenerPendientesSubgerente(): Observable<SolicitudVacaciones[]> {
    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/pendientes-subgerente`,
      )
      .pipe(
        map((respuesta) => respuesta.data ?? []),
      );
  }

  // =========================================================
  // APROBAR COMO SUBGERENCIA
  // =========================================================

  aprobarPorSubgerente(
    idVacaciones: string,
    observacion?: string,
  ): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/aprobar-subgerente`,
        {
          observacion: observacion?.trim() || undefined,
        },
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =========================================================
  // RECHAZAR
  // =========================================================

  rechazarVacaciones(
    idVacaciones: string,
    motivoRechazo: string,
  ): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/rechazar`,
        {
          motivoRechazo: motivoRechazo.trim(),
        },
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =========================================================
  // REPORTE DE VACACIONES
  // ROLES: 2, 3, 5
  // =========================================================

  obtenerReporteVacaciones(
    anio?: number,
  ): Observable<ReporteVacacionesResponse> {
    let params = new HttpParams();
    if (anio !== undefined) {
      params = params.set(
        'anio',
        anio.toString(),
      );
    }
    return this.http
      .get<ApiResponse<ReporteVacacionesResponse>>(
        `${this.apiUrl}/reporte`,
        { params },
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }
}
