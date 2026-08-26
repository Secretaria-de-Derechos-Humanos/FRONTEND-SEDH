import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { finalize } from 'rxjs';

import { UsuariosApiService } from '../../../app/core/services/usuarios-api';
import { EncabezadosPaginaComponent } from '../../../app/components/encabezadosPagina/encabezadosPagina.component';
import { AuthService } from '../../../app/services/auth.service';
import { ToastService } from '../../../app/services/toast.service';

// =========================================================
// ROL
// =========================================================

export interface Rol {
  idRol: number;
  nomRol: string;
  descripcion?: string;
}

// =========================================================
// USUARIO
// =========================================================

export interface Usuario {
  idUsuario: string;
  emailInstitucional: string;
  nombre?: string | null;
  contrasena?: string;
  activo: boolean;
  ultimoAcceso?: string | null;
  creadoEn?: string;
  creadoPor?: string | null;
  actualizadoEn?: string | null;
  actualizadoPor?: string | null;
  roles?: Rol[];
}

// =========================================================
// DEPENDENCIA
// =========================================================

export interface Dependencia {
  idDependencia: number;
  nomDependencia: string;
}

// =========================================================
// COMPONENTE
// =========================================================

@Component({
  selector: 'app-gestion-usuarios',

  templateUrl: './gestion-usuarios.html',

  styleUrls: ['./gestion-usuarios.css'],

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EncabezadosPaginaComponent,
  ],
})
export class GestionUsuariosComponent implements OnInit {

  // =========================================================
  // FORMULARIO
  // =========================================================

  usuarioForm!: FormGroup;

  // =========================================================
  // ESTADOS
  // =========================================================

  cargando = false;

  cargandoDependencias = false;

  usuarios: Usuario[] = [];

  usuariosFiltrados: Usuario[] = [];

  dependencias: Dependencia[] = [];

  mostrarModal = false;

  mostrarCambioPassword = false;

  guardandoPassword = false;

  esAdministrador = false;

  // =========================================================
  // SELECCIÓN
  // =========================================================

  usuarioSeleccionado: Usuario | null = null;

  rolesTemporales: number[] = [];

  dependenciaTemporal: number | null = null;

  dependenciaActual: Dependencia | null = null;

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  textoBusqueda = '';

  // =========================================================
  // PASSWORD
  // =========================================================

  nuevaPassword = '';

  confirmarPassword = '';

  mostrarNuevaPassword = false;

  passwordTemporal = '';

  confirmarPasswordTemporal = '';

  // =========================================================
  // INYECCIÓN
  // =========================================================

  private readonly authService =
    inject(AuthService);

  private readonly fb =
    inject(FormBuilder);

  private readonly usuariosService =
    inject(UsuariosApiService);

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly toastService =
    inject(ToastService);

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor() {

    this.usuarioForm =
      this.fb.group({
        emailInstitucional: [
          '',
          [
            Validators.required,
            Validators.email,
          ],
        ],

        contrasena: [
          '',
          Validators.required,
        ],

        rol: [
          '',
          Validators.required,
        ],
      });
  }

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.verificarPermisos();

    if (this.esAdministrador) {

      this.obtenerUsuarios();

      // Cargamos las dependencias desde el inicio.
      this.obtenerDependencias();
    }
  }

  // =========================================================
  // PERMISOS
  // =========================================================

  verificarPermisos(): void {

    const usuarioLogueado =
      this.authService.currentUser();

    console.log(
      'Usuario del Signal:',
      usuarioLogueado,
    );

    this.esAdministrador =
      usuarioLogueado?.roles?.some(
        (r: any) => Number(r.idRol ?? r.r) === 5,
      ) ?? false;

    console.log(
      '¿Es administrador?:',
      this.esAdministrador,
    );
  }

  // =========================================================
  // OBTENER USUARIOS
  // =========================================================

  obtenerUsuarios(): void {

    console.log(
      'Iniciando consulta de usuarios',
    );

    this.cargando = true;

    this.usuarios = [];

    this.usuariosService
      .getUsuarios()
      .pipe(
        finalize(() => {

          this.cargando = false;

          this.cdr.detectChanges();

          console.log(
            'Carga terminada. cargando:',
            this.cargando,
          );
        }),
      )
      .subscribe({

        next: (usuarios: Usuario[]) => {

          console.log(
            'Usuarios procesados:',
            usuarios,
          );

          console.log(
            'Total:',
            usuarios.length,
          );

          this.usuarios = usuarios;

          this.usuariosFiltrados =
            [...usuarios];
        },

        error: (err) => {

          console.error(
            'Error al obtener usuarios:',
            err,
          );

          console.error(
            'Respuesta del backend:',
            err?.error,
          );

          this.usuarios = [];

          this.usuariosFiltrados = [];

          this.toastService.mostrar(
            'error',
            err?.error?.message ??
              'No se pudieron cargar los usuarios.',
          );
        },
      });
  }

  // =========================================================
  // OBTENER DEPENDENCIAS
  // =========================================================

  obtenerDependencias(): void {

    console.log(
      'Consultando todas las dependencias...',
    );

    this.cargandoDependencias = true;

    this.usuariosService
      .getDependencias()
      .pipe(
        finalize(() => {

          this.cargandoDependencias = false;

          this.cdr.detectChanges();

          console.log(
            'Dependencias cargadas:',
            this.dependencias,
          );

          console.log(
            'TOTAL DEPENDENCIAS:',
            this.dependencias.length,
          );
        }),
      )
      .subscribe({

        next: (dependencias: Dependencia[]) => {

          console.log(
            'DEPENDENCIAS RECIBIDAS:',
            dependencias,
          );

          if (Array.isArray(dependencias)) {

            this.dependencias =
              dependencias;
          } else {

            console.error(
              'La respuesta de dependencias no es un arreglo:',
              dependencias,
            );

            this.dependencias = [];
          }
        },

        error: (err) => {

          console.error(
            'Error al obtener dependencias:',
            err,
          );

          console.error(
            'Respuesta del backend:',
            err?.error,
          );

          this.dependencias = [];

          this.toastService.mostrar(
            'error',
            'No se pudieron cargar las dependencias.',
          );
        },
      });
  }

  // =========================================================
  // FILTRAR USUARIOS
  // =========================================================

  filtrarUsuarios(): void {

    const texto =
      this.textoBusqueda
        .trim()
        .toLowerCase();

    if (!texto) {

      this.usuariosFiltrados =
        [...this.usuarios];

      return;
    }

    this.usuariosFiltrados =
      this.usuarios.filter(
        (usuario) =>

          usuario.emailInstitucional
            ?.toLowerCase()
            .includes(texto)

          ||

          usuario.idUsuario
            ?.toLowerCase()
            .includes(texto)

          ||

          usuario.roles?.some(
            (r) =>
              r.nomRol
                .toLowerCase()
                .includes(texto),
          ),
      );
  }

  // =========================================================
  // CREAR USUARIO
  // =========================================================

  guardar(): void {

    if (!this.usuarioForm.valid) {

      this.usuarioForm.markAllAsTouched();

      this.toastService.mostrar(
        'error',
        'Complete correctamente los campos obligatorios.',
      );

      return;
    }

    this.usuariosService
      .crearUsuario(
        this.usuarioForm.value,
      )
      .subscribe({

        next: () => {

          this.toastService.mostrar(
            'exito',
            'Usuario registrado correctamente.',
          );

          this.usuarioForm.reset();

          this.obtenerUsuarios();
        },

        error: (err) => {

          console.error(
            'Error al crear usuario:',
            err,
          );

          this.toastService.mostrar(
            'error',
            err?.error?.message ??
              'No se pudo registrar el usuario.',
          );
        },
      });
  }

  // =========================================================
  // EDITAR USUARIO
  // =========================================================

  editarUsuario(usuario: Usuario): void {

    this.abrirEdicion(usuario);
  }

  // =========================================================
  // ABRIR EDICIÓN
  // =========================================================

  abrirEdicion(usuario: Usuario): void {

    this.usuarioSeleccionado = {
      ...usuario,

      roles: usuario.roles
        ? usuario.roles.map(
            (rol) => ({
              ...rol,
            }),
          )
        : [],
    };

    this.rolesTemporales =
      (this.usuarioSeleccionado.roles ?? [])
        .map((rol) => Number(rol.idRol))
        .filter((idRol) => Number.isInteger(idRol) && idRol > 0);

    this.dependenciaTemporal = null;

    this.dependenciaActual = null;

    this.mostrarCambioPassword = false;

    this.nuevaPassword = '';

    this.confirmarPassword = '';

    this.mostrarNuevaPassword = false;

    this.mostrarModal = true;

    console.log(
      'Usuario seleccionado:',
      this.usuarioSeleccionado,
    );

    console.log(
      'Roles seleccionados:',
      this.rolesTemporales,
    );

    this.cargarDependenciaUsuario(
      usuario.idUsuario,
    );
  }

  // =========================================================
  // CARGAR DEPENDENCIA DEL USUARIO
  // =========================================================

  cargarDependenciaUsuario(
    idUsuario: string,
  ): void {

    console.log(
      'Consultando dependencia actual del usuario:',
      idUsuario,
    );

    this.cargandoDependencias = true;

    this.usuariosService
      .obtenerDependenciaUsuario(
        idUsuario,
      )
      .pipe(
        finalize(() => {

          this.cargandoDependencias = false;

          this.cdr.detectChanges();
        }),
      )
      .subscribe({

        next: (dependencia) => {

          console.log(
            'RESPUESTA DEPENDENCIA ACTUAL:',
            dependencia,
          );

          if (
            dependencia &&
            dependencia.idDependencia
          ) {

            this.dependenciaActual = {
              idDependencia:
                Number(
                  dependencia.idDependencia,
                ),

              nomDependencia:
                dependencia.nomDependencia ??
                '',
            };

            this.dependenciaTemporal =
              Number(
                dependencia.idDependencia,
              );

          } else {

            this.dependenciaActual = null;

            this.dependenciaTemporal =
              null;
          }

          console.log(
            'Dependencia seleccionada:',
            this.dependenciaTemporal,
          );
        },

        error: (err) => {

          console.error(
            'Error al obtener dependencia:',
            err,
          );

          this.dependenciaActual = null;

          this.dependenciaTemporal = null;

          // No bloqueamos la edición.
          // El usuario podría no tener empleado asociado.
        },
      });
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  cerrarModal(): void {

    this.mostrarModal = false;

    this.usuarioSeleccionado = null;

    this.rolesTemporales = [];

    this.dependenciaTemporal = null;

    this.dependenciaActual = null;

    this.mostrarCambioPassword = false;

    this.nuevaPassword = '';

    this.confirmarPassword = '';

    this.mostrarNuevaPassword = false;
  }

  // =========================================================
  // ROLES
  // =========================================================

  tieneRol(idRol: number): boolean {
    return this.rolesTemporales.includes(idRol);
  }

  cambiarRol(idRol: number, seleccionado: boolean): void {
    if (seleccionado) {
      if (!this.rolesTemporales.includes(idRol)) {
        this.rolesTemporales = [
          ...this.rolesTemporales,
          idRol,
        ];
      }
      return;
    }

    this.rolesTemporales =
      this.rolesTemporales.filter(
        (rol) => rol !== idRol,
      );
  }

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================

  guardarCambios(): void {

    if (!this.usuarioSeleccionado) {

      return;
    }

    const cambios: {
      activo?: boolean;
      idRoles?: number[];
      idDependencia?: number;
    } = {

      activo:
        this.usuarioSeleccionado
          .activo,

      idRoles:
        this.rolesTemporales.length
          ? [...new Set(this.rolesTemporales)]
          : undefined,

      idDependencia:
        this.dependenciaTemporal ??
        undefined,
    };

    console.log(
      'CAMBIOS A GUARDAR:',
      cambios,
    );

    this.cargando = true;

    this.usuariosService
      .actualizar(
        this.usuarioSeleccionado.idUsuario,
        cambios,
      )
      .subscribe({

        next: (respuesta) => {

          console.log(
            'Cambios guardados:',
            respuesta,
          );

          this.cargando = false;

          this.toastService.mostrar(
            'exito',
            'Los cambios del usuario se guardaron correctamente.',
          );

          this.cerrarModal();

          this.obtenerUsuarios();
        },

        error: (err) => {

          console.error(
            'Error al actualizar usuario:',
            err,
          );

          this.cargando = false;

          const mensaje =
            err?.error?.message ??
            err?.error?.error?.message ??
            'No se pudieron guardar los cambios del usuario.';

          this.toastService.mostrar(
            'error',
            mensaje,
          );
        },
      });
  }

  // =========================================================
  // RESTABLECER PASSWORD
  // =========================================================

  restablecerPassword(): void {

    if (
      !this.usuarioSeleccionado?.idUsuario
    ) {

      this.toastService.mostrar(
        'error',
        'Debe seleccionar un usuario.',
      );

      return;
    }

    const confirmar =
      confirm(
        `¿Desea restablecer la contraseña de ${this.usuarioSeleccionado.emailInstitucional}?`,
      );

    if (!confirmar) {

      return;
    }

    this.cargando = true;

    this.usuariosService
      .resetPassword(
        this.usuarioSeleccionado.idUsuario,
      )
      .subscribe({

        next: () => {

          this.cargando = false;

          this.toastService.mostrar(
            'exito',
            'La contraseña fue restablecida correctamente.',
          );

          this.cerrarModal();
        },

        error: (err) => {

          this.cargando = false;

          console.error(
            'Error al restablecer contraseña:',
            err,
          );

          this.toastService.mostrar(
            'error',
            err?.error?.message ??
              'No se pudo restablecer la contraseña.',
          );
        },
      });
  }

  // =========================================================
  // CAMBIO DE PASSWORD
  // =========================================================

  abrirCambioPassword(): void {

    this.mostrarCambioPassword = true;

    this.nuevaPassword = '';

    this.confirmarPassword = '';

    this.mostrarNuevaPassword = false;
  }

  cancelarCambioPassword(): void {

    this.mostrarCambioPassword = false;

    this.nuevaPassword = '';

    this.confirmarPassword = '';

    this.mostrarNuevaPassword = false;
  }

  // =========================================================
  // GUARDAR PASSWORD TEMPORAL
  // =========================================================

  guardarPasswordTemporal(): void {

    if (!this.usuarioSeleccionado) {

      this.toastService.mostrar(
        'error',
        'Debe seleccionar un usuario.',
      );

      return;
    }

    const passwordNueva =
      String(
        this.nuevaPassword ?? '',
      ).trim();

    const passwordConfirmada =
      String(
        this.confirmarPassword ?? '',
      ).trim();

    if (
      !passwordNueva ||
      !passwordConfirmada
    ) {

      this.toastService.mostrar(
        'error',
        'Debe completar ambos campos.',
      );

      return;
    }

    if (passwordNueva.length < 8) {

      this.toastService.mostrar(
        'error',
        'La contraseña debe tener al menos 8 caracteres.',
      );

      return;
    }

    if (
      passwordNueva !==
      passwordConfirmada
    ) {

      this.toastService.mostrar(
        'error',
        'Las contraseñas no coinciden.',
      );

      return;
    }

    this.guardandoPassword = true;

    this.usuariosService
      .asignarPasswordTemporal(
        this.usuarioSeleccionado.idUsuario,
        passwordNueva,
      )
      .subscribe({

        next: () => {

          this.guardandoPassword = false;

          this.toastService.mostrar(
            'exito',
            'La contraseña temporal fue asignada correctamente.',
          );

          this.cancelarCambioPassword();
        },

        error: (error) => {

          this.guardandoPassword = false;

          console.error(
            'Error al asignar contraseña:',
            error,
          );

          this.toastService.mostrar(
            'error',
            error?.error?.error?.message ??
              error?.error?.message ??
              'No se pudo asignar la contraseña.',
          );
        },
      });
  }
}
