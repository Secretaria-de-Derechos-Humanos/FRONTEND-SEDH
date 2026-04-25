import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ThemeToggleComponent } from '../themeToggle/themeToggle.component';

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

  protected readonly userMenuItems: MenuItem[] = [
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      command: () => {
        console.log('Ver perfil');
      }
    },
    {
      separator: true
    },
    {
      label: 'Cerrar Sesión',
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
