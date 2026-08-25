import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

// =========================================================
// SALDO DE VACACIONES
// =========================================================

export interface SaldoVacaciones {
  idSaldoVacacion?: string;

  anio: number;

  diasAsignados: number;
  diasUtilizados: number;
  diasReservados: number;
  diasDisponibles: number;

  tipoContratacion?: string;
  fechaIngreso?: string;
  antiguedadAnios?: number;
  mesesGenerados?: number | null;

  periodoAnterior?: string | null;
  diasPeriodoAnterior?: number;

  periodoActual?: string | null;
  diasPeriodoActual?: number;

  saldoInicialPendiente?: boolean;
}

// =========================================================
// CREAR SOLICITUD
// =========================================================

export interface CrearSolicitudVacaciones {
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
}

// =========================================================
// ESTADO DE SOLICITUD
// =========================================================

export interface EstadoSolicitudVacaciones {
  idEstadoSolicitud?: string;
  nomEstado?: string;
  nomestado?: string;
}

// =========================================================
// TIPO DE SOLICITUD
// =========================================================

export interface TipoSolicitudVacaciones {
  idTipoSolicitud?: string;
  nomTipo?: string;
  nomtipo?: string;
}

// =========================================================
// SOLICITUD DE VACACIONES
// =========================================================

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

  // =======================================================
  // DATOS DEL EMPLEADO
  // =======================================================

  idUsuario?: string;
  emailInstitucional?: string;
  numIdentidad?: string;

  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
}

// =========================================================
// SOLICITUD CREADA
// =========================================================

export interface SolicitudVacacionesCreada {
  message: string;

  diasSolicitados: number;

  diasDisponiblesAntes: number;

  diasDisponiblesDespues: number;

  solicitud: unknown;
}

// =========================================================
// APROBACIÓN
// =========================================================

export interface AprobarVacaciones {
  observacion?: string;
}

// =========================================================
// RECHAZO
// =========================================================

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

  saldoInicialPendiente?: boolean;
}

export interface ReporteVacacionesResponse {
  anio: number;

  totalEmpleados: number;

  empleados: ReporteVacacionesEmpleado[];
}

// =========================================================
// CARGA INICIAL DE SALDO
// =========================================================

export interface CargaInicialSaldo {
  idUsuario: string;

  anio: number;

  diasAsignados: number;

  diasUtilizados: number;

  diasReservados: number;

  observacion: string;
}

// =========================================================
// AJUSTE INDIVIDUAL DE SALDO
// =========================================================

export interface AjusteSaldoVacaciones {
  idUsuario: string;

  tipo: 'AGREGAR' | 'DESCONTAR';

  dias: number;

  justificacion: string;
}

// =========================================================
// DESCUENTO MASIVO
// =========================================================

export interface DescuentoMasivoVacaciones {
  idUsuarios: string[];

  dias: number;

  justificacion: string;
}

// =========================================================
// RESULTADO DE AJUSTE
// =========================================================

export interface ResultadoAjusteSaldo {
  message: string;

  tipo: 'AGREGAR' | 'DESCONTAR';

  dias: number;

  justificacion: string;

  saldo?: SaldoVacaciones;

  movimientos?: Array<{
    anio: number;
    dias: number;
  }>;
}

// =========================================================
// HISTORIAL DE VACACIONES
// =========================================================

export interface HistorialVacaciones {
  idHistorial: string;

  idPermisoVaca?: string | null;

  idSaldoVacacion?: string | null;

  idUsuarioAccion: string;

  accion: string;

  estadoAnterior?: string | null;

  estadoNuevo?: string | null;

  observacion?: string | null;

  fechaAccion: string;
}

// =========================================================
// RESPUESTA GENERAL DEL BACKEND
// =========================================================

interface ApiResponse<T> {
  success: boolean;

  data: T;

  message?: string;
}

// =========================================================
// SERVICIO
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class VacacionesApiService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/rrhh/vacaciones`;


  // =========================================================
  // SALDO DEL USUARIO AUTENTICADO
  // =========================================================

  obtenerMiSaldo():
    Observable<SaldoVacaciones> {

    return this.http
      .get<ApiResponse<SaldoVacaciones>>(
        `${this.apiUrl}/mi-saldo`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // CARGA INICIAL DE SALDO
  // =========================================================

  cargarSaldoInicial(
    saldo: CargaInicialSaldo,
  ): Observable<unknown> {

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/saldo/carga-inicial`,
        saldo,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // AJUSTE INDIVIDUAL DE SALDO
  // =========================================================

  ajustarSaldo(
    ajuste: AjusteSaldoVacaciones,
  ): Observable<ResultadoAjusteSaldo> {

    return this.http
      .post<ApiResponse<ResultadoAjusteSaldo>>(
        `${this.apiUrl}/saldo/ajuste`,
        ajuste,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // DESCUENTO MASIVO
  // =========================================================

  aplicarDescuentoMasivo(
    descuento: DescuentoMasivoVacaciones,
  ): Observable<unknown> {

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/saldo/descuento-masivo`,
        descuento,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // HISTORIAL DE VACACIONES
  // =========================================================

  obtenerHistorialVacaciones(
    idUsuario: string,
  ): Observable<HistorialVacaciones[]> {

    return this.http
      .get<ApiResponse<HistorialVacaciones[]>>(
        `${this.apiUrl}/saldo/historial/${idUsuario}`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // =========================================================
  // CALCULAR DÍAS LABORABLES
  // =========================================================

  calcularDias(
    fechaInicio: string,
    fechaFin: string,
  ): Observable<number> {

    const params =
      new HttpParams()
        .set(
          'fechaInicio',
          fechaInicio,
        )
        .set(
          'fechaFin',
          fechaFin,
        );

    return this.http
      .get<ApiResponse<number>>(
        `${this.apiUrl}/calcular-dias`,
        {
          params,
        },
      )
      .pipe(
        map((respuesta) =>
          Number(respuesta.data),
        ),
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
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // MIS SOLICITUDES
  // =========================================================

  obtenerMisSolicitudes():
    Observable<SolicitudVacaciones[]> {

    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/mis-solicitudes`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // =========================================================
  // ANULAR MI SOLICITUD
  // =========================================================

  anularVacaciones(
    idVacaciones: string,
  ): Observable<unknown> {

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/anular`,
        {},
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // SOLICITUDES PENDIENTES DEL JEFE
  // =========================================================

  obtenerPendientesJefe():
    Observable<SolicitudVacaciones[]> {

    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/pendientes-jefe`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // =========================================================
  // APROBAR COMO JEFE
  // =========================================================

  aprobarPorJefe(
    idVacaciones: string,
    observacion?: string,
  ): Observable<unknown> {

    const body: AprobarVacaciones = {
      observacion:
        observacion?.trim() || undefined,
    };

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/aprobar-jefe`,
        body,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // SOLICITUDES PENDIENTES DE SUBGERENCIA
  // =========================================================

  obtenerPendientesSubgerente():
    Observable<SolicitudVacaciones[]> {

    return this.http
      .get<ApiResponse<SolicitudVacaciones[]>>(
        `${this.apiUrl}/pendientes-subgerente`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // =========================================================
  // APROBAR COMO SUBGERENCIA
  // =========================================================

  aprobarPorSubgerente(
    idVacaciones: string,
    observacion?: string,
  ): Observable<unknown> {

    const body: AprobarVacaciones = {
      observacion:
        observacion?.trim() || undefined,
    };

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/aprobar-subgerente`,
        body,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // RECHAZAR
  // =========================================================

  rechazarVacaciones(
    idVacaciones: string,
    motivoRechazo: string,
  ): Observable<unknown> {

    const body: RechazarVacaciones = {
      motivoRechazo:
        motivoRechazo.trim(),
    };

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/${idVacaciones}/rechazar`,
        body,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // =========================================================
  // REPORTE DE VACACIONES
  // =========================================================

  obtenerReporteVacaciones(
    anio?: number,
  ): Observable<ReporteVacacionesResponse> {

    let params =
      new HttpParams();

    if (anio !== undefined) {
      params = params.set(
        'anio',
        anio.toString(),
      );
    }

    return this.http
      .get<ApiResponse<ReporteVacacionesResponse>>(
        `${this.apiUrl}/reporte`,
        {
          params,
        },
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }
}
