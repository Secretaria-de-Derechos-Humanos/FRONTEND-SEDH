import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  NavigationEnd,
  Router,
} from '@angular/router';

import { filter } from 'rxjs/operators';

import { APP_CONFIG } from '../../config/app.config.constants';

import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;

  icon:
    | 'home'
    | 'pending'
    | 'approval'
    | 'security'
    | 'user'
    | 'vacation'
    | 'briefcase';

  route: string;

  rolesPermitidos?: number[];
}

@Component({
  selector: 'app-sidebar-left',
  standalone: true,
  imports: [],
  templateUrl: './sidebarLeft.component.html',
  styleUrl: './sidebarLeft.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLeftComponent {

  private readonly router =
    inject(Router);

  private readonly authService =
    inject(AuthService);

  protected readonly version =
    APP_CONFIG.version;

  protected readonly currentUrl =
    signal(this.router.url);

  /*
   * ROLES
   *
   * 1 = Empleado
   * 2 = Jefe inmediato
   * 3 = Subgerente RRHH
   * 4 = Agente de seguridad
   * 5 = Admin RRHH
   * 6 = Verificador de vacaciones
   */

  private readonly todosLosNavItems:
    NavItem[] = [

      // ========================================================
      // INICIO
      // ========================================================

      {
        label: 'Inicio',
        icon: 'home',
        route: '/menu-principal',
      },


      // ========================================================
      // PENDIENTES
      // ROLES: 2, 3, 5
      // ========================================================

      {
        label: 'Pendientes',
        icon: 'pending',
        route: '/pendientes',
        rolesPermitidos: [
          2,
          3,
          5,
        ],
      },


      // ========================================================
      // APROBACIONES
      // ROLES: 2, 3, 5
      // ========================================================

      {
        label: 'Aprobaciones',
        icon: 'approval',
        route: '/rrhh/aprobaciones',
        rolesPermitidos: [
          2,
          3,
          5,
        ],
      },


      // ========================================================
      // VERIFICACIÓN DE VACACIONES
      // ROLES: 5, 6
      //
      // 5 = Administrador RRHH
      // 6 = Verificador de vacaciones
      // ========================================================

      {
        label: 'Verificación de Vacaciones',
        icon: 'vacation',
        route: '/vacaciones/verificacion-saldo',
        rolesPermitidos: [
          5,
          6,
        ],
      },


      // ========================================================
      // CONTROL DE SALIDAS
      // ROLES: 4, 5
      //
      // 4 = Agente de seguridad
      // 5 = Administrador RRHH
      // ========================================================

      {
        label: 'Control de salidas',
        icon: 'security',
        route: '/rrhh/control-salidas',
        rolesPermitidos: [
          4,
          5,
        ],
      },


      // ========================================================
      // GESTIÓN DE CARGOS
      // ROLES: 3, 5
      //
      // 3 = Subgerente RRHH
      // 5 = Administrador RRHH
      // ========================================================

      {
        label: 'Gestión de cargos',
        icon: 'briefcase',
        route: '/rrhh/gestion-cargos',
        rolesPermitidos: [
          3,
          5,
        ],
      },


      // ========================================================
      // CREAR USUARIO
      // SOLO ROL 5
      // ========================================================

      {
        label: 'Crear Usuario',
        icon: 'user',
        route: '/crear-usuario',
        rolesPermitidos: [
          5,
        ],
      },
    ];


  // ============================================================
  // FILTRAR MENÚ SEGÚN ROL
  // ============================================================

  protected readonly navItems =
    computed<NavItem[]>(() => {

      const usuario =
        this.authService.currentUser();

      if (!usuario) {
        return [];
      }

      const rolesUsuario =
        usuario.roles.map(
          (rol) =>
            Number(rol.r),
        );

      return this.todosLosNavItems
        .filter((item) => {

          /*
           * Si el elemento no tiene roles
           * permitidos, cualquier usuario
           * autenticado puede verlo.
           */

          if (
            !item.rolesPermitidos?.length
          ) {
            return true;
          }

          /*
           * El usuario puede ver el elemento
           * si posee alguno de los roles
           * permitidos.
           */

          return item.rolesPermitidos
            .some(
              (rolPermitido) =>
                rolesUsuario.includes(
                  rolPermitido,
                ),
            );
        });
    });


  // ============================================================
  // CAMBIO DE RUTA
  // ============================================================

  constructor() {

    this.router.events
      .pipe(
        filter(
          (
            event,
          ): event is NavigationEnd =>
            event instanceof
            NavigationEnd,
        ),
      )
      .subscribe((event) => {

        this.currentUrl.set(
          event.urlAfterRedirects,
        );

      });
  }


  // ============================================================
  // NAVEGAR
  // ============================================================

  onNavigate(
    route: string,
  ): void {

    this.router
      .navigateByUrl(route)
      .then((success) => {

        if (success) {

          this.currentUrl.set(
            route,
          );

        } else {

          console.error(
            'Fallo en la navegación a:',
            route,
          );

        }

      });
  }


  // ============================================================
  // RUTA ACTIVA
  // ============================================================

  isActiveRoute(
    route: string,
  ): boolean {

    return (
      this.currentUrl() ===
        route ||

      this.currentUrl()
        .startsWith(
          `${route}/`,
        )
    );
  }
}
