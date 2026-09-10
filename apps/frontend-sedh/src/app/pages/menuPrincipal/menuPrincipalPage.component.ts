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
    {
      title: 'Almacén',
      description: 'Gestión de inventario, stock y control de almacén',
      imageLight: '/LogoMenu-ALMACEN.png',
      route: '/almacen',
      color: 'primary',
    },
    {
      title: 'Gestión de Usuarios',
     imageLight: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23747a80"><path d="M12 1a1.5 1.5 0 0 1 1.41 1.01l.21.65a1 1 0 0 0 1.15.67l.67-.14a1.5 1.5 0 0 1 1.63.76l.75 1.3a1.5 1.5 0 0 1-.34 1.77l-.5.42a1 1 0 0 0-.25 1.25l.23.63a1 1 0 0 0 1.22.58l.67-.17a1.5 1.5 0 0 1 1.73 1.15l.3 1.47a1.5 1.5 0 0 1-1.15 1.73l-.67.14a1 1 0 0 0-.67 1.15l.14.67a1.5 1.5 0 0 1-.76 1.63l-1.3.75a1.5 1.5 0 0 1-1.77-.34l-.42-.5a1 1 0 0 0-1.25-.25l-.63.23a1 1 0 0 0-.58 1.22l.17.67a1.5 1.5 0 0 1-1.15 1.73l-1.47.3a1.5 1.5 0 0 1-1.73-1.15l-.14-.67a1 1 0 0 0-1.15-.67l-.67.14a1.5 1.5 0 0 1-1.63-.76l-.75-1.3a1.5 1.5 0 0 1 .34-1.77l.5-.42a1 1 0 0 0 .25-1.25l-.23-.63a1 1 0 0 0-1.22-.58l-.67.17a1.5 1.5 0 0 1-1.73-1.15l-.3-1.47a1.5 1.5 0 0 1 1.15-1.73l.67-.14a1 1 0 0 0 .67-1.15l-.14-.67a1.5 1.5 0 0 1 .76-1.63l1.3-.75a1.5 1.5 0 0 1 1.77.34l.42.5a1 1 0 0 0 1.25.25l.63-.23a1 1 0 0 0 .58-1.22l-.17-.67a1.5 1.5 0 0 1 1.15-1.73zM12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/><circle cx="12" cy="10" r="2.5"/><path d="M12 13.5c-2.3 0-4.5 1.1-4.5 2.5v.5h9v-.5c0-1.4-2.2-2.5-4.5-2.5z"/></svg>',
      description: 'Administración de roles, estados y contraseñas',
      route: 'gestion-usuarios',
      color: 'primary'
    },

];

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
