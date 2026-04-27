import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_CONFIG } from '../../config/app.config.constants';

interface NavItem {
  label: string;
  icon: 'home' | 'pending';
  route: string;
}

@Component({
  selector: 'sedh-sidebar-left',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebarLeft.component.html',
  styleUrl: './sidebarLeft.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLeftComponent {
  // Versión del sistema desde package.json
  protected readonly version = APP_CONFIG.version;

  readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'home', route: '/app/menu-principal' },
    { label: 'Pendientes', icon: 'pending', route: '/app/pendientes' },
  ];
}
