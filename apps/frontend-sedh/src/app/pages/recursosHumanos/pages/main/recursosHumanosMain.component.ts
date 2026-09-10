import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  Router,
  RouterModule,
} from '@angular/router';

import { AuthService } from '../../../../services/auth.service';

import {
  EncabezadosPaginaComponent,
} from '../../../../components/encabezadosPagina/encabezadosPagina.component';

import {
  CardComponent,
} from '../../../../components/card/card.component';

interface MenuOption {
  label: string;
  imageUrl: string;
  route: string;
  rolesPermitidos: number[];
}

@Component({
  selector: 'app-recursos-humanos-main',
  standalone: true,

  imports: [
    CommonModule,
    RouterModule,
    EncabezadosPaginaComponent,
    CardComponent,
  ],

  templateUrl: './recursosHumanosMain.component.html',

  styleUrls: [
    './recursosHumanosMain.component.css',
  ],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecursosHumanosMainComponent {

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  // =========================================================
  // OPCIONES DEL MÓDULO DE RECURSOS HUMANOS
  // =========================================================

  private readonly todasLasOpciones =
    signal<MenuOption[]>([

      // =====================================================
      // SOLICITAR ALGO A RRHH
      // ROLES: 1, 2, 3, 4, 5
      // =====================================================

      {
        label: 'Solicitar  Permisos',

        imageUrl: 'LogoSolicitarAlgo-RRHH.png',

        route: '/rrhh/mis-solicitudes',

        rolesPermitidos: [
          1,
          2,
          3,
          4,
          5,
        ],
      },

      // =====================================================
// SOLICITAR CONSTANCIA
// ROLES: 1, 5
// =====================================================

{
  label: 'Solicitar constancia',

  imageUrl: 'solicitar_constancia.png',

  route: '/constancias/solicitar',

  rolesPermitidos: [
    1,
    5,
  ],
},

      // =====================================================
      // CONTROL DE SALIDAS Y RETORNOS
      // ROLES: 4, 5
      // =====================================================

      {
        label: 'Control de salidas y retornos',

        imageUrl: 'LogoControlAsistencia-RRHH.png',

        route: '/rrhh/control-salidas',

        rolesPermitidos: [
          4,
          5,
        ],
      },

      // =====================================================
      // REPORTE DE PERMISOS
      // ROLES: 3, 5
      // =====================================================

      {
        label: 'Reporte de permisos',

        imageUrl: 'LogoReportePermisos-RRHH.png',

        route: '/rrhh/reporte-permisos',

        rolesPermitidos: [
          3,
          5,
        ],
      },
      // =====================================================
     // REPORTE DE VACACIONES
      // ROLES: 2, 3, 5
    // =====================================================

    {
      label: 'Reporte de vacaciones',

      imageUrl: 'ReporteVacaciones.png',

      route: '/vacaciones/reporte',

      rolesPermitidos: [
        2,
        3,
        5,
      ],
    },

    // =====================================================
// SOLICITAR VACACIONES
// ROLES: 1, 2, 3, 4, 5
// =====================================================

{
  label: 'Vacaciones',

  imageUrl: 'Solicitar_Vacaciones.png',

  route: '/vacaciones/solicitar',

  rolesPermitidos: [
    1,
    2,
    3,
    4,
    5,
  ],
},
      // =====================================================
      // GESTIÓN DE EMPLEADOS
      // ROLES: 3, 5
      // =====================================================

      {
        label: 'Gestión de empleados',

        imageUrl: 'LogoGestionEmpleados-RRHH.png',

        route: '/rrhh/gestion-empleados',

        rolesPermitidos: [
          3,
          5,
        ],
      },

      // =====================================================
// GESTIÓN DE CONSTANCIAS
// ROLES: 3, 5
// =====================================================

{
  label: 'Gestión de constancias',

  imageUrl: 'gestion_constancia.png',

  route: '/constancias/gestion',

  rolesPermitidos: [
    3,
    5,
  ],
},
      // =====================================================
      // VACACIONES PENDIENTES JEFE
      // ROLES: 2, 5
      // =====================================================

      {
        label: 'Aprobación de vacaciones - Jefe',

        imageUrl: 'LogoVacacionesJefe.png',

        route: '/vacaciones/pendientes-jefe',

        rolesPermitidos: [
          2,
          5,
        ],
      },

      // =====================================================
      // VACACIONES PENDIENTES SUBGERENCIA
      // ROLES: 3, 5
      // =====================================================

      {
        label: 'Aprobación de vacaciones - Subgerencia',

        imageUrl: 'LogoVacacionesSubG.png',

        route: '/vacaciones/pendientes-subgerente',

        rolesPermitidos: [
          3,
          5,
        ],
      },

    ]);

  // =========================================================
  // OPCIONES DISPONIBLES PARA EL USUARIO
  // =========================================================

  readonly opcionesDisponibles = computed(() => {

    const usuario = this.authService.currentUser();

    if (!usuario) {
      return [];
    }

    /*
     * Un usuario puede tener más de un rol.
     */

    const rolesUsuario =
      (usuario.roles ?? [])
        .map(
          (rol) => Number(rol.r),
        );

    return this.todasLasOpciones()
      .filter(
        (opcion) =>
          opcion.rolesPermitidos
            .some(
              (rolPermitido) =>
                rolesUsuario.includes(
                  rolPermitido,
                ),
            ),
      );
  });

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  navegarA(
    ruta: string,
  ): void {

    if (!ruta) {
      return;
    }

    this.router.navigateByUrl(
      ruta,
    );
  }

  // =========================================================
  // ACCESIBILIDAD
  // =========================================================

  onKeyPress(
    event: KeyboardEvent,
    ruta: string,
  ): void {

    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {

      event.preventDefault();

      this.navegarA(
        ruta,
      );
    }
  }
}
