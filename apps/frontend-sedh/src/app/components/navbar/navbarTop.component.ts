import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ThemeToggleComponent } from '../themeToggle/themeToggle.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-top',
  standalone: true,
  imports: [ThemeToggleComponent],
  templateUrl: './navbarTop.component.html',
  styleUrl: './navbarTop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarTopComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isMenuOpen = signal(false);

  protected readonly userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'U';

    const nombreInicial = user.nombre?.charAt(0).toUpperCase() || '';
    const apellidoInicial = user.apellido?.charAt(0).toUpperCase() || '';

    return `${nombreInicial}${apellidoInicial}` || 'U';
  });

  toggleMenu(): void {
    this.isMenuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  navigateTo(route: string, fragment?: string): void {
    this.closeMenu();
    if (fragment) {
      this.router.navigate([route], { fragment });
    } else {
      this.router.navigate([route]);
    }
  }

  onLogout(): void {
    this.closeMenu();
    this.authService.logout();
  }
}
