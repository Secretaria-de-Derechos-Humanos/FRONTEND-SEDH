import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Constancia,
  ConstanciasApiService,
} from '../../../core/services/constancias-api.service';

@Component({
  selector: 'app-gestion-constancias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
  ],
  templateUrl: './gestion-constancias.component.html',
  styleUrl: './gestion-constancias.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionConstanciasComponent
  implements OnInit
{
  private readonly constanciasApi =
    inject(ConstanciasApiService);

  // =========================================================
  // DATOS
  // =========================================================

  readonly solicitudes =
    signal<Constancia[]>([]);

  readonly cargando =
    signal(false);

  readonly procesando =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  // =========================================================
  // FILTROS
  // =========================================================

  readonly filtroEstado =
    signal<'TODAS' | 'EN PROCESO' | 'APROBADO' | 'RECHAZADO'>(
      'EN PROCESO',
    );

  readonly busqueda =
    signal('');

  // =========================================================
  // MODAL RECHAZO
  // =========================================================

  readonly mostrarModalRechazo =
    signal(false);

  readonly solicitudSeleccionada =
    signal<Constancia | null>(null);

  motivoRechazo = '';

  // =========================================================
  // ARCHIVO
  // =========================================================

  readonly archivoSeleccionado =
    signal<File | null>(null);

  readonly nombreArchivo =
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
    this.limpiarMensajes();

    const estado =
      this.filtroEstado();

    const peticion =
      estado === 'EN PROCESO'
        ? this.constanciasApi.obtenerPendientes()
        : this.constanciasApi.obtenerTodas();

    peticion.subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(
          solicitudes ?? [],
        );

        this.cargando.set(false);
      },

      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);

        this.errorMessage.set(
          this.obtenerMensajeError(
            error,
            'No fue posible cargar las solicitudes de constancia.',
          ),
        );
      },
    });
  }

  // =========================================================
  // FILTRAR
  // =========================================================

  readonly solicitudesFiltradas =
    () => {
      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      const estado =
        this.filtroEstado();

      return this.solicitudes().filter(
        (solicitud) => {
          const estadoSolicitud =
            this.obtenerNombreEstado(
              solicitud,
            ).toUpperCase();

          const coincideEstado =
            estado === 'TODAS' ||
            estadoSolicitud === estado;

          if (!texto) {
            return coincideEstado;
          }

          const coincideTexto =
            solicitud.emailInstitucional
              ?.toLowerCase()
              .includes(texto) ||
            solicitud.idConstancia
              ?.toLowerCase()
              .includes(texto);

          return (
            coincideEstado &&
            coincideTexto
          );
        },
      );
    };

  // =========================================================
  // CAMBIAR FILTRO
  // =========================================================

  cambiarFiltro(
    estado:
      | 'TODAS'
      | 'EN PROCESO'
      | 'APROBADO'
      | 'RECHAZADO',
  ): void {
    this.filtroEstado.set(estado);

    this.cargarSolicitudes();
  }

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  cambiarBusqueda(
    valor: string,
  ): void {
    this.busqueda.set(valor);
  }

  // =========================================================
  // RECHAZAR
  // =========================================================

  abrirModalRechazo(
    solicitud: Constancia,
  ): void {
    this.solicitudSeleccionada.set(
      solicitud,
    );

    this.motivoRechazo = '';

    this.mostrarModalRechazo.set(true);

    this.limpiarMensajes();
  }

  cerrarModalRechazo(): void {
    if (this.procesando()) {
      return;
    }

    this.mostrarModalRechazo.set(false);
    this.solicitudSeleccionada.set(null);
    this.motivoRechazo = '';
  }

  confirmarRechazo(): void {
    const solicitud =
      this.solicitudSeleccionada();

    const motivo =
      this.motivoRechazo.trim();

    if (!solicitud) {
      return;
    }

    if (motivo.length < 5) {
      this.errorMessage.set(
        'El motivo del rechazo debe tener al menos 5 caracteres.',
      );

      return;
    }

    if (motivo.length > 200) {
      this.errorMessage.set(
        'El motivo del rechazo no puede superar los 200 caracteres.',
      );

      return;
    }

    this.procesando.set(true);
    this.limpiarMensajes();

    this.constanciasApi
      .rechazarSolicitud(
        solicitud.idConstancia,
        motivo,
      )
      .subscribe({
        next: () => {
          this.procesando.set(false);

          this.mostrarModalRechazo.set(false);
          this.solicitudSeleccionada.set(null);
          this.motivoRechazo = '';

          this.successMessage.set(
            'La solicitud de constancia fue rechazada correctamente.',
          );

          this.cargarSolicitudes();
        },

        error: (error: HttpErrorResponse) => {
          this.procesando.set(false);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No fue posible rechazar la solicitud.',
            ),
          );
        },
      });
  }

  // =========================================================
  // SELECCIONAR ARCHIVO
  // =========================================================

  seleccionarArchivo(
    event: Event,
    solicitud: Constancia,
  ): void {
    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0];

    if (!archivo) {
      return;
    }

    this.limpiarMensajes();

    const nombre =
      archivo.name.toLowerCase();

    const esPdf =
      archivo.type === 'application/pdf' ||
      nombre.endsWith('.pdf');

    const esWord =
      archivo.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      nombre.endsWith('.docx');

    if (!esPdf && !esWord) {
      this.errorMessage.set(
        'El archivo debe estar en formato PDF o Word (.docx).',
      );

      input.value = '';

      return;
    }

    const maximo =
      10 * 1024 * 1024;

    if (archivo.size > maximo) {
      this.errorMessage.set(
        'El archivo no puede superar los 10 MB.',
      );

      input.value = '';

      return;
    }

    this.archivoSeleccionado.set(
      archivo,
    );

    this.nombreArchivo.set(
      archivo.name,
    );

    this.subirConstancia(
      solicitud,
      archivo,
    );

    input.value = '';
  }

  // =========================================================
  // SUBIR CONSTANCIA
  // =========================================================

  private subirConstancia(
    solicitud: Constancia,
    archivo: File,
  ): void {
    this.procesando.set(true);
    this.limpiarMensajes();

    this.constanciasApi
      .generarConstancia(
        solicitud.idConstancia,
        archivo,
      )
      .subscribe({
        next: () => {
          this.procesando.set(false);

          this.archivoSeleccionado.set(
            null,
          );

          this.nombreArchivo.set('');

          this.successMessage.set(
            'La constancia fue cargada y quedó disponible para el empleado.',
          );

          this.cargarSolicitudes();
        },

        error: (error: HttpErrorResponse) => {
          this.procesando.set(false);

          this.archivoSeleccionado.set(
            null,
          );

          this.nombreArchivo.set('');

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar la constancia.',
            ),
          );
        },
      });
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  obtenerNombreEstado(
    solicitud: Constancia,
  ): string {
    return (
      solicitud.estadoSolicitud?.nomEstado ??
      solicitud.estadoSolicitud?.nomestado ??
      'EN PROCESO'
    );
  }

  esEnProceso(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(
        solicitud,
      ).toUpperCase() === 'EN PROCESO'
    );
  }

  esAprobada(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(
        solicitud,
      ).toUpperCase() === 'APROBADO'
    );
  }

  esRechazada(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(
        solicitud,
      ).toUpperCase() === 'RECHAZADO'
    );
  }

  // =========================================================
  // FINALIDADES
  // =========================================================

  obtenerFinalidadesTexto(
    solicitud: Constancia,
  ): string {
    if (
      !solicitud.finalidades ||
      solicitud.finalidades.length === 0
    ) {
      return 'No especificada';
    }

    return solicitud.finalidades
      .map(
        (finalidad) =>
          finalidad.finalidad,
      )
      .join(', ');
  }

  // =========================================================
  // SALARIO
  // =========================================================

  obtenerNombreModalidadSalario(
    modalidad: string,
  ): string {
    if (
      modalidad ===
      'CON_DEDUCCIONES'
    ) {
      return 'Con deducciones';
    }

    if (
      modalidad ===
      'SIN_DEDUCCIONES'
    ) {
      return 'Sin deducciones';
    }

    return modalidad;
  }

  // =========================================================
  // MENSAJES
  // =========================================================

  limpiarMensajes(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajeDefecto: string,
  ): string {
    if (
      error.error?.message
    ) {
      if (
        Array.isArray(
          error.error.message,
        )
      ) {
        return error.error.message.join(
          ', ',
        );
      }

      return String(
        error.error.message,
      );
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    return mensajeDefecto;
  }
}
