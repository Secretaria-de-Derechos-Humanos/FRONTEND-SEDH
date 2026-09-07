import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import {
  NotificacionesService,
  Notificacion,
} from '../../services/notificaciones.service';
import { ThemeToggleComponent } from '../themeToggle/themeToggle.component';

@Component({
  selector: 'app-navbar-top',
  standalone: true,

  imports: [
    ThemeToggleComponent,
    DatePipe,
  ],
  templateUrl: './navbarTop.component.html',
  styleUrl: './navbarTop.component.css',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class NavbarTopComponent {

  protected readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly notificacionesService =
    inject(NotificacionesService);

  private readonly destroyRef =
    inject(DestroyRef);


  // ============================================================
  // MENÚ USUARIO
  // ============================================================

  protected readonly isMenuOpen =
    signal(false);


  // ============================================================
  // NOTIFICACIONES
  // ============================================================

  protected readonly isNotificationsOpen =
    signal(false);

  protected readonly notificaciones =
    signal<Notificacion[]>([]);

  protected readonly cantidadNoLeidas =
    signal(0);


  // ============================================================
  // INICIALES DEL USUARIO
  // ============================================================

  protected readonly userInitials =
    computed(() => {

      const user =
        this.authService.currentUser();

      if (!user) {
        return 'U';
      }

      const nombreInicial =
        user.nombre
          ?.charAt(0)
          .toUpperCase() || '';

      const apellidoInicial =
        user.apellido
          ?.charAt(0)
          .toUpperCase() || '';

      return (
        `${nombreInicial}${apellidoInicial}` ||
        'U'
      );
    });


  constructor() {

    /*
     * Actualizamos las notificaciones
     * inmediatamente y posteriormente
     * cada 30 segundos.
     */

    interval(30000)
      .pipe(
        startWith(0),

        switchMap(() =>
          this.notificacionesService
            .listarNoLeidas(),
        ),

        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: (notificaciones) => {

          this.notificaciones.set(
            notificaciones,
          );

          this.cantidadNoLeidas.set(
            notificaciones.length,
          );
        },

        error: (error) => {

          console.error(
            'Error obteniendo notificaciones:',
            error,
          );
        },
      });
  }


  // ============================================================
  // MENÚ USUARIO
  // ============================================================

  toggleMenu(): void {

    this.isMenuOpen.update(
      (value) => !value,
    );

    /*
     * Si abrimos el menú de usuario,
     * cerramos notificaciones.
     */

    if (this.isMenuOpen()) {
      this.isNotificationsOpen.set(false);
    }
  }


  closeMenu(): void {
    this.isMenuOpen.set(false);
  }


  // ============================================================
  // NOTIFICACIONES
  // ============================================================

  toggleNotifications(): void {

    this.isNotificationsOpen.update(
      (value) => !value,
    );

    /*
     * Si abrimos notificaciones,
     * cerramos menú de usuario.
     */

    if (this.isNotificationsOpen()) {
      this.isMenuOpen.set(false);
    }
  }


  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }


  // ============================================================
  // MARCAR UNA NOTIFICACIÓN
  // ============================================================

  marcarComoLeida(
    notificacion: Notificacion,
  ): void {

    /*
     * Si ya está leída no hacemos nada.
     */

    if (notificacion.leida) {
      return;
    }

    this.notificacionesService
      .marcarComoLeida(
        notificacion.idNotificacion,
      )
      .subscribe({
        next: () => {

          /*
           * La quitamos de la lista
           * de no leídas.
           */

          this.notificaciones.update(
            (lista) =>
              lista.filter(
                (item) =>
                  item.idNotificacion !==
                  notificacion.idNotificacion,
              ),
          );

          this.cantidadNoLeidas.update(
            (cantidad) =>
              Math.max(0, cantidad - 1),
          );
        },

        error: (error) => {

          console.error(
            'Error marcando notificación como leída:',
            error,
          );
        },
      });
  }


  // ============================================================
  // MARCAR TODAS COMO LEÍDAS
  // ============================================================

  marcarTodasComoLeidas(): void {

    if (
      this.cantidadNoLeidas() === 0
    ) {
      return;
    }

    this.notificacionesService
      .marcarTodasComoLeidas()
      .subscribe({
        next: () => {

          this.notificaciones.set([]);

          this.cantidadNoLeidas.set(0);
        },

        error: (error) => {

          console.error(
            'Error marcando notificaciones:',
            error,
          );
        },
      });
  }


  // ============================================================
  // NAVEGACIÓN
  // ============================================================

  navigateTo(
    route: string,
    fragment?: string,
  ): void {

    this.closeMenu();

    this.closeNotifications();

    if (fragment) {

      this.router.navigate(
        [route],
        { fragment },
      );

    } else {

      this.router.navigate(
        [route],
      );
    }
  }


  // ============================================================
  // CLICK EN NOTIFICACIÓN
  // ============================================================

  abrirNotificacion(
    notificacion: Notificacion,
  ): void {

    /*
     * Primero la marcamos como leída.
     */

    this.marcarComoLeida(
      notificacion,
    );

    /*
     * Por ahora cerramos el menú.
     *
     * Después podemos hacer que cada
     * tipo lleve automáticamente a:
     *
     * VACACIONES
     * PERMISOS
     * APROBACIONES
     * CONTROL DE SALIDAS
     */

    this.closeNotifications();
  }


  // ============================================================
  // CERRAR SESIÓN
  // ============================================================

  onLogout(): void {

    this.closeMenu();

    this.closeNotifications();

    this.authService
      .logout()
      .subscribe();
  }
}
