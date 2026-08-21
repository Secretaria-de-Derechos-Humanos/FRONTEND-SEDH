import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  SolicitudVacaciones,
  VacacionesApiService,
} from '../../../core/services/vacaciones-api';

@Component({
  selector: 'app-pendientes-jefe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendientes-jefe.html',
  styleUrl: './pendientes-jefe.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendientesJefeComponent implements OnInit {
  private readonly vacacionesApi =
    inject(VacacionesApiService);

  readonly solicitudes =
    signal<SolicitudVacaciones[]>([]);

  readonly cargando =
    signal(false);

  readonly procesando =
    signal<string | null>(null);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  // =========================================================
  // MODAL
  // =========================================================

  readonly modalAbierto =
    signal(false);

  readonly tipoAccion =
    signal<'aprobar' | 'rechazar' | null>(null);

  readonly solicitudSeleccionada =
    signal<SolicitudVacaciones | null>(null);

  readonly observacionModal =
    signal('');

  readonly motivoModal =
    signal('');

  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // =========================================================
  // CARGAR SOLICITUDES
  // =========================================================

  cargarSolicitudes(): void {
    this.cargando.set(true);
    this.errorMessage.set('');

    this.vacacionesApi
      .obtenerPendientesJefe()
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(
            solicitudes
          );

          this.cargando.set(false);
        },

        error: (error) => {
          console.error(
            'Error al consultar pendientes del jefe:',
            error
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron consultar las solicitudes pendientes.'
            )
          );

          this.cargando.set(false);
        },
      });
  }

  // =========================================================
  // ABRIR MODAL APROBAR
  // =========================================================

  aprobar(
    solicitud: SolicitudVacaciones
  ): void {
    const id = this.obtenerId(
      solicitud
    );

    if (!id) {
      this.errorMessage.set(
        'La solicitud no tiene un identificador válido.'
      );

      return;
    }

    this.solicitudSeleccionada.set(
      solicitud
    );

    this.tipoAccion.set(
      'aprobar'
    );

    this.observacionModal.set('');
    this.motivoModal.set('');

    this.errorMessage.set('');

    this.modalAbierto.set(true);
  }

  // =========================================================
  // ABRIR MODAL RECHAZAR
  // =========================================================

  rechazar(
    solicitud: SolicitudVacaciones
  ): void {
    const id = this.obtenerId(
      solicitud
    );

    if (!id) {
      this.errorMessage.set(
        'La solicitud no tiene un identificador válido.'
      );

      return;
    }

    this.solicitudSeleccionada.set(
      solicitud
    );

    this.tipoAccion.set(
      'rechazar'
    );

    this.observacionModal.set('');
    this.motivoModal.set('');

    this.errorMessage.set('');

    this.modalAbierto.set(true);
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  cancelarModal(): void {
    this.limpiarModal();
  }

  // =========================================================
  // CONFIRMAR ACCIÓN
  // =========================================================

  confirmarAccion(): void {
    const solicitud =
      this.solicitudSeleccionada();

    if (!solicitud) {
      return;
    }

    const id =
      this.obtenerId(solicitud);

    if (!id) {
      this.errorMessage.set(
        'La solicitud no tiene un identificador válido.'
      );

      return;
    }

    const accion =
      this.tipoAccion();

    if (!accion) {
      return;
    }

    // -------------------------------------------------------
    // VALIDAR MOTIVO DE RECHAZO
    // -------------------------------------------------------

    if (
      accion === 'rechazar' &&
      !this.motivoModal().trim()
    ) {
      this.errorMessage.set(
        'Debe indicar el motivo del rechazo.'
      );

      return;
    }

    this.procesando.set(id);

    this.errorMessage.set('');
    this.successMessage.set('');

    this.modalAbierto.set(false);

    // =======================================================
    // APROBAR COMO JEFE
    // =======================================================

    if (accion === 'aprobar') {
      this.vacacionesApi
        .aprobarPorJefe(
          id,
          this.observacionModal().trim()
        )
        .subscribe({
          next: () => {
            this.procesando.set(null);

            this.successMessage.set(
              'Solicitud aprobada correctamente. La solicitud pasó a Subgerencia.'
            );

            this.limpiarModal();

            this.cargarSolicitudes();
          },

          error: (error) => {
            console.error(
              'Error al aprobar solicitud:',
              error
            );

            this.errorMessage.set(
              this.obtenerMensajeError(
                error,
                'No se pudo aprobar la solicitud.'
              )
            );

            this.procesando.set(null);
          },
        });

      return;
    }

    // =======================================================
    // RECHAZAR
    // =======================================================

    this.vacacionesApi
      .rechazarVacaciones(
        id,
        this.motivoModal().trim()
      )
      .subscribe({
        next: () => {
          this.procesando.set(null);

          this.successMessage.set(
            'Solicitud rechazada correctamente.'
          );

          this.limpiarModal();

          this.cargarSolicitudes();
        },

        error: (error) => {
          console.error(
            'Error al rechazar solicitud:',
            error
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo rechazar la solicitud.'
            )
          );

          this.procesando.set(null);
        },
      });
  }

  // =========================================================
  // LIMPIAR MODAL
  // =========================================================

  private limpiarModal(): void {
    this.modalAbierto.set(false);

    this.tipoAccion.set(null);

    this.solicitudSeleccionada.set(
      null
    );

    this.observacionModal.set('');

    this.motivoModal.set('');
  }

  // =========================================================
  // OBTENER ID
  // =========================================================

  obtenerId(
    solicitud: SolicitudVacaciones
  ): string | null {
    return (
      solicitud.idVacaciones ??
      solicitud.idVacacion ??
      null
    );
  }

  // =========================================================
  // NOMBRE EMPLEADO
  // =========================================================

  obtenerNombreEmpleado(
    solicitud: SolicitudVacaciones
  ): string {
    const nombre = [
      solicitud.primerNombre,
      solicitud.segundoNombre,
      solicitud.primerApellido,
      solicitud.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');

    return nombre || 'Empleado';
  }

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  formatearFecha(
    fecha: string | null | undefined
  ): string {
    if (!fecha) {
      return '-';
    }

    const soloFecha =
      fecha.slice(0, 10);

    const partes =
      soloFecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // =========================================================
  // MENSAJE DE ERROR
  // =========================================================

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string
  ): string {
    return (
      error?.error?.error?.message ??
      error?.error?.message ??
      error?.message ??
      mensajePredeterminado
    );
  }
}
