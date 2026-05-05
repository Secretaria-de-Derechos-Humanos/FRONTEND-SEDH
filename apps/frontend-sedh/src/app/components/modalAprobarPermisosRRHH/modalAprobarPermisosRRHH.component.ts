import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SolicitudPermiso {
  id: string;
  empleado: string;
  tipoSolicitud: string;
  dependencia: string;
  fechaSolicitud: Date;
}

@Component({
  selector: 'app-modal-aprobar-permisos-rrhh',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modalAprobarPermisosRRHH.component.html',
  styleUrls: ['./modalAprobarPermisosRRHH.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAprobarPermisosRRHHComponent {
  solicitud = input.required<SolicitudPermiso>();
  visible = input.required<boolean>();

  cerrar = output<void>();
  aprobar = output<string>();
  rechazar = output<string>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  onAprobar(): void {
    this.aprobar.emit(this.solicitud().id);
  }

  onRechazar(): void {
    this.rechazar.emit(this.solicitud().id);
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
