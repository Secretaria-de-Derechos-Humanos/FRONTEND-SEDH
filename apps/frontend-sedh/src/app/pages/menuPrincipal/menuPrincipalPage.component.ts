import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

interface MenuOption {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'primary' | 'secondary';
}

@Component({
  selector: 'sedh-menu-principal-page',
  standalone: true,
  imports: [],
  templateUrl: './menuPrincipalPage.component.html',
  styleUrl: './menuPrincipalPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPrincipalPageComponent {
  protected readonly menuOptions: MenuOption[] = [
    {
      title: 'Recursos humanos',
      description: 'Gestión de personal, nómina y expedientes de empleados',
      icon: 'users',
      route: '/recursos-humanos',
      color: 'primary'
    },
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
