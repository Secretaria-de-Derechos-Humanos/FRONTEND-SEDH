import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SolicitudPermiso {
  id: string;
  id_permiso?: string;
  empleado: string;
  pri_nombre?: string;
  seg_nombre?: string;
  pri_apellido?: string;
  seg_apellido?: string;
  tipoSolicitud: string;
  nom_tipo_solicitud?: string;
  dependencia: string;
  nom_dependencia?: string;
  fechaSolicitud: Date;
  fec_solicitud?: Date;
  nom_cargo?: string;
  hor_solicitadas?: string;
  motivo?: string;
  cat_emergencia?: boolean;
  nom_estado?: string;
  mot_rechazo?: string | null;
}

export interface RechazarPayload {
  id: string;
  motRechazo: string;
}

@Component({
  selector: 'app-modal-aprobar-permisos-rrhh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modalAprobarPermisosRRHH.component.html',
  styleUrls: ['./modalAprobarPermisosRRHH.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAprobarPermisosRRHHComponent {
  solicitud = input.required<SolicitudPermiso>();
  visible = input.required<boolean>();

  cerrar = output<void>();
  aprobar = output<string>();
  rechazar = output<RechazarPayload>();

  motRechazo = signal<string>('');

  get tipoSolicitud(): string {
    return (this.solicitud().nom_tipo_solicitud ?? this.solicitud().tipoSolicitud).toUpperCase();
  }

  get nombreCompleto(): string {
    const s = this.solicitud();
    if (s.pri_nombre) {
      return [s.pri_nombre, s.seg_nombre, s.pri_apellido, s.seg_apellido]
        .filter(Boolean).join(' ');
    }
    return s.empleado;
  }

  get esPermisoOficial(): boolean {
    return this.tipoSolicitud === 'PERMISO OFICIAL';
  }

  onCerrar(): void {
    this.motRechazo.set('');
    this.cerrar.emit();
  }

  onAprobar(): void {
    this.aprobar.emit(this.solicitud().id);
    this.motRechazo.set('');
  }

  onRechazar(): void {
    if (!this.motRechazo().trim()) {
      alert('Debe ingresar el motivo de rechazo para no aprobar la solicitud.');
      return;
    }
    this.rechazar.emit({ id: this.solicitud().id, motRechazo: this.motRechazo() });
    this.motRechazo.set('');
  }

  formatearFecha(fecha: Date | undefined): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
