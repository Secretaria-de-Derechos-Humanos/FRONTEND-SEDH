import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
import { EP_RRHH_EMPLEADOS_BUSCAR } from '../../../../config/api.endpoints';

// ── Modelos públicos ─────────────────────────────────────────────────────────

export interface EmpleadoDetalle {
  email:            string;
  primerNombre:     string;
  segundoNombre:    string;
  primerApellido:   string;
  segundoApellido:  string;
  fechaIngreso:     string;
  activo:           boolean;
  identidad:        string;
  telefono:         string;
  tipoContratacion: string;
  dependencia:      string;
  cargo:            string;
  sexo:             string;
  estadoCivil:      string;
  departamento:     string;
  municipio:        string;
  jefeInmediato:    string;
  horasDisponibles: string;
}

export interface AccesoSistema {
  rol:    string;
  modulo: string;
}

export interface HistorialCargo {
  cargo:       string;
  fechaInicio: string;
  fechaFin:    string;
}

export interface ResultadoBusquedaEmpleado {
  empleado:       EmpleadoDetalle;
  accesosSistema: AccesoSistema[];
  historialCargos: HistorialCargo[];
}

// ── Tipos internos de respuesta API ─────────────────────────────────────────

interface BuscarEmpleadoData {
  status:          string;
  empleado:        EmpleadoDetalle;
  accesosSistema:  AccesoSistema[];
  historialCargos: HistorialCargo[];
}

interface ApiResponse<T> {
  success:   boolean;
  data:      T;
  message:   string;
  timestamp: string;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GestionEmpleadosService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = environment.apiBaseUrl;

  buscarEmpleado(emailEmpleado: string): Observable<ResultadoBusquedaEmpleado> {
    const user = this.authService.currentUser();
    const rol  = user?.roles[0];

    const body = {
      emailEmpleado,
      email:    user?.email ?? '',
      rol:      rol?.r ?? 5,
      idmodulo: typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? (rol.m as number[])[0] : 1),
    };

    return this.http
      .post<ApiResponse<BuscarEmpleadoData>>(
        `${this.base}${EP_RRHH_EMPLEADOS_BUSCAR}`,
        body
      )
      .pipe(
        map(r => ({
          empleado:        r.data.empleado,
          accesosSistema:  r.data.accesosSistema  ?? [],
          historialCargos: r.data.historialCargos ?? [],
        }))
      );
  }
}
