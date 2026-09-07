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
  PendientesService,
  SolicitudAgenteApi,
} from '../../../pendientes/pendientes.service';

@Component({
  selector: 'app-control-salidas',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './controlSalidas.component.html',
  styleUrls: ['./controlSalidas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlSalidasComponent implements OnInit {

  private readonly pendientesService =
    inject(PendientesService);

  readonly solicitudes =
    signal<SolicitudAgenteApi[]>([]);

  readonly cargando =
    signal(false);

  readonly errorMessage =
    signal('');

  /**
   * ID del permiso que actualmente tiene
   * abierto el formulario.
   */
  readonly solicitudFormulario =
    signal<string | null>(null);

  /**
   * Tipo de registro que se está realizando.
   */
  readonly tipoFormulario =
    signal<'salida' | 'retorno' | null>(null);

  /**
   * Hora que se mostrará en el formulario.
   */
  readonly horaFormulario =
    signal('');

  readonly pendientesSalida = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !solicitud.horaSalida &&
        !solicitud.horaRetorno,
    ).length,
  );

  readonly empleadosFuera = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !!solicitud.horaSalida &&
        !solicitud.horaRetorno,
    ).length,
  );

  readonly retornosRegistrados = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !!solicitud.horaSalida &&
        !!solicitud.horaRetorno,
    ).length,
  );

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    this.pendientesService
      .getSolicitudesAgente()
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(
            solicitudes,
          );

          this.cargando.set(false);
        },

        error: (error) => {
          console.error(
            'Error al cargar permisos:',
            error,
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'No fue posible cargar los permisos.',
          );

          this.cargando.set(false);
        },
      });
  }

  abrirFormularioSalida(
    solicitud: SolicitudAgenteApi,
  ): void {
    this.solicitudFormulario.set(
      solicitud.idpermiso,
    );

    this.tipoFormulario.set('salida');

    this.horaFormulario.set(
      this.obtenerHoraActual(),
    );

    this.errorMessage.set('');
  }

  abrirFormularioRetorno(
    solicitud: SolicitudAgenteApi,
  ): void {
    this.solicitudFormulario.set(
      solicitud.idpermiso,
    );

    this.tipoFormulario.set('retorno');

    this.horaFormulario.set(
      this.obtenerHoraActual(),
    );

    this.errorMessage.set('');
  }

  cancelarFormulario(): void {
    this.solicitudFormulario.set(null);
    this.tipoFormulario.set(null);
    this.horaFormulario.set('');
  }

  actualizarHora(
    evento: Event,
  ): void {
    const input =
      evento.target as HTMLInputElement;

    this.horaFormulario.set(
      input.value,
    );
  }

  guardarRegistro(
    solicitud: SolicitudAgenteApi,
  ): void {
    const tipo =
      this.tipoFormulario();

    const hora =
      this.horaFormulario();

    if (!tipo) {
      return;
    }

    if (!hora) {
      this.errorMessage.set(
        'Debe indicar una hora.',
      );

      return;
    }

    if (!this.validarFormatoHora(hora)) {
      this.errorMessage.set(
        'La hora debe tener el formato HH:mm.',
      );

      return;
    }

    if (
      tipo === 'retorno' &&
      solicitud.horaSalida
    ) {
      const horaSalida =
        solicitud.horaSalida.substring(0, 5);

      if (
        this.convertirMinutos(hora) <=
        this.convertirMinutos(horaSalida)
      ) {
        this.errorMessage.set(
          'La hora de retorno debe ser posterior a la hora de salida.',
        );

        return;
      }
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    if (tipo === 'salida') {
      this.pendientesService
        .registrarHoraSalida({
          idPermiso: solicitud.idpermiso,
          horaSalida: hora,
        })
        .subscribe({
          next: () => {
            this.solicitudFormulario.set(null);
            this.tipoFormulario.set(null);
            this.horaFormulario.set('');
            this.cargando.set(false);

            this.cargarSolicitudes();
          },

          error: (error) => {
            console.error(
              'Error al registrar hora de salida:',
              error,
            );

            this.errorMessage.set(
              error?.error?.error?.message ??
              error?.error?.message ??
              'No fue posible registrar la hora de salida.',
            );

            this.cargando.set(false);
          },
        });

      return;
    }

    this.pendientesService
      .registrarHoraRetorno({
        idPermiso: solicitud.idpermiso,
        horaRetorno: hora,
      })
      .subscribe({
        next: () => {
          this.solicitudFormulario.set(null);
          this.tipoFormulario.set(null);
          this.horaFormulario.set('');
          this.cargando.set(false);

          this.cargarSolicitudes();
        },

        error: (error) => {
          console.error(
            'Error al registrar hora de retorno:',
            error,
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'No fue posible registrar la hora de retorno.',
          );

          this.cargando.set(false);
        },
      });
  }

  obtenerHoraActual(): string {
    const ahora = new Date();

    return (
      `${String(ahora.getHours()).padStart(2, '0')}:` +
      `${String(ahora.getMinutes()).padStart(2, '0')}`
    );
  }

  validarFormatoHora(
    hora: string,
  ): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(
      hora,
    );
  }

  convertirMinutos(
    hora: string,
  ): number {
    const [horas, minutos] =
      hora.split(':').map(Number);

    return (
      (horas * 60) +
      minutos
    );
  }

  obtenerNombre(
    solicitud: SolicitudAgenteApi,
  ): string {
    return [
      solicitud.empleado.nombre,
      solicitud.empleado.segundoNombre,
      solicitud.empleado.apellido,
      solicitud.empleado.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  obtenerSituacion(
    solicitud: SolicitudAgenteApi,
  ): string {
    if (
      solicitud.horaSalida &&
      solicitud.horaRetorno
    ) {
      return 'Retorno registrado';
    }

    if (
      solicitud.horaSalida &&
      !solicitud.horaRetorno
    ) {
      return 'Empleado fuera';
    }

    return 'Pendiente de salida';
  }

  formatearHora(
    hora: string | null,
  ): string {
    return hora
      ? hora.substring(0, 5)
      : 'Sin registrar';
  }
}
