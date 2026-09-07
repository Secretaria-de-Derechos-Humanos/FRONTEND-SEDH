import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AprobacionPendiente,
  AprobacionesApiService,
} from '../../../core/services/aprobaciones-api.service';

@Component({
  selector: 'app-verificacion-vacaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificacion-vacaciones.component.html',
  styleUrl: './verificacion-vacaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificacionVacacionesComponent
  implements OnInit {

  private readonly aprobacionesApi =
    inject(AprobacionesApiService);

  readonly cargando = signal(false);

  readonly procesandoId =
    signal<string | null>(null);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly busqueda =
    signal('');

  readonly solicitudes =
    signal<AprobacionPendiente[]>([]);

  readonly solicitudesFiltradas =
    computed(() => {
      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      if (!texto) {
        return this.solicitudes();
      }

      return this.solicitudes().filter(
        (solicitud) => {
          const correo =
            solicitud.emailInstitucional
              ?.toLowerCase() ?? '';

          const motivo =
            solicitud.motivo
              ?.toLowerCase() ?? '';

          const observaciones =
            solicitud.observaciones
              ?.toLowerCase() ?? '';

          return (
            correo.includes(texto) ||
            motivo.includes(texto) ||
            observaciones.includes(texto)
          );
        },
      );
    });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.cargando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .listarVacacionesPendientesVerificacion()
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(
            solicitudes ?? [],
          );

          this.cargando.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar solicitudes de vacaciones:',
            error,
          );

          this.solicitudes.set([]);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron cargar las solicitudes pendientes de verificación.',
            ),
          );

          this.cargando.set(false);
        },
      });
  }

  verificarSaldo(
    solicitud: AprobacionPendiente,
  ): void {
    const idPermisoVaca =
      solicitud.idPermisoVaca ??
      solicitud.id;

    if (!idPermisoVaca) {
      this.errorMessage.set(
        'La solicitud no tiene un identificador válido.',
      );
      return;
    }

    const diasSolicitados =
      solicitud.cantVacaciones ?? 0;

    const diasDisponibles =
      solicitud.totDiasRestantes ?? 0;

    const confirmar =
      window.confirm(
        `Empleado: ${solicitud.emailInstitucional}\n` +
        `Días solicitados: ${diasSolicitados}\n` +
        `Días disponibles: ${diasDisponibles}\n\n` +
        '¿Desea verificar el saldo de esta solicitud?',
      );

    if (!confirmar) {
      return;
    }

    this.procesandoId.set(
      idPermisoVaca,
    );

    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .verificarSaldoVacaciones(
        idPermisoVaca,
        'Verificación de saldo de vacaciones.',
      )
      .subscribe({
        next: (respuesta: unknown) => {
          let mensaje =
            'La solicitud fue procesada correctamente.';

          if (
            typeof respuesta === 'object' &&
            respuesta !== null
          ) {
            const respuestaApi =
              respuesta as {
                message?: string;
                data?: {
                  message?: string;
                };
              };

            mensaje =
              respuestaApi.message ??
              respuestaApi.data?.message ??
              mensaje;
          }

          this.successMessage.set(
            mensaje,
          );

          this.procesandoId.set(null);

          this.cargarSolicitudes();
        },

        error: (error: unknown) => {
          console.error(
            'Error al verificar saldo:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo verificar el saldo de vacaciones.',
            ),
          );

          this.procesandoId.set(null);
        },
      });
  }

  limpiarMensajes(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private obtenerMensajeError(
    error: unknown,
    mensajeDefecto: string,
  ): string {
    if (
      typeof error === 'object' &&
      error !== null
    ) {
      const errorHttp =
        error as {
          error?: {
            error?: {
              message?: string;
            };
            message?: string;
          };
          message?: string;
        };

      return (
        errorHttp.error?.error?.message ??
        errorHttp.error?.message ??
        errorHttp.message ??
        mensajeDefecto
      );
    }

    return mensajeDefecto;
  }
}
