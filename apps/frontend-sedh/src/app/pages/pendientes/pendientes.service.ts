import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

import {
  EP_RRHH_JEFE_INMEDIATO_PENDIENTES,
  EP_RRHH_JEFE_INMEDIATO_RESPONDER,
  EP_RRHH_SUBGERENTE_PENDIENTES,
  EP_RRHH_SUBGERENTE_RESPONDER,
  EP_RRHH_AGENTE_SEGURIDAD_SOLICITUDES,
  EP_RRHH_AGENTE_SEGURIDAD_HORA_SALIDA,
  EP_RRHH_AGENTE_SEGURIDAD_HORA_RETORNO,
} from '../../config/api.endpoints';

interface RolUsuario {
  r?: number;
  m?: number | number[];
}

interface EmpleadoPendienteApi {
  nombre: string;
  apellido: string;
  segundoNombre: string | null;
  segundoApellido: string | null;
}

export interface PendienteJefeInmediatoApi {
  tipo: string;
  cargo: string;
  fecha: string;
  estado: string;
  motivo: string;
  empleado: EmpleadoPendienteApi;
  idpermiso: string;
  emergencia: boolean | null;
  motRechazo: string | null;
  dependencia: string;
  tipoPermiso: string;
  horasSolicitadas: string | null;
}

interface PendientesJefeInmediatoResponse {
  success: boolean;
  data: {
    jefe: string;
    pendientes: PendienteJefeInmediatoApi[];
  };
  message: string;
  timestamp: string;
}

interface PendientesSubgerenteResponse {
  success: boolean;
  data: {
    rol: number;
    modulo: number;
    status: string;
    pendientesRRHH: PendienteJefeInmediatoApi[];
  };
  message: string;
  timestamp: string;
}

interface SolicitudAgenteEmpleadoApi {
  nombre: string;
  apellido: string;
  segundoNombre: string | null;
  segundoApellido: string | null;
}

export interface SolicitudAgenteApi {
  idpermiso: string;
  fecha: string;
  tipo: string;
  estado: string;
  motivo: string;
  horasSolicitadas: string | null;
  horaSalida: string | null;
  horaRetorno: string | null;
  email: string;
  empleado: SolicitudAgenteEmpleadoApi;
  cargo: string;
  dependencia: string;
  tipoPermiso: string;
}

interface SolicitudesAgenteResponse {
  success: boolean;
  data: {
    status: string;
    rol: number;
    modulo: number;
    solicitudesAgente: SolicitudAgenteApi[];
  };
  message: string;
  timestamp: string;
}

export interface ResponderPermisoParams {
  idpermiso: string;
  tipo: string;
  motRechazo: string | null;
  horas?: string | null;
}

interface ResponderPermisoResponse {
  success: boolean;
  data: {
    rol: number;
    tipo: string;
    modulo: number;
    status: string;
    idpermiso: string;
    resultado: string;
  };
  message: string;
  timestamp: string;
}

export interface RegistrarHoraSalidaParams {
  idPermiso: string;
  horaSalida: string;
}

interface RegistrarHoraSalidaResponse {
  success: boolean;
  data: {
    status: string;
    tipo: string;
    idpermiso: string;
    mensaje: string;
    horaSalida?: string;
  };
  message: string;
  timestamp: string;
}

export interface RegistrarHoraRetornoParams {
  idPermiso: string;
  horaRetorno: string;
}

interface RegistrarHoraRetornoResponse {
  success: boolean;
  data: {
    status: string;
    tipo: string;
    idpermiso: string;
    mensaje: string;
    horaRetorno?: string;
    minutosSolicitados?: number;
    minutosReales?: number;
    minutosDevueltos?: number;
  };
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class PendientesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = environment.apiBaseUrl;

 getPendientesJefeInmediato(): Observable<PendienteJefeInmediatoApi[]> {
  const acceso =
    this.obtenerAccesoPreferido([2, 5]);

  const body = {
    modulo: this.obtenerIdModulo(acceso),
  };

  return this.http
    .post<PendientesJefeInmediatoResponse>(
      `${this.base}${EP_RRHH_JEFE_INMEDIATO_PENDIENTES}`,
      body,
    )
    .pipe(
      map(
        (response) =>
          response.data?.pendientes ?? [],
      ),
    );
}
  getPendientesSubgerente(): Observable<PendienteJefeInmediatoApi[]> {
  const usuario = this.authService.currentUser();

  const acceso =
    this.obtenerAccesoPreferido([3, 5]);

  const email =
    usuario?.email?.trim() ?? '';

  const rol =
    Number(acceso?.r ?? 3);

  const modulo =
    this.obtenerIdModulo(acceso);

  if (!email) {
    throw new Error(
      'El usuario actual no tiene un correo electrónico registrado.',
    );
  }

  const body = {
    email,
    rol,
    modulo,
  };

  console.log(
    'Solicitud pendientes subgerente:',
    body,
  );

  return this.http
    .post<PendientesSubgerenteResponse>(
      `${this.base}${EP_RRHH_SUBGERENTE_PENDIENTES}`,
      body,
    )
    .pipe(
      map(
        (response) =>
          response.data?.pendientesRRHH ?? [],
      ),
    );
}
  responderPermiso(
  params: ResponderPermisoParams,
): Observable<string> {
  const acceso =
    this.obtenerAccesoPreferido([2, 5]);

  const body: {
    idpermiso: string;
    tipo: string;
    modulo: number;
    motRechazo?: string;
    horas?: string;
  } = {
    idpermiso: params.idpermiso,
    tipo: params.tipo,
    modulo: this.obtenerIdModulo(acceso),
  };
  if (params.motRechazo?.trim()) {
    body.motRechazo =
      params.motRechazo.trim();
  }
  if (params.horas?.trim()) {
    body.horas =
      params.horas.trim();
  }

  return this.http
    .post<ResponderPermisoResponse>(
      `${this.base}${EP_RRHH_JEFE_INMEDIATO_RESPONDER}`,
      body,
    )
    .pipe(
      map(
        (response) =>
          response.data?.resultado ??
          response.message ??
          'Solicitud procesada correctamente.',
      ),
    );
}
  responderPermisoSubgerente(
    params: ResponderPermisoParams,
  ): Observable<string> {
    const usuario = this.authService.currentUser();
    const acceso = this.obtenerAccesoPreferido([3, 5]);

    const body: {
      idpermiso: string;
      tipo: string;
      email: string;
      rol: number;
      modulo: number;
      motRechazo?: string;
      horas?: string;
    } = {
      idpermiso: params.idpermiso,
      tipo: params.tipo,
      email: usuario?.email ?? '',
      rol: Number(acceso?.r ?? 3),
      modulo: this.obtenerIdModulo(acceso),
    };

    if (params.motRechazo?.trim()) {
      body.motRechazo = params.motRechazo.trim();
    }

    if (params.horas?.trim()) {
      body.horas = params.horas.trim();
    }

    return this.http
      .post<ResponderPermisoResponse>(
        `${this.base}${EP_RRHH_SUBGERENTE_RESPONDER}`,
        body,
      )
      .pipe(
        map(
          (response) =>
            response.data?.resultado ??
            response.message ??
            'Solicitud procesada correctamente.',
        ),
      );
  }

  getSolicitudesAgente(): Observable<SolicitudAgenteApi[]> {
  const acceso =
    this.obtenerAccesoPreferido([4, 5]);

  return this.http
    .post<SolicitudesAgenteResponse>(
      `${this.base}${EP_RRHH_AGENTE_SEGURIDAD_SOLICITUDES}`,
      {
        idmodulo:
          this.obtenerIdModulo(acceso),
      },
    )
    .pipe(
      map(
        (response) =>
          response.data?.solicitudesAgente ?? [],
      ),
    );
}

  registrarHoraSalida(
  params: RegistrarHoraSalidaParams,
): Observable<string> {
  const acceso = this.obtenerAccesoPreferido([4, 5]);

  const body = {
    idPermiso: params.idPermiso,
    horaSalida: params.horaSalida,
    idmodulo: this.obtenerIdModulo(acceso),
  };

  return this.http
    .post<RegistrarHoraSalidaResponse>(
      `${this.base}${EP_RRHH_AGENTE_SEGURIDAD_HORA_SALIDA}`,
      body,
    )
    .pipe(
      map(
        (response) =>
          response.data?.mensaje ??
          response.message ??
          'Hora de salida registrada correctamente.',
      ),
    );
}

 registrarHoraRetorno(
  params: RegistrarHoraRetornoParams,
): Observable<string> {
  const acceso = this.obtenerAccesoPreferido([4, 5]);

  const body = {
    idPermiso: params.idPermiso,
    horaRetorno: params.horaRetorno,
    idmodulo: this.obtenerIdModulo(acceso),
  };

  return this.http
    .post<RegistrarHoraRetornoResponse>(
      `${this.base}${EP_RRHH_AGENTE_SEGURIDAD_HORA_RETORNO}`,
      body,
    )
    .pipe(
      map(
        (response) =>
          response.data?.mensaje ??
          response.message ??
          'Hora de retorno registrada correctamente.',
      ),
    );
}

  private obtenerAccesoPreferido(
    rolesPermitidos: number[],
  ): RolUsuario | null {
    const roles =
      this.authService.currentUser()?.roles ?? [];

    return (
      roles.find((acceso) =>
        rolesPermitidos.includes(
          Number(acceso.r),
        ),
      ) ??
      roles[0] ??
      null
    );
  }

  private obtenerIdModulo(
    acceso: RolUsuario | null | undefined,
  ): number {
    if (typeof acceso?.m === 'number') {
      return Number(acceso.m);
    }

    if (Array.isArray(acceso?.m)) {
      return Number(
        acceso.m[0] ?? 1,
      );
    }

    return 1;
  }
}
