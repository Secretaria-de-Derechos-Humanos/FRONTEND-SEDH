import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  map,
  switchMap,
  throwError,
} from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';

import {
  EP_RRHH_EMPLEADOS_ACTUALIZAR,
  EP_RRHH_EMPLEADOS_ACTUALIZAR_HORAS,
  EP_RRHH_EMPLEADOS_BUSCAR,
  EP_RRHH_EMPLEADOS_CREAR,
  EP_RRHH_EMPLEADOS_DATOS_SEDH,
} from '../../../../config/api.endpoints';

export interface JefeInmediato {
  identidad: string;
  nombre: string;
}

export interface EmpleadoDetalle {
  email: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaIngreso: string;
  activo: boolean;
  identidad: string;
  telefono: string;
  tipoContratacion: string;
  idTipoContratacion: string;
  dependencia: string;
  idDependencia: number;
  cargo: string;
  idCargo: number;
  sexo: string;
  idSexo: string;
  estadoCivil: string;
  idEstadoCivil: string;
  departamento: string;
  idDepartamento: number;
  municipio: string;
  idMunicipio: number;
  jefeInmediato: JefeInmediato;
  horasDisponibles: string;
}

export interface AccesoSistema {
  idRol: number;
  rol: string;
  idModulo: number;
  modulo: string;
}

export interface HistorialCargo {
  cargo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ResultadoBusquedaEmpleado {
  empleado: EmpleadoDetalle;
  accesosSistema: AccesoSistema[];
  historialCargos: HistorialCargo[];
}

export interface CatalogoItem {
  id: number | string;
  nombre: string;
}

export interface CargoCatalogo {
  id: number;
  nombre: string;
  idDependencia: number;
  dependencia: string;
}

export interface MunicipioCatalogo {
  id: number;
  nombre: string;
  idDepartamento: number;
}

export interface ModuloCatalogo {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface JefeInmediatoCatalogo {
  identidad: string;
  nombre: string;
  email: string;
  cargo: string;
  dependencia: string;
}

export interface DatosSedh {
  tiposContratacion: CatalogoItem[];
  dependencias: CatalogoItem[];
  cargos: CargoCatalogo[];
  sexos: CatalogoItem[];
  estadosCiviles: CatalogoItem[];
  departamentos: CatalogoItem[];
  municipios: MunicipioCatalogo[];
  roles: CatalogoItem[];
  modulos: ModuloCatalogo[];
  jefesInmediatos: JefeInmediatoCatalogo[];
}

interface BuscarEmpleadoData {
  status: string;
  mensaje?: string;
  empleado: EmpleadoDetalle;
  accesosSistema: AccesoSistema[];
  historialCargos: HistorialCargo[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface ActualizarEmpleadoPayload {
  fechaIngreso: string;
  activo: boolean;
  telefono: string;
  idTipoContratacion: string;
  idCargo: number;
  idSexo: string;
  idEstadoCivil: string;
  idMunicipio: number;
  jefeInmediato: {
    identidad: string;
  };
}

export interface ActualizarEmpleadoRespuesta {
  status: string;
  mensaje: string;
  email: string;
}

export interface ActualizarHorasRespuesta {
  status: string;
  mensaje: string;
  empleado?: {
    email: string;
    horasDisponibles: string;
  };
}

export interface NuevoEmpleadoPayload {
  email: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaIngreso: string;
  activo: boolean;
  identidad: string;
  telefono: string;
  idTipoContratacion: string;
  idCargo: number;
  idSexo: string;
  idEstadoCivil: string;
  idMunicipio: number;
  jefeInmediato: {
    identidad: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GestionEmpleadosService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = environment.apiBaseUrl;

  private buildBody(
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> {
    const user =
      this.authService.currentUser();
    const rol = user?.roles?.[0];
    const modulos = Array.isArray(rol?.m)
      ? rol.m
      : [rol?.m];

    return {
      email:
        user?.email ?? '',
      rol:
        Number(rol?.r ?? 5),
      idmodulo:
        Number(
          modulos.find(
            (id) => Number(id) === 1,
          ) ??
          modulos[0] ??
          1,
        ),
      ...extra,
    };
  }

 buscarEmpleado(
  emailEmpleado: string,
): Observable<ResultadoBusquedaEmpleado> {
  return this.http
    .post<ApiResponse<BuscarEmpleadoData>>(
      `${this.base}${EP_RRHH_EMPLEADOS_BUSCAR}`,
      {
        emailEmpleado:
          emailEmpleado.trim().toLowerCase(),
      },
    )
    .pipe(
      switchMap((respuesta) => {
        if (
          respuesta.data?.status === 'ERROR'
        ) {
          return throwError(
            () =>
              new Error(
                respuesta.data.mensaje ??
                  'Empleado no encontrado',
              ),
          );
        }

        return [
          {
            empleado:
              respuesta.data.empleado,
            accesosSistema:
              respuesta.data.accesosSistema ?? [],
            historialCargos:
              respuesta.data.historialCargos ?? [],
          },
        ];
      }),
    );
}

  cargarDatosSedh(): Observable<DatosSedh> {
    return this.http
      .post<ApiResponse<DatosSedh>>(
        `${this.base}${EP_RRHH_EMPLEADOS_DATOS_SEDH}`,
        this.buildBody(),
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  actualizarEmpleado(
    emailEmpleado: string,
    edicion: EmpleadoDetalle,
    accesos: AccesoSistema[],
  ): Observable<ActualizarEmpleadoRespuesta> {
    const empleado:
      ActualizarEmpleadoPayload = {
        fechaIngreso:
          edicion.fechaIngreso,

        activo:
          edicion.activo,

        telefono:
          edicion.telefono ?? '',

        idTipoContratacion:
          String(edicion.idTipoContratacion),

        idCargo:
          Number(edicion.idCargo),

        idSexo:
          String(edicion.idSexo),

        idEstadoCivil:
          String(edicion.idEstadoCivil),

        idMunicipio:
          Number(edicion.idMunicipio),

        jefeInmediato: {
          identidad:
            edicion.jefeInmediato.identidad,
        },
      };

    const accesosSistema =
      accesos.map((acceso) => ({
        idRol:
          Number(acceso.idRol),

        idModulo:
          Number(acceso.idModulo),
      }));

    return this.http
      .post<
        ApiResponse<ActualizarEmpleadoRespuesta>
      >(
        `${this.base}${EP_RRHH_EMPLEADOS_ACTUALIZAR}`,
        this.buildBody({
          emailEmpleado,
          empleado,
          accesosSistema,
        }),
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }

  actualizarHorasDisponibles(
    emailEmpleado: string,
    horasDisponibles: string,
  ): Observable<ActualizarHorasRespuesta> {
    return this.http
      .post<
        ApiResponse<ActualizarHorasRespuesta>
      >(
        `${this.base}${EP_RRHH_EMPLEADOS_ACTUALIZAR_HORAS}`,
        this.buildBody({
          emailEmpleado,
          horasDisponibles,
        }),
      )
      .pipe(
        map((respuesta) => respuesta.data),

        switchMap((resultado) => {
          if (
            resultado.status ===
            'ERROR'
          ) {
            return throwError(
              () =>
                new Error(
                  resultado.mensaje,
                ),
            );
          }

          return [resultado];
        }),
      );
  }

  crearEmpleado(
    nuevoEmpleado: NuevoEmpleadoPayload,
    accesos: {
      idRol: number;
      idModulo: number;
    }[],
    contrasena: string,
  ): Observable<ActualizarEmpleadoRespuesta> {
    return this.http
      .post<
        ApiResponse<ActualizarEmpleadoRespuesta>
      >(
        `${this.base}${EP_RRHH_EMPLEADOS_CREAR}`,
        this.buildBody({
          contrasena,
          empleado: nuevoEmpleado,
          accesosSistema: accesos,
        }),
      )
      .pipe(
        map((respuesta) => respuesta.data),
      );
  }
}
