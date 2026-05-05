import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

interface MenuOption {
  label: string;
  description: string;
  icon: string;
  route: string;
  rolesPermitidos: number[];
}

@Component({
  selector: 'app-recursos-humanos-main',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recursosHumanosMain.component.html',
  styleUrls: ['./recursosHumanosMain.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecursosHumanosMainComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  private todasLasOpciones = signal<MenuOption[]>([
    {
      label: 'Solicitudes de empleado',
      description: 'Gestione las solicitudes de permisos de los empleados',
      icon: 'pi pi-file-edit',
      route: '/rrhh/mis-solicitudes',
      rolesPermitidos: [1, 5]
    }
  ]);

  // Filtrar opciones según el rol del usuario actual
  opcionesDisponibles = computed(() => {
    const usuario = this.authService.currentUser();
    if (!usuario) return [];

    const rolUsuario = usuario.rol;
    return this.todasLasOpciones().filter(opcion =>
      opcion.rolesPermitidos.includes(rolUsuario)
    );
  });

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  onKeyPress(event: KeyboardEvent, ruta: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navegarA(ruta);
    }
  }
}
