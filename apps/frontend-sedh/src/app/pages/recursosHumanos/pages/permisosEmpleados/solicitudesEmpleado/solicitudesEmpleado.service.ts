import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../services/auth.service';

import {
  EP_RRHH_MIS_SOLICITUDES,
  EP_RRHH_MIS_SOLICITUDES_EMERGENCIA,
  EP_RRHH_DATOS_PERMISO,
  EP_RRHH_PERMISOS_PERSONALES_INSERTAR,
  EP_RRHH_PERMISOS_OFICIALES_INSERTAR,
  EP_RRHH_PERMISOS_PERSONALES_ANULAR,
  EP_RRHH_PERMISOS_OFICIALES_ANULAR
} from '../../../../../config/api.endpoints';

import { Solicitud } from './solicitudesEmpleado.component';


// ─────────────────────────────────────────────────────────────────────────────
// Datos del empleado
// ─────────────────────────────────────────────────────────────────────────────

export interface DatosPermiso {
  nombre: string;
  dependencia: string;
  cargo: string;
  horasDisponibles: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Respuesta de solicitudes
// ─────────────────────────────────────────────────────────────────────────────

interface SolicitudApi {
  idPermiso: string;

  tipo: string;

  fecha: string;

  estado:
    | 'EN PROCESO'
    | 'APROBADO'
    | 'RECHAZADO'
    | 'ANULADO';

  emergencia: boolean;

  motRechazo: string | null;

  priAprobacion: string | null;

  segAprobacion: string | null;
}


interface MisSolicitudesResponse {
  success: boolean;

  data: {
    email: string;
    solicitudes: SolicitudApi[];
  };

  message: string;
}


interface MisSolicitudesEmergenciaResponse {
  success: boolean;

  data: {
    email: string;
    emergencias: SolicitudApi[];
  };

  message: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Datos permiso
// ─────────────────────────────────────────────────────────────────────────────

interface DatosPermisoApi {
  prinombre: string;
  segnombre: string | null;
  priapellido: string;
  segapellido: string | null;
  dependencia: string;
  cargo: string;
  horas_disponibles: string;
}


interface DatosPermisoResponse {
  success: boolean;
  data: DatosPermisoApi;
  message: string;
  timestamp: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Insertar permiso personal
// ─────────────────────────────────────────────────────────────────────────────

export interface InsertarPermisoPersonalBody {
  fecha: string;
  horas: string;
  motivo: string;
  emergencia: boolean;
}


export interface InsertarPermisoPersonalResponse {
  status: string;
  message: string;
  idpermiso: string;
  horas_solicitadas: number;
  emergencia: boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// Insertar permiso oficial
// ─────────────────────────────────────────────────────────────────────────────

export interface InsertarPermisoOficialBody {
  fecha: string;
  motivo: string;
}


export interface InsertarPermisoOficialResponse {
  status: string;
  message: string;
  idpermiso: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Respuesta anulación
// ─────────────────────────────────────────────────────────────────────────────

export interface AnularPermisoResponse {
  status: string;
  message?: string;
  mensaje?: string;
  idPermiso?: string;
  idpermiso?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// Mapper
// ─────────────────────────────────────────────────────────────────────────────

function mapSolicitud(s: SolicitudApi): Solicitud {

  return {
    idPermiso: s.idPermiso,

    fec_solicitud: s.fecha,

    nom_tipo_solicitud: s.tipo,

    nom_estado: s.estado,

    pri_aporbacion: s.priAprobacion,

    seg_aprobacion: s.segAprobacion,

    mot_rechazo: s.motRechazo
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class SolicitudesEmpleadoService {

  private readonly http = inject(HttpClient);

  private readonly authService = inject(AuthService);

  private readonly base = environment.apiBaseUrl;


  private get emailBody(): { email: string } {

    return {
      email:
        this.authService.currentUser()?.email ?? ''
    };

  }


  // ───────────────────────────────────────────────────────────────────────────
  // MIS SOLICITUDES
  // ───────────────────────────────────────────────────────────────────────────

  getMisSolicitudes(): Observable<Solicitud[]> {

    return this.http
      .post<MisSolicitudesResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES}`,
        this.emailBody
      )
      .pipe(

        map(response =>

          response.data.solicitudes

            .map(mapSolicitud)

            .sort(
              (a, b) =>
                b.fec_solicitud.localeCompare(
                  a.fec_solicitud
                )
            )

        )

      );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // MIS SOLICITUDES DE EMERGENCIA
  // ───────────────────────────────────────────────────────────────────────────

  getMisSolicitudesEmergencia(): Observable<Solicitud[]> {

    return this.http
      .post<MisSolicitudesEmergenciaResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES_EMERGENCIA}`,
        this.emailBody
      )
      .pipe(

        map(response =>

          response.data.emergencias

            .map(mapSolicitud)

            .sort(
              (a, b) =>
                b.fec_solicitud.localeCompare(
                  a.fec_solicitud
                )
            )

        )

      );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // INSERTAR PERMISO OFICIAL
  // ───────────────────────────────────────────────────────────────────────────

  insertarPermisoOficial(
    body: InsertarPermisoOficialBody
  ): Observable<InsertarPermisoOficialResponse> {

    return this.http.post<InsertarPermisoOficialResponse>(

      `${this.base}${EP_RRHH_PERMISOS_OFICIALES_INSERTAR}`,

      {
        ...this.emailBody,
        ...body
      }

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // INSERTAR PERMISO PERSONAL
  // ───────────────────────────────────────────────────────────────────────────

  insertarPermisoPersonal(
    body: InsertarPermisoPersonalBody
  ): Observable<InsertarPermisoPersonalResponse> {

    return this.http.post<InsertarPermisoPersonalResponse>(

      `${this.base}${EP_RRHH_PERMISOS_PERSONALES_INSERTAR}`,

      {
        ...this.emailBody,
        ...body
      }

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ANULAR PERMISO PERSONAL
  // ───────────────────────────────────────────────────────────────────────────

  anularPermisoPersonal(
    idPermiso: string
  ): Observable<AnularPermisoResponse> {

    return this.http.post<AnularPermisoResponse>(

      `${this.base}${EP_RRHH_PERMISOS_PERSONALES_ANULAR}/${idPermiso}`,

      {}

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ANULAR PERMISO OFICIAL
  // ───────────────────────────────────────────────────────────────────────────

  anularPermisoOficial(
    idPermiso: string
  ): Observable<AnularPermisoResponse> {

    return this.http.post<AnularPermisoResponse>(

      `${this.base}${EP_RRHH_PERMISOS_OFICIALES_ANULAR}/${idPermiso}`,

      {}

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // DATOS DEL EMPLEADO
  // ───────────────────────────────────────────────────────────────────────────

  getDatosPermiso(): Observable<DatosPermiso> {

    return this.http

      .post<DatosPermisoResponse>(

        `${this.base}${EP_RRHH_DATOS_PERMISO}`,

        this.emailBody

      )

      .pipe(

        map(response => ({

          nombre: [

            response.data.prinombre,

            response.data.segnombre ?? '',

            response.data.priapellido,

            response.data.segapellido ?? ''

          ]

            .filter(Boolean)

            .join(' '),


          dependencia:
            response.data.dependencia,


          cargo:
            response.data.cargo,


          horasDisponibles:
            response.data.horas_disponibles
              .substring(0, 5)

        }))

      );

  }

}
