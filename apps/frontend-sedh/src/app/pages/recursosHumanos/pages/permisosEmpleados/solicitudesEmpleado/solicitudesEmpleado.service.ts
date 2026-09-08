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

export interface DatosPermiso {
  nombre: string;
  dependencia: string;
  cargo: string;
  horasDisponibles: string;
}

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

interface DatosPermisoApi {
  prinombre?: string | null;
  segnombre?: string | null;
  priapellido?: string | null;
  segapellido?: string | null;
  dependencia?: string | null;
  cargo?: string | null;
  horas_disponibles?: string | number | null;

  // Compatibilidad por si el backend devuelve camelCase.
  priNombre?: string | null;
  segNombre?: string | null;
  priApellido?: string | null;
  segApellido?: string | null;
  horasDisponibles?: string | number | null;
}

interface DatosPermisoResponse {
  success: boolean;

  data: {
    status: string;
    data: DatosPermisoApi;
    message: string;
  };

  message: string;
  timestamp: string;
}
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

export interface InsertarPermisoOficialBody {
  fecha: string;
  motivo: string;
}

export interface InsertarPermisoOficialResponse {
  status: string;
  message: string;
  idpermiso: string;
}

export interface AnularPermisoResponse {
  status: string;
  message?: string;
  mensaje?: string;
  idPermiso?: string;
  idpermiso?: string;
}

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

@Injectable({
  providedIn: 'root'
})
export class SolicitudesEmpleadoService {

  private readonly http = inject(HttpClient);

  private readonly authService = inject(AuthService);

  private readonly base = environment.apiBaseUrl;

  private get emailBody(): { email: string } {
    return {
      email: this.authService.currentUser()?.email ?? ''
    };
  }

  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http
      .post<MisSolicitudesResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES}`,
        this.emailBody
      )
      .pipe(
        map(response =>
          (response.data?.solicitudes ?? [])
            .map(mapSolicitud)
            .sort(
              (a, b) =>
                b.fec_solicitud.localeCompare(a.fec_solicitud)
            )
        )
      );
  }

  getMisSolicitudesEmergencia(): Observable<Solicitud[]> {
    return this.http
      .post<MisSolicitudesEmergenciaResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES_EMERGENCIA}`,
        this.emailBody
      )
      .pipe(
        map(response =>
          (response.data?.emergencias ?? [])
            .map(mapSolicitud)
            .sort(
              (a, b) =>
                b.fec_solicitud.localeCompare(a.fec_solicitud)
            )
        )
      );
  }

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

  insertarPermisoPersonal(
    body: InsertarPermisoPersonalBody
  ): Observable<InsertarPermisoPersonalResponse> {
    return this.http.post<InsertarPermisoPersonalResponse>(
      `${this.base}${EP_RRHH_PERMISOS_PERSONALES_INSERTAR}`,
      body
    );
  }

  anularPermisoPersonal(
    idPermiso: string
  ): Observable<AnularPermisoResponse> {
    return this.http.post<AnularPermisoResponse>(
      `${this.base}${EP_RRHH_PERMISOS_PERSONALES_ANULAR}/${idPermiso}`,
      {}
    );
  }

  anularPermisoOficial(
    idPermiso: string
  ): Observable<AnularPermisoResponse> {
    return this.http.post<AnularPermisoResponse>(
      `${this.base}${EP_RRHH_PERMISOS_OFICIALES_ANULAR}/${idPermiso}`,
      {}
    );
  }

  getDatosPermiso(): Observable<DatosPermiso> {

  return this.http
    .post<DatosPermisoResponse>(
      `${this.base}${EP_RRHH_DATOS_PERMISO}`,
      this.emailBody
    )
    .pipe(

      map(response => {

        console.log(
          'RESPUESTA DATOS PERMISO:',
          JSON.stringify(response, null, 2)
        );

        console.log(
          'EMAIL ENVIADO:',
          JSON.stringify(this.emailBody, null, 2)
        );

        const data = response?.data?.data;

        if (!data) {
          throw new Error(
            response?.data?.message ??
            response?.message ??
            'El backend no devolvió los datos del empleado'
          );
        }

        const nombre = [
          data.prinombre ?? data.priNombre ?? '',
          data.segnombre ?? data.segNombre ?? '',
          data.priapellido ?? data.priApellido ?? '',
          data.segapellido ?? data.segApellido ?? ''
        ]
          .map(valor => String(valor).trim())
          .filter(Boolean)
          .join(' ');

        const dependencia =
          String(data.dependencia ?? '').trim();

        const cargo =
          String(data.cargo ?? '').trim();

        const horas =
          String(
            data.horas_disponibles ??
            data.horasDisponibles ??
            ''
          ).trim();

        return {
          nombre,
          dependencia,
          cargo,
          horasDisponibles:
            horas.length >= 5
              ? horas.substring(0, 5)
              : horas || '--:--'
        };

      })

    );
}
}
