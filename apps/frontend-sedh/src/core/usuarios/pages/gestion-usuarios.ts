import {  ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosApiService } from '../../../app/core/services/usuarios-api';
import { EncabezadosPaginaComponent } from '../../../app/components/encabezadosPagina/encabezadosPagina.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../app/services/auth.service';
import { finalize } from 'rxjs';
import { ToastService } from '../../../app/services/toast.service';
export interface Rol {
  idRol: number;
  nomRol: string;
  descripcion?: string;
}

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
@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.html',
  styleUrls: ['./gestion-usuarios.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, EncabezadosPaginaComponent ]
})

export class GestionUsuariosComponent implements OnInit {
  usuarioForm!: FormGroup;
  cargando = false;
  usuarios: Usuario[] = [];
  mostrarModal = false;
  rolTemporal: number | null = null;
  usuarioSeleccionado: Usuario | null = null;
  esAdministrador = false;
  usuariosFiltrados: Usuario[] = [];
  textoBusqueda = '';
  mostrarCambioPassword = false;
  nuevaPassword = '';
  confirmarPassword = '';
  mostrarNuevaPassword = false;
  guardandoPassword = false;

private authService = inject(AuthService);
private fb = inject(FormBuilder);
private usuariosService = inject(UsuariosApiService);
private readonly cdr = inject(ChangeDetectorRef);
private readonly toastService =
  inject(ToastService);

constructor() {
  this.usuarioForm = this.fb.group({
    emailInstitucional: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required],
    rol: ['', Validators.required]
  });
}

  ngOnInit(): void {
    this.verificarPermisos();
    if (this.esAdministrador) {
    this.obtenerUsuarios();
 }
}
verificarPermisos(): void {
  const usuarioLogueado = this.authService.currentUser();
  console.log('Usuario del Signal:', usuarioLogueado);
  this.esAdministrador = usuarioLogueado?.roles?.some(r => r.r === 5) ?? false;
  console.log('¿Es administrador?:', this.esAdministrador);
}
obtenerUsuarios(): void {
  console.log('Iniciando consulta de usuarios');
  this.cargando = true;
  this.usuarios = [];
  this.usuariosService
    .getUsuarios()
    .pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('Carga terminada. cargando:', this.cargando);
      })
    )
    .subscribe({
      next: (usuarios: Usuario[]) => {
        console.log('Usuarios procesados:', usuarios);
        console.log('Total:', usuarios.length);
        this.usuarios = usuarios;
        this.usuariosFiltrados = [...usuarios];
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
        console.error('Respuesta del backend:', err?.error);
        this.usuarios = [];
        alert(
          err?.error?.message ??
          'No se pudieron cargar los usuarios.'
        );
      }
    });
}
filtrarUsuarios(): void {
  const texto = this.textoBusqueda
    .trim()
    .toLowerCase();
  if (!texto) {
    this.usuariosFiltrados = [...this.usuarios];
    return;
  }
  this.usuariosFiltrados = this.usuarios.filter(usuario =>
    usuario.emailInstitucional?.toLowerCase().includes(texto)
    ||
    usuario.idUsuario?.toLowerCase().includes(texto)
    ||
    usuario.roles?.some(r =>
      r.nomRol.toLowerCase().includes(texto)
    )
  );
}
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
editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModal = true;
    console.log('Editando usuario:', this.usuarioSeleccionado);
  }
abrirEdicion(usuario: Usuario): void {
  this.usuarioSeleccionado = {
    ...usuario,
    roles: usuario.roles
      ? usuario.roles.map((rol) => ({ ...rol }))
      : []
  };
  this.rolTemporal =
    this.usuarioSeleccionado.roles?.[0]?.idRol ?? null;
  this.mostrarModal = true;
}

  cerrarModal(): void {
  this.mostrarModal = false;
  this.usuarioSeleccionado = null;
  this.mostrarCambioPassword = false;
  this.nuevaPassword = '';
  this.confirmarPassword = '';
}

guardarCambios(): void {
  if (!this.usuarioSeleccionado) {
    return;
  }
  const cambios = {
    activo:
      this.usuarioSeleccionado.activo,
    idRol:
      this.rolTemporal ??
      undefined,
  };

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
        this.toastService.mostrar(
          'error',
          err?.error?.message ??
            'No se pudieron guardar los cambios del usuario.',
        );
      },
    });
}
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

  const confirmar = confirm(
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
passwordTemporal = '';
confirmarPasswordTemporal = '';

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
