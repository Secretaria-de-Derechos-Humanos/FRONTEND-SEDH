import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/navigation.model';

@Component({
  selector: 'sedh-sidebar-left',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebarLeft.component.html',
  styleUrl: './sidebarLeft.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLeftComponent {
  collapsed = input<boolean>(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/app/dashboard' },
    { label: 'Recursos Humanos', icon: 'pi pi-users', route: '/app/recursosHumanos' },
  ];
}
