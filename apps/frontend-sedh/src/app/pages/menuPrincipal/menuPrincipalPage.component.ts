import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { EncabezadosPaginaComponent } from '../../components/encabezadosPagina/encabezadosPagina.component';

interface MenuOption {
  title: string;
  description: string;
  imageLight: string;
  route: string;
  color: 'primary' | 'secondary';
  isOpening?: boolean;
}

@Component({
  selector: 'app-menu-principal-page',
  standalone: true,
  imports: [EncabezadosPaginaComponent],
  templateUrl: './menuPrincipalPage.component.html',
  styleUrl: './menuPrincipalPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPrincipalPageComponent {
  protected menuOptions: MenuOption[] = [
    {
      title: 'Recursos humanos',
      description: 'Gestión de personal, nómina y expedientes de empleados',
      imageLight: '/LogoMenuLight-RRHH.png',
      route: '/rrhh',
      color: 'secondary',
      isOpening: false
    },
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    // Encontrar la opción seleccionada
    const selectedOption = this.menuOptions.find(opt => opt.route === route);

    if (selectedOption) {
      // Activar animación de cierre completo de la puerta
      selectedOption.isOpening = true;

      // Navegar después de que la puerta se cierre (600ms)
      setTimeout(() => {
        this.router.navigate([route]);
      }, 600);
    }
  }
}
