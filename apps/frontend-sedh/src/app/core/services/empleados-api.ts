import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CargoEmpleado {
  idCargo?: number;
  nomCargo?: string;
  nomcargo?: string;
  nombre?: string;
}

export interface TipoContratacionEmpleado {
  idTipoContratacion?: string;
  nombre?: string;
  creadoEn?: string;
  creadoPor?: string | null;
}

export interface Empleado {
  emailInstitucional: string;
  priNombre: string;
  segNombre?: string | null;
  priApellido: string;
  segApellido?: string | null;
    nombreCompleto?: string;
  fecIngLaboral?: string;
  actLaboralmente?: boolean | null;
  activo?: boolean;
  numIdentidad: string;
  numTelefono?: string | null;
  idTipoContratacion?: string;
  idCargo?: number;
  idSupInmediato?: string | null;
  idSexo?: string;
  idEstadoCivil?: string;
  idMunicipio?: number | null;
  cargo?: {
    idCargo?: number;
    nombre?: string;
    nomCargo?: string;
    nomcargo?: string;
  } | null;
  tipoContratacion?: {
    idTipoContratacion?: string;
    nombre?: string;
  } | null;
  sexo?: {
    idSexo?: string;
    nombre?: string;
    nomSexo?: string;
    nomsexo?: string;
  } | null;
  estadoCivil?: {
    idEstadoCivil?: string;
    nombre?: string;
    nomEstadoCivil?: string;
    nomestadocivil?: string;
  } | null;
  municipio?: {
    idMunicipio?: number;
    nombre?: string;
    nomMunicipio?: string;
    nommunicipio?: string;
  } | null;
}
export interface OpcionCatalogo {
  id: string | number;
  nombre: string;
}

export interface CatalogosEmpleado {
  cargos: OpcionCatalogo[];
  tiposContratacion: OpcionCatalogo[];
  sexos: OpcionCatalogo[];
  estadosCiviles: OpcionCatalogo[];
  municipios: OpcionCatalogo[];
}

export interface NuevoEmpleado {
  emailInstitucional: string;
  priNombre: string;
  segNombre?: string | null;
  priApellido: string;
  segApellido?: string | null;
  fecIngLaboral: string;
  actLaboralmente: boolean;
  numIdentidad: string;
  numTelefono?: string | null;
  idTipoContratacion: string;
  idCargo: number;
  idSupInmediato?: string | null;
  idSexo: string;
  idEstadoCivil: string;
  idMunicipio?: number | null;
}

export interface AccesoSistemaEmpleado {
  idRol: number;
  idModulo: number;
}

export interface CrearEmpleadoPayload {
  email: string;
  rol: number;
  idmodulo: number;
  contrasena: string;
  empleado: NuevoEmpleado;
  accesosSistema: AccesoSistemaEmpleado[];
}
export interface ActualizarEmpleadoPayload {
  emailEmpleado: string;
  empleado: Record<string, unknown>;
  accesosSistema: object[];
}
export interface VincularUsuarioEmpleadoPayload {
  idUsuario: string;

  empleado: {
    fecIngLaboral: string;
    actLaboralmente: boolean;
    numIdentidad: string;
    numTelefono: string | null;
    idTipoContratacion: string;
    idCargo: number;
    idSupInmediato: string | null;
    idSexo: string;
    idEstadoCivil: string;
    idMunicipio: number | null;
  };
}

export interface VincularUsuarioEmpleadoRespuesta {
  status: string;
  mensaje: string;
  idUsuario?: string;
  emailInstitucional?: string;
}
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmpleadosApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}` +
    `/rrhh/empleados`;

  listar(
  termino = '',
): Observable<Empleado[]> {
  let params = new HttpParams();

  if (termino.trim()) {
    params = params.set(
      'buscar',
      termino.trim(),
    );
  }
  return this.http
    .get<
      ApiResponse<Empleado[]> |
      Empleado[]
    >(
      `${this.apiUrl}/listar`,
      {
        params,
      },
    )
    .pipe(
      map((respuesta) => {
        if (Array.isArray(respuesta)) {
          return respuesta;
        }
        return respuesta.data ?? [];
      }),
    );
}
obtenerDatosSedh(): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/datos-sedh`,
    {},
  );
}
crearEmpleado(
  payload: CrearEmpleadoPayload,
): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/crear`,
    payload,
  );
}
obtenerEmpleadoPorCorreo(
  emailEmpleado: string,
): Observable<Empleado> {
  return this.http
    .post<any>(
      `${this.apiUrl}/buscar`,
      {
        emailEmpleado,
        email: '',
        rol: 1,
        idmodulo: 1,
      },
    )
    .pipe(
      map((respuesta) => {
        const datos =
          respuesta?.data ??
          respuesta;

        return (
          datos?.empleado ??
          datos
        ) as Empleado;
      }),
    );
}
actualizarEmpleado(
  payload: ActualizarEmpleadoPayload,
): Observable<any> {
  return this.http.post<any>(
    `${this.apiUrl}/actualizar`,
    {
      ...payload,
      email: '',
      rol: 1,
      idmodulo: 1,
    },
  );
}
vincularUsuarioEmpleado(
  payload: VincularUsuarioEmpleadoPayload,
): Observable<VincularUsuarioEmpleadoRespuesta> {
  return this.http.post<VincularUsuarioEmpleadoRespuesta>(
    `${this.apiUrl}/vincular-usuario`,
    payload,
  );
}
buscarEmpleado(
  emailEmpleado: string,
): Observable<Empleado> {
  return this.http
    .post<any>(
      `${this.apiUrl}/buscar`,
      {
        emailEmpleado,
      },
    )
    .pipe(
      map((respuesta) => {
        const datos =
          respuesta?.data ??
          respuesta;

        const empleado =
          datos?.empleado ??
          datos?.data?.empleado ??
          datos;

        if (!empleado) {
          throw new Error(
            'La consulta no devolvió información del empleado.',
          );
        }

        return empleado as Empleado;
      }),
    );
}

}
