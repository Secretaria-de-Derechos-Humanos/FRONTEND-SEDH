import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'home', route: '/app/dashboard' },
    { label: 'Pendientes', icon: 'pending', route: '/app/recursosHumanos' },
  ];
}
