import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionButtonComponent } from '../../components/actionButton/actionButton.component';
import { EncabezadosPaginaComponent } from '../../components/encabezadosPagina/encabezadosPagina.component';
import { ModalAprobarPermisosRRHHComponent, SolicitudPermiso, RechazarPayload } from '../../components/modalAprobarPermisosRRHH/modalAprobarPermisosRRHH.component';

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
  imports: [CommonModule, FormsModule, ActionButtonComponent, EncabezadosPaginaComponent, ModalAprobarPermisosRRHHComponent],
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PendientesComponent {
  // Datos originales
  solicitudesOriginales = signal<SolicitudPendiente[]>([
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

  // Filtros
  filtroFecha = signal<string>('');
  filtroEmpleado = signal<string>('');
  filtroTipo = signal<string>('');
  filtroDependencia = signal<string>('');

  // Solicitudes filtradas
  solicitudes = computed(() => {
    const originales = this.solicitudesOriginales();
    const fecha = this.filtroFecha().toLowerCase().trim();
    const empleado = this.filtroEmpleado().toLowerCase().trim();
    const tipo = this.filtroTipo().toLowerCase().trim();
    const dependencia = this.filtroDependencia().toLowerCase().trim();

    return originales.filter(solicitud => {
      const fechaFormateada = this.formatearFecha(solicitud.fechaSolicitud).toLowerCase();
      const nombreEmpleado = solicitud.empleado.toLowerCase();
      const tipoSolicitud = solicitud.tipoSolicitud.toLowerCase();
      const nombreDependencia = solicitud.dependencia.toLowerCase();

      return (
        fechaFormateada.includes(fecha) &&
        nombreEmpleado.includes(empleado) &&
        tipoSolicitud.includes(tipo) &&
        nombreDependencia.includes(dependencia)
      );
    });
  });

  cargando = signal<boolean>(false);

  modalPermisoVisible = signal<boolean>(false);
  solicitudSeleccionada = signal<SolicitudPermiso | null>(null);

  abrirModalPermiso(solicitud: SolicitudPermiso): void {
    this.solicitudSeleccionada.set(solicitud);
    this.modalPermisoVisible.set(true);
  }

  cerrarModalPermiso(): void {
    this.modalPermisoVisible.set(false);
    this.solicitudSeleccionada.set(null);
  }

  aprobarSolicitud(id: string): void {
    console.log('Aprobar solicitud:', id);
    // TODO: Implementar lógica de aprobación
  }

  rechazarSolicitud(payload: RechazarPayload): void {
    console.log('Rechazar solicitud:', payload.id, '| Motivo:', payload.motRechazo);
    // TODO: Implementar lógica de rechazo
  }

  verDetalles(id: string): void {
    const solicitud = this.solicitudesOriginales().find(s => s.id === id);
    if (!solicitud) return;

    if (solicitud.tipoSolicitud.toLowerCase() === 'permiso personal') {
      this.abrirModalPermiso(solicitud);
    }
  }

  /**
   * Maneja la acción seleccionada del speed dial
   * @param action - ID de la acción seleccionada
   * @param solicitudId - ID de la solicitud
   */
  handleAction(action: string, solicitudId: string): void {
    switch(action) {
      case 'view':
        this.verDetalles(solicitudId);
        break;
      case 'edit':
        this.aprobarSolicitud(solicitudId);
        break;
      case 'delete':
        this.verDetalles(solicitudId);
        break;
    }
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
