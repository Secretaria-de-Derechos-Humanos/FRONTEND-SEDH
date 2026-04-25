import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'sedh-navbar-top',
  standalone: true,
  imports: [MenuModule],
  templateUrl: './navbarTop.component.html',
  styleUrl: './navbarTop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarTopComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);

  sidebarCollapsed = input<boolean>(false);
  toggleSidebar = output<void>();

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
      command: () => {
        this.onLogout();
      }
    }
  ];

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
