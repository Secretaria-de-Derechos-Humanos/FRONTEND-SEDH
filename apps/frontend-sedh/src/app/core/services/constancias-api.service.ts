import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpResponse,
} from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

// =========================================================
// FINALIDAD
// =========================================================

export type FinalidadConstancia =
  | 'PERSONAL'
  | 'INJUPEM'
  | 'SIAFI';

// =========================================================
// MODALIDAD DE SALARIO
// =========================================================

export type ModalidadSalarioConstancia =
  | 'CON_DEDUCCIONES'
  | 'SIN_DEDUCCIONES';

// =========================================================
// ESTADO
// =========================================================

export interface EstadoSolicitudConstancia {
  idEstadoSolicitud?: string;
  nomEstado?: string | null;
  nomestado?: string | null;
}

// =========================================================
// FINALIDAD REGISTRADA
// =========================================================

export interface ConstanciaFinalidad {
  idConstanciaFinalidad?: string;
  idConstancia?: string;
  finalidad: FinalidadConstancia;
}

// =========================================================
// CONSTANCIA
// =========================================================

export interface Constancia {
  idConstancia: string;

  idUsuario: string;

  emailInstitucional: string;

  fecSolicitud: string;

  modalidadSalario: ModalidadSalarioConstancia;

  observaciones?: string | null;

  idEstadoSolicitud?: string | null;

  estadoSolicitud?: EstadoSolicitudConstancia | null;

  motRechazo?: string | null;

  nombreArchivo?: string | null;

  rutaArchivo?: string | null;

  tipoArchivo?: string | null;

  fechaGeneracion?: string | null;

  generadoPor?: string | null;

  fechaRecepcion?: string | null;

  recibidoPor?: string | null;

  finalidades?: ConstanciaFinalidad[];
}

// =========================================================
// CREAR SOLICITUD
// =========================================================

export interface CrearConstancia {
  finalidades: FinalidadConstancia[];

  modalidadSalario: ModalidadSalarioConstancia;

  observaciones?: string;
}

// =========================================================
// RECHAZAR
// =========================================================

export interface RechazarConstancia {
  motivoRechazo: string;
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
export class ConstanciasApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/rrhh/constancias`;

  // =======================================================
  // CREAR SOLICITUD
  // =======================================================

  crearSolicitud(
    solicitud: CrearConstancia,
  ): Observable<Constancia> {
    return this.http
      .post<ApiResponse<Constancia>>(
        this.apiUrl,
        solicitud,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =======================================================
  // MIS SOLICITUDES
  // =======================================================

  obtenerMisSolicitudes():
    Observable<Constancia[]> {
    return this.http
      .get<ApiResponse<Constancia[]>>(
        `${this.apiUrl}/mis-solicitudes`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }

  // =======================================================
  // UNA SOLICITUD PROPIA
  // =======================================================

  obtenerMiSolicitud(
    idConstancia: string,
  ): Observable<Constancia> {
    return this.http
      .get<ApiResponse<Constancia>>(
        `${this.apiUrl}/mis-solicitudes/${idConstancia}`,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =======================================================
  // TODAS LAS SOLICITUDES - RRHH
  // =======================================================

  obtenerTodas():
    Observable<Constancia[]> {
    return this.http
      .get<ApiResponse<Constancia[]>>(
        this.apiUrl,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }

  // =======================================================
  // SOLICITUDES PENDIENTES - RRHH
  // =======================================================

  obtenerPendientes():
    Observable<Constancia[]> {
    return this.http
      .get<ApiResponse<Constancia[]>>(
        `${this.apiUrl}/pendientes`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }

  // =======================================================
  // RECHAZAR
  // =======================================================

  rechazarSolicitud(
    idConstancia: string,
    motivoRechazo: string,
  ): Observable<Constancia> {
    const body: RechazarConstancia = {
      motivoRechazo:
        motivoRechazo.trim(),
    };

    return this.http
      .post<ApiResponse<Constancia>>(
        `${this.apiUrl}/${idConstancia}/rechazar`,
        body,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =======================================================
  // CARGAR CONSTANCIA GENERADA
  // =======================================================

  generarConstancia(
    idConstancia: string,
    archivo: File,
  ): Observable<Constancia> {
    const formulario = new FormData();

    formulario.append(
      'archivo',
      archivo,
    );

    return this.http
      .post<ApiResponse<Constancia>>(
        `${this.apiUrl}/${idConstancia}/generar`,
        formulario,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  // =======================================================
  // DESCARGAR CONSTANCIA
  // =======================================================

  descargarConstancia(
    idConstancia: string,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/${idConstancia}/descargar`,
      {
        observe: 'response',
        responseType: 'blob',
      },
    );
  }
}
