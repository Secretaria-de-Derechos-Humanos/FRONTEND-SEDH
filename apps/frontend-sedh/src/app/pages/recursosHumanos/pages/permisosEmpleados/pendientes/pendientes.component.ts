import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SolicitudPendiente {
  id: string;
  fechaSolicitud: Date;
  empleado: string;
  tipoSolicitud: string;
  dependencia: string;
  estado: 'pendiente' | 'en-revision';
}

@Component({
  selector: 'app-pendientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PendientesComponent {
  solicitudes = signal<SolicitudPendiente[]>([
    {
      id: '001',
      fechaSolicitud: new Date('2026-05-01'),
      empleado: 'Ana María González',
      tipoSolicitud: 'Permiso personal',
      dependencia: 'Recursos Humanos',
      estado: 'pendiente'
    },
    {
      id: '002',
      fechaSolicitud: new Date('2026-05-02'),
      empleado: 'Carlos Eduardo Martínez',
      tipoSolicitud: 'Vacaciones',
      dependencia: 'Finanzas',
      estado: 'en-revision'
    },
    {
      id: '003',
      fechaSolicitud: new Date('2026-05-03'),
      empleado: 'María José Rodríguez',
      tipoSolicitud: 'Licencia médica',
      dependencia: 'Administrativa',
      estado: 'pendiente'
    },
    {
      id: '004',
      fechaSolicitud: new Date('2026-05-04'),
      empleado: 'Juan Pablo Hernández',
      tipoSolicitud: 'Permiso familiar',
      dependencia: 'Tecnología',
      estado: 'pendiente'
    }
  ]);

  cargando = signal<boolean>(false);

  aprobarSolicitud(id: string): void {
    console.log('Aprobar solicitud:', id);
    // TODO: Implementar lógica de aprobación
  }

  rechazarSolicitud(id: string): void {
    console.log('Rechazar solicitud:', id);
    // TODO: Implementar lógica de rechazo
  }

  verDetalles(id: string): void {
    console.log('Ver detalles de solicitud:', id);
    // TODO: Implementar navegación a detalles
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
