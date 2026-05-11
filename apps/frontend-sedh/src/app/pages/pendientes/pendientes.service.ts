import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import {
  EP_RRHH_JEFE_INMEDIATO_PENDIENTES,
  EP_RRHH_JEFE_INMEDIATO_RESPONDER,
  EP_RRHH_SUBGERENTE_PENDIENTES
} from '../../config/api.endpoints';

interface EmpleadoPendienteApi {
  nombre: string;
  apellido: string;
  segundoNombre: string;
  segundoApellido: string;
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

export interface ResponderPermisoParams {
  idpermiso: string;
  tipo: string;
  motRechazo: string | null;
  horas: string;
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

@Injectable({ providedIn: 'root' })
export class PendientesService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = environment.apiBaseUrl;

  getPendientesJefeInmediato(): Observable<PendienteJefeInmediatoApi[]> {
    const user = this.authService.currentUser();
    const rol = this.authService.currentUser()?.roles[0];

    const body = {
      email:    user?.email ?? '',
      rol:      rol?.r ?? 2,
      idmodulo: typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? rol?.m[0] : 1),
    };

    return this.http
      .post<PendientesJefeInmediatoResponse>(
        `${this.base}${EP_RRHH_JEFE_INMEDIATO_PENDIENTES}`,
        body
      )
      .pipe(map(response => response.data?.pendientes ?? []));
  }

  getPendientesSubgerente(): Observable<PendienteJefeInmediatoApi[]> {
    const user = this.authService.currentUser();
    const rol  = user?.roles[0];

    const body = {
      email:    user?.email ?? '',
      rol:      rol?.r ?? 3,
      idmodulo: typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? rol?.m[0] : 1),
    };

    return this.http
      .post<PendientesSubgerenteResponse>(
        `${this.base}${EP_RRHH_SUBGERENTE_PENDIENTES}`,
        body
      )
      .pipe(map(response => response.data?.pendientesRRHH ?? []));
  }

  responderPermiso(params: ResponderPermisoParams): Observable<string> {
    const user = this.authService.currentUser();
    const rol  = user?.roles[0];

    const body = {
      idpermiso:  params.idpermiso,
      tipo:       params.tipo,
      email:      user?.email ?? '',
      rol:        rol?.r ?? 2,
      idmodulo:   typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? rol?.m[0] : 1),
      motRechazo: params.motRechazo,
      horas:      params.horas,
    };

    return this.http
      .post<ResponderPermisoResponse>(
        `${this.base}${EP_RRHH_JEFE_INMEDIATO_RESPONDER}`,
        body
      )
      .pipe(map(r => r.data?.resultado ?? r.message));
  }
}
