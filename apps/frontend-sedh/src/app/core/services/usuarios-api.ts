import {
  Injectable,
  inject,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
  map,
} from 'rxjs';

import {
  environment,
} from '../../../environments/environment';

import {
  Usuario,
  Dependencia,
} from '../../../core/usuarios/pages/gestion-usuarios';

// =========================================================
// RESPUESTAS
// =========================================================

export interface AsignarPasswordTemporalResponse {
  message: string;
  debeCambiarPassword: boolean;
}

export interface CrearUsuarioPayload {
  priNombre: string;
  segNombre?: string | null;
  priApellido: string;
  segApellido?: string | null;
  emailInstitucional: string;
  contrasena: string;
  idRol: number;
  creadoPor?: string;
}

export interface CrearUsuarioResultado {
  idUsuario: string;
  emailInstitucional: string;
  priNombre: string;
  segNombre: string | null;
  priApellido: string;
  segApellido: string | null;
  idRol: number;
  message?: string;
  mensaje?: string;
}

interface RolBackend {
  idRol?: number;
  idrol?: number;
  nomRol?: string;
  nomrol?: string;
}

interface UsuarioBackend {
  idUsuario?: string;
  idusuario?: string;
  emailInstitucional?: string;
  emailinstitucional?: string;
  priNombre?: string;
  prinombre?: string;
  segNombre?: string;
  segnombre?: string;
  priApellido?: string;
  priapellido?: string;
  segApellido?: string;
  segapellido?: string;
  nombre?: string;
  activo?: boolean | string | null;
  roles?: RolBackend[];
}

interface DependenciaBackend {
  idDependencia?: number;
  iddependencia?: number;

  nomDependencia?: string;
  nomdependencia?: string;
}

interface DependenciaUsuarioBackend {
  idDependencia?: number;
  iddependencia?: number;

  nomDependencia?: string;
  nomdependencia?: string;

  idCargo?: number;
  idcargo?: number;

  nomCargo?: string;
  nomcargo?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ResetPasswordResponse {
  message: string;
  passwordTemporal?: string;
}

// =========================================================
// SERVICIO
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class UsuariosApiService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/core/usuarios`;

  // =========================================================
  // LISTAR USUARIOS
  // =========================================================

  getUsuarios(): Observable<Usuario[]> {

    return this.http

      .get<
        ApiResponse<UsuarioBackend[]>
      >(
        `${this.apiUrl}/listar`,
      )

      .pipe(

        map((respuesta) => {

          const datos =
            respuesta?.data ?? [];

          return datos.map(
            (usuario): Usuario => ({

              idUsuario:
                usuario.idUsuario ??
                usuario.idusuario ??
                '',

              emailInstitucional:
                usuario.emailInstitucional ??
                usuario.emailinstitucional ??
                '',

             nombre:
              (
                usuario.nombre ??
                [
                  usuario.priNombre ?? usuario.prinombre,
                  usuario.segNombre ?? usuario.segnombre,
                  usuario.priApellido ?? usuario.priapellido,
                  usuario.segApellido ?? usuario.segapellido,
                ]
                  .filter(Boolean)
                  .join(' ')
              ).trim() || null,

              activo:
                usuario.activo === true ||
                usuario.activo === 'true',

              roles:
                (
                  usuario.roles ?? []
                ).map(
                  (rol) => ({

                    idRol:
                      Number(
                        rol.idRol ??
                        rol.idrol ??
                        0,
                      ),

                    nomRol:
                      rol.nomRol ??
                      rol.nomrol ??
                      '',
                  }),
                ),
            }),
          );
        }),
      );
  }

  // =========================================================
  // OBTENER TODAS LAS DEPENDENCIAS
  // =========================================================

  getDependencias(): Observable<Dependencia[]> {

    return this.http

      .get<
        ApiResponse<
          DependenciaBackend[]
        >
      >(
        `${this.apiUrl}/dependencias`,
      )

      .pipe(

        map((respuesta: any) => {

          /*
           * Normalmente recibiremos:
           *
           * {
           *   success: true,
           *   data: [...]
           * }
           *
           * Pero dejamos compatibilidad con
           * una respuesta que pudiera venir
           * nuevamente envuelta en data.
           */

          let datos =
            respuesta?.data ?? [];

          if (
            !Array.isArray(datos) &&
            Array.isArray(datos?.data)
          ) {

            datos = datos.data;
          }

          if (!Array.isArray(datos)) {

            console.error(
              'Respuesta inesperada de dependencias:',
              respuesta,
            );

            return [];
          }

          return datos.map(
            (
              dependencia: DependenciaBackend,
            ): Dependencia => ({

              idDependencia:
                Number(
                  dependencia.idDependencia ??
                  dependencia.iddependencia ??
                  0,
                ),

              nomDependencia:
                dependencia.nomDependencia ??
                dependencia.nomdependencia ??
                '',
            }),
          );
        }),
      );
  }

  // =========================================================
  // OBTENER DEPENDENCIA DEL USUARIO
  // =========================================================

  obtenerDependenciaUsuario(
    idUsuario: string,
  ): Observable<DependenciaUsuarioBackend> {

    return this.http

      .get<
        ApiResponse<
          DependenciaUsuarioBackend
        >
      >(
        `${this.apiUrl}/${idUsuario}/dependencia`,
      )

      .pipe(

        map((respuesta: any) => {

          /*
           * Compatible con:
           *
           * {
           *   success: true,
           *   data: {...}
           * }
           *
           * y también con una respuesta
           * doblemente envuelta.
           */

          let datos =
            respuesta?.data ?? null;

          if (
            datos &&
            !datos.idDependencia &&
            !datos.iddependencia &&
            datos.data
          ) {

            datos = datos.data;
          }

          if (!datos) {

            return {
              idDependencia: undefined,
              nomDependencia: '',
              idCargo: undefined,
              nomCargo: '',
            };
          }

          return {

            idDependencia:
              Number(
                datos.idDependencia ??
                datos.iddependencia ??
                0,
              ),

            nomDependencia:
              datos.nomDependencia ??
              datos.nomdependencia ??
              '',

            idCargo:
              datos.idCargo ??
              datos.idcargo,

            nomCargo:
              datos.nomCargo ??
              datos.nomcargo ??
              '',
          };
        }),
      );
  }

  // =========================================================
  // CREAR USUARIO
  // =========================================================

  crearUsuario(
    usuario: CrearUsuarioPayload,
  ): Observable<CrearUsuarioResultado> {

    return this.http

      .post<
        ApiResponse<
          CrearUsuarioResultado
        >
      >(
        `${this.apiUrl}/crear`,
        usuario,
      )

      .pipe(

        map(
          (respuesta) =>
            respuesta.data,
        ),
      );
  }

  // =========================================================
  // REGISTRAR USUARIO
  // =========================================================

  registrarUsuario(
    usuario: CrearUsuarioPayload,
  ): Observable<CrearUsuarioResultado> {

    return this.crearUsuario(
      usuario,
    );
  }

  // =========================================================
  // ACTUALIZAR USUARIO
  // =========================================================

  actualizar(
    idUsuario: string,

    cambios: {
      activo?: boolean;

      idRoles?: number[];

      idDependencia?: number;

      contrasena?: string;
    },
  ): Observable<unknown> {

    return this.http.patch(

      `${this.apiUrl}/actualizar/${idUsuario}`,

      cambios,

    );
  }

  // =========================================================
  // RESTABLECER PASSWORD
  // =========================================================

  resetPassword(
    idUsuario: string,
  ): Observable<ResetPasswordResponse> {

    return this.http

      .post<
        ResetPasswordResponse
      >(
        `${this.apiUrl}/${idUsuario}/reset-password`,
        {},
      );
  }

  // =========================================================
  // PASSWORD TEMPORAL
  // =========================================================

  asignarPasswordTemporal(
    idUsuario: string,

    nuevaPassword: string,
  ): Observable<
    AsignarPasswordTemporalResponse
  > {

    return this.http

      .patch<
        AsignarPasswordTemporalResponse
      >(
        `${this.apiUrl}/${idUsuario}/password`,
        {
          nuevaPassword,
        },
      );
  }

  // =========================================================
  // CAMBIAR PASSWORD
  // =========================================================

  cambiarPassword(
    passwordActual: string,

    nuevaPassword: string,
  ): Observable<unknown> {

    return this.http.patch(

      `${this.apiUrl}/cambiar-password`,

      {
        passwordActual,

        nuevaPassword,
      },
    );
  }
}
