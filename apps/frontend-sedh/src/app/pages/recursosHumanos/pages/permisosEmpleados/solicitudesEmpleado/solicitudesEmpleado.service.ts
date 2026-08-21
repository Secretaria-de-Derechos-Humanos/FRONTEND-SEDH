import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../services/auth.service';
import {
  EP_RRHH_MIS_SOLICITUDES,
  EP_RRHH_MIS_SOLICITUDES_EMERGENCIA,
  EP_RRHH_DATOS_PERMISO,
  EP_RRHH_PERMISOS_PERSONALES_INSERTAR,
  EP_RRHH_PERMISOS_PERSONALES_DISPONIBILIDAD,
  EP_RRHH_PERMISOS_OFICIALES_INSERTAR,
} from '../../../../../config/api.endpoints';

import { Solicitud } from './solicitudesEmpleado.component';

/* ─────────────────────────────────────────────────────────────
   Modelos públicos
   ───────────────────────────────────────────────────────────── */

export interface DatosPermiso {
  nombre: string;
  dependencia: string;
  cargo: string;
  horasDisponibles: string;
}

export interface DisponibilidadPermisoPersonal {
  fecha: string;
  limiteDiarioMinutos: number;
  consumidoDiaMinutos: number;
  disponibleDiaMinutos: number;
  limiteMensualMinutos: number;
  consumidoMesMinutos: number;
  disponibleMesMinutos: number;
  horasDisponibles: string;
}

export interface InsertarPermisoPersonalBody {
  fecha: string;
  horas: string;
  motivo: string;
  emergencia: boolean;
}

export interface InsertarPermisoOficialBody {
  fecha: string;
  motivo: string;
}

/* ─────────────────────────────────────────────────────────────
   Respuestas del backend
   ───────────────────────────────────────────────────────────── */

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
  path?: string;
}

interface SolicitudApi {
  tipo: string;
  fecha: string;
  estado: 'EN PROCESO' | 'APROBADO' | 'RECHAZADO';
  emergencia: boolean;
  motRechazo: string | null;
  priAprobacion: string | null;
  segAprobacion: string | null;
}

interface MisSolicitudesData {
  email: string;
  solicitudes: SolicitudApi[];
}

interface MisSolicitudesEmergenciaData {
  email: string;
  emergencias: SolicitudApi[];
}

interface DatosPermisoApi {
  prinombre?: string | null;
  segnombre?: string | null;
  priapellido?: string | null;
  segapellido?: string | null;

  dependencia?: string | null;
  cargo?: string | null;

  horas_disponibles?: string | null;

  /*
   * Se incluyen variantes por si la función SQL
   * devuelve estos nombres.
   */
  nombre?: string | null;
  nombreEmpleado?: string | null;
  nombreempleado?: string | null;
  nomdependencia?: string | null;
  nomcargo?: string | null;
  horasDisponibles?: string | null;
  hordisponibles?: string | null;
}

export interface InsertarPermisoPersonalResultado {
  status: string;
  message: string;
  idpermiso?: string;
  fecha?: string;
  horas_solicitadas?: string;
  minutos_solicitados?: number;
  consumido_dia_antes_minutos?: number;
  disponible_dia_despues_minutos?: number;
  consumido_mes_antes_minutos?: number;
  disponible_mes_despues_minutos?: number;
  emergencia?: boolean;
}

export interface InsertarPermisoOficialResultado {
  status: string;
  message: string;
  idpermiso?: string;
}

/* ─────────────────────────────────────────────────────────────
   Mapper
   ───────────────────────────────────────────────────────────── */

function mapSolicitud(solicitud: SolicitudApi): Solicitud {
  return {
    fec_solicitud: solicitud.fecha,
    nom_tipo_solicitud: solicitud.tipo,
    nom_estado: solicitud.estado,
    pri_aporbacion: solicitud.priAprobacion,
    seg_aprobacion: solicitud.segAprobacion,
    mot_rechazo: solicitud.motRechazo,
  };
}

function normalizarHora(valor: string | null | undefined): string {
  if (!valor) {
    return '00:00';
  }
  const texto = String(valor).trim();

  /*
   * Convierte:
   * 09:00:00 -> 09:00
   * 07:30:00 -> 07:30
   */
  const coincidencia = texto.match(/^(\d{1,2}):(\d{2})/);
  if (!coincidencia) {
    return '00:00';
  }
  return `${coincidencia[1].padStart(2, '0')}:${coincidencia[2]}`;
}

/* ─────────────────────────────────────────────────────────────
   Servicio
   ───────────────────────────────────────────────────────────── */

@Injectable({
  providedIn: 'root',
})
export class SolicitudesEmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = environment.apiBaseUrl;

  /*
   * Estos endpoints todavía reciben el correo en el body.
   * Cuando se cambien para tomarlo del JWT, también podremos
   * eliminar esta propiedad.
   */
  private get emailBody(): { email: string } {
    return {
      email:
        this.authService.currentUser()?.email?.trim() ?? '',
    };
  }
  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http
      .post<ApiResponse<MisSolicitudesData>>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES}`,
        this.emailBody,
      )
      .pipe(
        map((respuesta) => {
          const solicitudes =
            respuesta.data?.solicitudes ?? [];

          return solicitudes
            .map(mapSolicitud)
            .sort((a, b) =>
              b.fec_solicitud.localeCompare(
                a.fec_solicitud,
              ),
            );
        }),
      );
  }
  getMisSolicitudesEmergencia(): Observable<Solicitud[]> {
    return this.http
      .post<ApiResponse<MisSolicitudesEmergenciaData>>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES_EMERGENCIA}`,
        this.emailBody,
      )
      .pipe(
        map((respuesta) => {
          const emergencias =
            respuesta.data?.emergencias ?? [];

          return emergencias
            .map(mapSolicitud)
            .sort((a, b) =>
              b.fec_solicitud.localeCompare(
                a.fec_solicitud,
              ),
            );
        }),
      );
  }

  getDatosPermiso(): Observable<DatosPermiso> {
  return this.http
    .post<any>(
      `${this.base}${EP_RRHH_DATOS_PERMISO}`,
      this.emailBody,
    )
    .pipe(
      map((respuesta) => {
        const resultado =
          respuesta?.data ?? respuesta ?? {};

        const datos =
          resultado?.data ?? resultado;

        const nombre = [
          datos?.prinombre,
          datos?.segnombre,
          datos?.priapellido,
          datos?.segapellido,
        ]
          .map((valor: unknown) =>
            typeof valor === 'string'
              ? valor.trim()
              : '',
          )
          .filter(Boolean)
          .join(' ');

        const horasDisponibles =
          normalizarHora(
            datos?.horas_disponibles ??
            datos?.horasDisponibles ??
            datos?.hordisponibles ??
            '00:00',
          );

        return {
          nombre,
          dependencia:
            String(
              datos?.dependencia ?? '',
            ).trim(),

          cargo:
            String(
              datos?.cargo ?? '',
            ).trim(),

          horasDisponibles,
        };
      }),
    );
}

  consultarDisponibilidadPermisoPersonal(
    fecha: string,
  ): Observable<DisponibilidadPermisoPersonal> {
    const params = new HttpParams().set(
      'fecha',
      fecha,
    );
    return this.http
      .get<
        ApiResponse<DisponibilidadPermisoPersonal>
      >(
        `${this.base}${EP_RRHH_PERMISOS_PERSONALES_DISPONIBILIDAD}`,
        {
          params,
        },
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  insertarPermisoPersonal(
    body: InsertarPermisoPersonalBody,
  ): Observable<InsertarPermisoPersonalResultado> {
    /*
     * No enviamos email.
     * El controlador NestJS lo obtiene del token JWT.
     */
    return this.http
      .post<
        ApiResponse<InsertarPermisoPersonalResultado>
      >(
        `${this.base}${EP_RRHH_PERMISOS_PERSONALES_INSERTAR}`,
        body,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  insertarPermisoOficial(
    body: InsertarPermisoOficialBody,
  ): Observable<InsertarPermisoOficialResultado> {
    /*
     * El permiso oficial también obtenía el correo del JWT
     * según el controlador que corregimos anteriormente.
     */
    return this.http
      .post<
        ApiResponse<InsertarPermisoOficialResultado>
      >(
        `${this.base}${EP_RRHH_PERMISOS_OFICIALES_INSERTAR}`,
        body,
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }
}
