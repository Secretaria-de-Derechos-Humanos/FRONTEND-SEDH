import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface ModuloOption {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color: 'primary' | 'secondary';
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
  modulos = signal<ModuloOption[]>([
    {
      titulo: 'Permisos de empleados',
      descripcion: 'Gestione solicitudes, aprobaciones, salidas y retornos del personal de la institución',
      icono: 'pi pi-file-edit',
      ruta: '/recursos-humanos/permisos',
      color: 'primary'
    },
    {
      titulo: 'Control de asistencia',
      descripcion: 'Monitoree y administre la asistencia diaria del personal',
      icono: 'pi pi-calendar-clock',
      ruta: '/recursos-humanos/asistencia',
      color: 'secondary'
    }
  ]);

  constructor(private router: Router) {}

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
