import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { EP_RRHH_JEFE_INMEDIATO_PENDIENTES } from '../../config/api.endpoints';

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
}
