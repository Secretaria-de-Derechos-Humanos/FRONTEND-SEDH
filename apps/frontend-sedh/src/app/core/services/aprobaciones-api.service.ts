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

@Injectable({
  providedIn: 'root',
})
export class AprobacionesApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/rrhh/aprobaciones`;

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
}
