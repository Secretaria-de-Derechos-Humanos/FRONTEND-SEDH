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

import {
  APP_CONFIG,
} from '../../config/app.config.constants';

import {
  AuthService,
} from '../../services/auth.service';

interface NavItem {
  label: string;

  icon:
    | 'home'
    | 'pending'
    | 'approval'
    | 'security'
    | 'user';

  route: string;

  rolesPermitidos?: number[];
}

@Component({
  selector: 'app-sidebar-left',
  standalone: true,
  imports: [],
  templateUrl: './sidebarLeft.component.html',
  styleUrl: './sidebarLeft.component.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
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
   * 1 = Empleado normal
   * 2 = Jefe inmediato
   * 3 = Subgerente RRHH
   * 4 = Agente de seguridad
   * 5 = Administrador
   */
  private readonly todosLosNavItems:
    NavItem[] = [
      {
        label: 'Inicio',
        icon: 'home',
        route: '/menu-principal',
      },

      /*
       * Solicitudes que necesitan revisión.
       *
       * El agente de seguridad NO entra aquí.
       */
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

      /*
       * Aprobaciones de RRHH.
       */
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

      /*
       * NUEVO:
       * módulo independiente del agente.
       *
       * 4 = Agente de seguridad
       * 5 = Administrador
       */
      {
        label: 'Control de salidas',
        icon: 'security',
        route: '/rrhh/control-salidas',
        rolesPermitidos: [
          4,
          5,
        ],
      },

      /*
       * Gestión de usuarios.
       */
      {
        label: 'Crear Usuario',
        icon: 'user',
        route: '/crear-usuario',
        rolesPermitidos: [
          5,
        ],
      },
    ];

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
          if (
            !item.rolesPermitidos
              ?.length
          ) {
            return true;
          }

          return item.rolesPermitidos
            .some(
              (rolPermitido) =>
                rolesUsuario.includes(
                  rolPermitido,
                ),
            );
        });
    });

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
