import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ThemeToggleComponent } from '../themeToggle/themeToggle.component';
import { Router } from '@angular/router';

@Component({
  selector: 'sedh-navbar-top',
  standalone: true,
  imports: [MenuModule, ThemeToggleComponent],
  templateUrl: './navbarTop.component.html',
  styleUrl: './navbarTop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarTopComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Iniciales del usuario
  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'U';

    const nombreInicial = user.nombre?.charAt(0).toUpperCase() || '';
    const apellidoInicial = user.apellido?.charAt(0).toUpperCase() || '';

    return `${nombreInicial}${apellidoInicial}` || 'U';
  });

  protected readonly userMenuItems: MenuItem[] = [
    {
      label: 'Ver perfil',
      icon: 'pi pi-user',
      command: () => {
        this.router.navigate(['/app/configuracion-usuario']);
      }
    },
    {
      label: 'Seguridad',
      icon: 'pi pi-shield',
      command: () => {
        this.router.navigate(['/app/configuracion-usuario'], { fragment: 'seguridad' });
      }
    },
    {
      separator: true
    },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      styleClass: 'menu-item-logout',
      command: () => {
        this.onLogout();
      }
    }
  ];

  onLogout(): void {
    this.authService.logout();
  }
}
