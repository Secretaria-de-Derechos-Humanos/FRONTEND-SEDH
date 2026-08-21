import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Usuario } from '../../../core/usuarios/pages/gestion-usuarios';

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

  activo?: boolean | string | null;

  roles?: RolBackend[];
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

@Injectable({
  providedIn: 'root',
})
export class UsuariosApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/core/usuarios`;

  // =========================================================
  // LISTAR USUARIOS
  // =========================================================

  getUsuarios(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponse<UsuarioBackend[]>>(
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

              nombre: null,

              // IMPORTANTE:
              // Ya no ponemos "true" fijo.
              // Tomamos el valor real del backend.
              activo:
                usuario.activo === true ||
                usuario.activo === 'true',

              roles:
                (usuario.roles ?? []).map(
                  (rol) => ({
                    idRol: Number(
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
  // CREAR USUARIO
  // =========================================================

  crearUsuario(
    usuario: CrearUsuarioPayload,
  ): Observable<CrearUsuarioResultado> {
    return this.http
      .post<
        ApiResponse<CrearUsuarioResultado>
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

  registrarUsuario(
    usuario: CrearUsuarioPayload,
  ): Observable<CrearUsuarioResultado> {
    return this.crearUsuario(usuario);
  }

  // =========================================================
  // ACTUALIZAR USUARIO
  // =========================================================

  actualizar(
    idUsuario: string,
    cambios: {
      activo?: boolean;
      idRol?: number;
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
    return this.http.post<
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
  ): Observable<AsignarPasswordTemporalResponse> {
    return this.http.patch<
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
