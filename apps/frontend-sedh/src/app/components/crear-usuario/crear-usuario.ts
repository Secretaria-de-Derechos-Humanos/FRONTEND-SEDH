import {
  Component,
  OnInit,
  inject,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  UsuariosApiService,
} from '../../core/services/usuarios-api';

interface CrearUsuarioRespuesta {
  idUsuario?: string;
  idusuario?: string;

  emailInstitucional?: string;
  emailinstitucional?: string;

  priNombre?: string;
  prinombre?: string;

  segNombre?: string | null;
  segnombre?: string | null;

  priApellido?: string;
  priapellido?: string;

  segApellido?: string | null;
  segapellido?: string | null;

  idRol?: number;
  idrol?: number;

  debeCambiarPassword?: boolean;

  message?: string;
  mensaje?: string;
}

interface RespuestaApiCrearUsuario
  extends CrearUsuarioRespuesta {
  data?: CrearUsuarioRespuesta;
}

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './crear-usuario.html',
  styleUrls: ['./crear-usuario.css'],
})
export class CrearUsuarioComponent implements OnInit {
  usuarioForm!: FormGroup;
  enviando = false;

  private readonly fb =
    inject(FormBuilder);

  private readonly usuariosService =
    inject(UsuariosApiService);

  private readonly router =
    inject(Router);

  ngOnInit(): void {
    this.usuarioForm = this.fb.group({
      priNombre: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],

      segNombre: [
        '',
        [
          Validators.maxLength(50),
        ],
      ],

      priApellido: [
        '',
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      ],

      segApellido: [
        '',
        [
          Validators.maxLength(50),
        ],
      ],

      emailInstitucional: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(50),
        ],
      ],

      contrasena: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
          ),
        ],
      ],

      idRol: [
        null,
        [
          Validators.required,
        ],
      ],

      creadoPor: [
        'Administrador',
      ],
    });
  }

  guardar(): void {
    if (this.enviando) {
      return;
    }

    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const valores =
      this.usuarioForm.getRawValue();

    const payload = {
      priNombre:
        String(
          valores.priNombre ?? '',
        )
          .trim()
          .toUpperCase(),

      segNombre:
        String(
          valores.segNombre ?? '',
        )
          .trim()
          .toUpperCase() || null,

      priApellido:
        String(
          valores.priApellido ?? '',
        )
          .trim()
          .toUpperCase(),

      segApellido:
        String(
          valores.segApellido ?? '',
        )
          .trim()
          .toUpperCase() || null,

      emailInstitucional:
        String(
          valores.emailInstitucional ?? '',
        )
          .trim()
          .toLowerCase(),

      contrasena:
        String(
          valores.contrasena ?? '',
        ),

      idRol:
        Number(
          valores.idRol,
        ),

      creadoPor:
        String(
          valores.creadoPor ??
          'Administrador',
        ).trim(),
    };

    this.enviando = true;

    this.usuariosService
      .registrarUsuario(payload)
      .subscribe({
        next: async (
          respuesta: unknown,
        ) => {
          console.log(
            'Respuesta completa al crear usuario:',
            respuesta,
          );

          const respuestaApi =
            respuesta as RespuestaApiCrearUsuario;

          const datos =
            respuestaApi.data ??
            respuestaApi;

          console.log(
            'Datos procesados del usuario:',
            datos,
          );

          const idUsuario =
            datos.idUsuario ??
            datos.idusuario ??
            '';

          const email =
            datos.emailInstitucional ??
            datos.emailinstitucional ??
            payload.emailInstitucional;

          if (!idUsuario) {
            this.enviando = false;

            console.error(
              'El backend no devolvió idUsuario:',
              datos,
            );

            alert(
              'El usuario fue creado, pero el backend no devolvió su identificador.',
            );

            return;
          }

          const queryParams = {
            idUsuario,

            email,

            priNombre:
              datos.priNombre ??
              datos.prinombre ??
              payload.priNombre,

            segNombre:
              datos.segNombre ??
              datos.segnombre ??
              payload.segNombre ??
              '',

            priApellido:
              datos.priApellido ??
              datos.priapellido ??
              payload.priApellido,

            segApellido:
              datos.segApellido ??
              datos.segapellido ??
              payload.segApellido ??
              '',

            idRol:
              datos.idRol ??
              datos.idrol ??
              payload.idRol,
          };

          console.log(
            'Parámetros enviados a Agregar empleado:',
            queryParams,
          );

          try {
            const navego =
              await this.router.navigate(
                [
                  '/rrhh/empleados/crear',
                ],
                {
                  queryParams,
                },
              );

            this.enviando = false;

            console.log(
              'Resultado de la navegación:',
              navego,
            );

            if (!navego) {
              alert(
                'El usuario fue creado, pero no se pudo abrir el formulario de empleado.',
              );
            }
          } catch (error) {
            this.enviando = false;
            console.error(
              'Error al redirigir a Agregar empleado:',
              error,
            );

            alert(
              'El usuario fue creado, pero ocurrió un error al abrir Agregar empleado.',
            );
          }
        },
        error: (
          error: HttpErrorResponse,
        ) => {
          console.error(
            'Error al crear usuario:',
            error,
          );
          const mensaje =
            error.error?.error?.message ??
            error.error?.message ??
            error.message ??
            'No se pudo conectar con el servidor.';
          alert(
            `Error: ${mensaje}`,
          );

          this.enviando = false;
        },
      });
  }
}
