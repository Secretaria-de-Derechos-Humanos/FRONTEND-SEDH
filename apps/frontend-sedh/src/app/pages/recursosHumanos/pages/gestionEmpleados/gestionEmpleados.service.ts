import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
import { EP_RRHH_EMPLEADOS_BUSCAR, EP_RRHH_EMPLEADOS_DATOS_SEDH, EP_RRHH_EMPLEADOS_ACTUALIZAR } from '../../../../config/api.endpoints';

// ── Sub-tipos ────────────────────────────────────────────────────────────────

export interface JefeInmediato {
  identidad: string;
  nombre:    string;
}

// ── Modelos públicos ─────────────────────────────────────────────────────────

export interface EmpleadoDetalle {
  email:              string;
  primerNombre:       string;
  segundoNombre:      string;
  primerApellido:     string;
  segundoApellido:    string;
  fechaIngreso:       string;
  activo:             boolean;
  identidad:          string;
  telefono:           string;
  tipoContratacion:   string;
  idTipoContratacion: string;
  dependencia:        string;
  idDependencia:      number;
  cargo:              string;
  idCargo:            number;
  sexo:               string;
  idSexo:             string;
  estadoCivil:        string;
  idEstadoCivil:      string;
  departamento:       string;
  idDepartamento:     number;
  municipio:          string;
  idMunicipio:        number;
  jefeInmediato:      JefeInmediato;
  horasDisponibles:   string;
}

export interface AccesoSistema {
  idRol:    number;
  rol:      string;
  idModulo: number;
  modulo:   string;
}

export interface HistorialCargo {
  cargo:       string;
  fechaInicio: string;
  fechaFin:    string;
}

export interface ResultadoBusquedaEmpleado {
  empleado:        EmpleadoDetalle;
  accesosSistema:  AccesoSistema[];
  historialCargos: HistorialCargo[];
}

// ── Catálogos (datos-sedh) ────────────────────────────────────────────────────

export interface CatalogoItem {
  id:     number | string;
  nombre: string;
}

export interface CargoCatalogo {
  id:            number;
  nombre:        string;
  idDependencia: number;
  dependencia:   string;
}

export interface MunicipioCatalogo {
  id:             number;
  nombre:         string;
  idDepartamento: number;
}

export interface ModuloCatalogo {
  id:          number;
  nombre:      string;
  descripcion: string;
}

export interface JefeInmediatoCatalogo {
  identidad:   string;
  nombre:      string;
  email:       string;
  cargo:       string;
  dependencia: string;
}

export interface DatosSedh {
  tiposContratacion: CatalogoItem[];
  dependencias:      CatalogoItem[];
  cargos:            CargoCatalogo[];
  sexos:             CatalogoItem[];
  estadosCiviles:    CatalogoItem[];
  departamentos:     CatalogoItem[];
  municipios:        MunicipioCatalogo[];
  roles:             CatalogoItem[];
  modulos:           ModuloCatalogo[];
  jefesInmediatos:   JefeInmediatoCatalogo[];
}

// ── Tipos internos de respuesta API ─────────────────────────────────────────

interface BuscarEmpleadoData {
  status:          string;
  mensaje?:        string;
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

  private buildBody(extra: Record<string, unknown> = {}): Record<string, unknown> {
    const user = this.authService.currentUser();
    const rol  = user?.roles[0];
    return {
      email:    user?.email ?? '',
      rol:      rol?.r ?? 5,
      idmodulo: typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? (rol.m as number[])[0] : 1),
      ...extra,
    };
  }

  buscarEmpleado(emailEmpleado: string): Observable<ResultadoBusquedaEmpleado> {
    return this.http
      .post<ApiResponse<BuscarEmpleadoData>>(
        `${this.base}${EP_RRHH_EMPLEADOS_BUSCAR}`,
        this.buildBody({ emailEmpleado })
      )
      .pipe(
        switchMap(r => {
          if (r.data.status === 'ERROR') {
            return throwError(() => new Error(r.data.mensaje ?? 'Empleado no encontrado'));
          }
          return [{
            empleado:        r.data.empleado,
            accesosSistema:  r.data.accesosSistema  ?? [],
            historialCargos: r.data.historialCargos ?? [],
          }];
        })
      );
  }

  cargarDatosSedh(): Observable<DatosSedh> {
    return this.http
      .post<ApiResponse<DatosSedh>>(
        `${this.base}${EP_RRHH_EMPLEADOS_DATOS_SEDH}`,
        this.buildBody()
      )
      .pipe(map(r => r.data));
  }

  actualizarEmpleado(
    emailEmpleado: string,
    edicion: EmpleadoDetalle,
    accesos: AccesoSistema[]
  ): Observable<ActualizarEmpleadoRespuesta> {
    const empleadoBody: ActualizarEmpleadoPayload = {
      fechaIngreso:       edicion.fechaIngreso,
      activo:             edicion.activo,
      telefono:           edicion.telefono,
      idTipoContratacion: String(edicion.idTipoContratacion),
      idCargo:            Number(edicion.idCargo),
      idSexo:             String(edicion.idSexo),
      idEstadoCivil:      String(edicion.idEstadoCivil),
      idMunicipio:        Number(edicion.idMunicipio),
      jefeInmediato:      { identidad: edicion.jefeInmediato.identidad },
    };

    return this.http
      .post<ApiResponse<ActualizarEmpleadoRespuesta>>(
        `${this.base}${EP_RRHH_EMPLEADOS_ACTUALIZAR}`,
        this.buildBody({
          emailEmpleado,
          empleado:       empleadoBody,
          accesosSistema: accesos.map(a => ({ idRol: a.idRol, idModulo: a.idModulo })),
        })
      )
      .pipe(map(r => r.data));
  }
}

// ── Tipos de payload/respuesta del endpoint actualizar ───────────────────────

interface ActualizarEmpleadoPayload {
  fechaIngreso:       string;
  activo:             boolean;
  telefono:           string;
  idTipoContratacion: string;
  idCargo:            number;
  idSexo:             string;
  idEstadoCivil:      string;
  idMunicipio:        number;
  jefeInmediato:      { identidad: string };
}

export interface ActualizarEmpleadoRespuesta {
  status:  string;
  mensaje: string;
  email:   string;
}
