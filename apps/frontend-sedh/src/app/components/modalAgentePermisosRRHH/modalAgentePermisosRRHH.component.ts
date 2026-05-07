import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudPermiso } from '../modalAprobarPermisosRRHH/modalAprobarPermisosRRHH.component';

export interface SolicitudAgentePermiso extends SolicitudPermiso {
  hor_salida?: string | null;
  hor_retorno?: string | null;
}

export interface HoraSalidaPayload {
  id: string;
  horaSalida: string;
}

export interface HoraRetornoPayload {
  id: string;
  horaRetorno: string;
}

@Component({
  selector: 'app-modal-agente-permisos-rrhh',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modalAgentePermisosRRHH.component.html',
  styleUrls: ['./modalAgentePermisosRRHH.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAgentePermisosRRHHComponent {
  solicitud = input.required<SolicitudAgentePermiso>();
  visible = input.required<boolean>();

  cerrar = output<void>();
  registrarSalida = output<HoraSalidaPayload>();
  registrarRetorno = output<HoraRetornoPayload>();

  horaSalida = signal<string>('');
  horaRetorno = signal<string>('');
  horaInvalida = signal<boolean>(false);
  mensajeError = signal<string>('');

  horaSalidaBloqueada = computed(() => {
    const hs = this.solicitud().hor_salida;
    return hs !== null && hs !== undefined && hs !== '';
  });

  horaRetornoBloqueada = computed(() => !this.horaSalidaBloqueada());

  constructor() {
    effect(() => {
      const s = this.solicitud();
      this.horaSalida.set(s.hor_salida ?? '');
      this.horaRetorno.set(s.hor_retorno ?? '');
      this.horaInvalida.set(false);
      this.mensajeError.set('');
    });
  }

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
    this.cerrar.emit();
  }

  onRegistrarSalida(): void {
    if (!this.horaSalida().trim()) {
      alert('Debe ingresar la hora de salida.');
      return;
    }
    this.registrarSalida.emit({ id: this.solicitud().id, horaSalida: this.horaSalida() });
  }

  onRegistrarRetorno(): void {
    if (this.horaInvalida() || !this.horaRetorno().trim()) return;
    this.registrarRetorno.emit({ id: this.solicitud().id, horaRetorno: this.horaRetorno() });
  }

  validarHoraRetorno(): void {
    const salida = this.horaSalida() || this.solicitud().hor_salida;
    const retorno = this.horaRetorno();
    if (salida && retorno) {
      const [hS, mS] = salida.split(':').map(Number);
      const [hR, mR] = retorno.split(':').map(Number);
      if (hR * 60 + mR <= hS * 60 + mS) {
        this.horaInvalida.set(true);
        this.mensajeError.set('La hora de retorno debe ser posterior a la hora de salida.');
      } else {
        this.horaInvalida.set(false);
        this.mensajeError.set('');
      }
    }
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
