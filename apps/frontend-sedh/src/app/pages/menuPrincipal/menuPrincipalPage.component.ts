import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EncabezadosPaginaComponent } from '../../components/encabezadosPagina/encabezadosPagina.component';
import { CardComponent } from '../../components/card/card.component';

interface MenuOption {
  title: string;
  description: string;
  imageLight: string;
  route: string;
  color: 'primary' | 'secondary';
}

@Component({
  selector: 'app-menu-principal-page',
  standalone: true,
  imports: [EncabezadosPaginaComponent, CardComponent],
  templateUrl: './menuPrincipalPage.component.html',
  styleUrl: './menuPrincipalPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPrincipalPageComponent {
  private readonly router = inject(Router);

  protected menuOptions: MenuOption[] = [
    {
      title: 'Recursos humanos',
      description: 'Gestión de personal, nómina y expedientes de empleados',
      imageLight: '/LogoMenuLight-RRHH.png',
      route: '/rrhh',
      color: 'secondary',
    },
  ];

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
