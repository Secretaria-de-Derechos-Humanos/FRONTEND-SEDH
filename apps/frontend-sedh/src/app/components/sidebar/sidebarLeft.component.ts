import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { APP_CONFIG } from '../../config/app.config.constants';

interface NavItem {
  label: string;
  icon: 'home' | 'pending';
  route: string;
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
  private readonly router = inject(Router);

  // Versión del sistema desde package.json
  protected readonly version = APP_CONFIG.version;

  // Signal para la ruta actual
  protected currentUrl = signal<string>(this.router.url);

  readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'home', route: '/menu-principal' },
    { label: 'Pendientes', icon: 'pending', route: '/pendientes' },
  ];

  constructor() {
    // Actualizar el signal cuando cambie la ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  onNavigate(route: string): void {
    this.router.navigateByUrl(route).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa a:', route);
        this.currentUrl.set(route);
      } else {
        console.error('❌ Fallo en navegación a:', route);
      }
    });
  }

  isActiveRoute(route: string): boolean {
    return this.currentUrl() === route;
  }
}
