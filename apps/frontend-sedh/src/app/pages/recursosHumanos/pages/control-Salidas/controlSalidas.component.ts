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
