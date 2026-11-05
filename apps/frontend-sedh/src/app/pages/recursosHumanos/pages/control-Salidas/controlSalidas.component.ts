
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
  imports: [CommonModule],
  templateUrl: './controlSalidas.component.html',
  styleUrls: ['./controlSalidas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlSalidasComponent implements OnInit {

  private readonly pendientesService = inject(PendientesService);

  readonly solicitudes = signal<SolicitudAgenteApi[]>([]);
  readonly cargando = signal(false);
  readonly errorMessage = signal('');

  // Modal de registro
  readonly solicitudFormulario = signal<string | null>(null);
  readonly tipoFormulario = signal<'salida' | 'retorno' | null>(null);
  readonly horaFormulario = signal('');

  readonly solicitudSeleccionada = computed(() =>
    this.solicitudes().find(
      (solicitud) =>
        solicitud.idpermiso === this.solicitudFormulario(),
    ) ?? null,
  );

  // Filtros
  readonly busqueda = signal('');
  readonly filtroFecha = signal('');
  readonly filtroEstado = signal('TODOS');

  // Resumen
  readonly pendientesSalida = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !solicitud.horaSalida &&
        !solicitud.horaRetorno &&
        solicitud.estadoRetorno !== 'NO_RETORNO',
    ).length,
  );

  readonly empleadosFuera = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !!solicitud.horaSalida &&
        !solicitud.horaRetorno &&
        solicitud.estadoRetorno !== 'NO_RETORNO',
    ).length,
  );

  readonly retornosRegistrados = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        !!solicitud.horaSalida &&
        !!solicitud.horaRetorno,
    ).length,
  );

  readonly empleadosNoRetornaron = computed(() =>
    this.solicitudes().filter(
      (solicitud) =>
        solicitud.estadoRetorno === 'NO_RETORNO',
    ).length,
  );

  // Registros filtrados
  readonly solicitudesFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const fecha = this.filtroFecha();
    const estado = this.filtroEstado();

    return this.solicitudes().filter((solicitud) => {
      const nombre = this.obtenerNombre(solicitud).toLowerCase();
      const dependencia = String(
        solicitud.dependencia ?? '',
      ).toLowerCase();

      const email = String(
        (solicitud as SolicitudAgenteApi & { email?: string }).email ?? '',
      ).toLowerCase();

      const coincideTexto =
        !texto ||
        nombre.includes(texto) ||
        dependencia.includes(texto) ||
        email.includes(texto);

      const fechaRegistro = String(
        solicitud.fecha ?? '',
      ).substring(0, 10);

      const coincideFecha =
        !fecha || fechaRegistro === fecha;

      const situacion = this.obtenerSituacion(solicitud);

      const coincideEstado =
        estado === 'TODOS' ||
        (estado === 'PENDIENTE_SALIDA' &&
          situacion === 'Pendiente de salida') ||
        (estado === 'FUERA' &&
          situacion === 'Empleado fuera') ||
        (estado === 'RETORNADO' &&
          situacion === 'Retorno registrado') ||
        (estado === 'NO_RETORNO' &&
          situacion === 'No retornó');

      return coincideTexto && coincideFecha && coincideEstado;
    });
  });

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    if (this.cargando()) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    this.pendientesService.getSolicitudesAgente().subscribe({
      next: (solicitudes) => {
        this.solicitudes.set(solicitudes);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);

        this.errorMessage.set(
          error?.error?.error?.message ??
          error?.error?.message ??
          'No fue posible cargar los permisos.',
        );

        this.cargando.set(false);
      },
    });
  }

  // =========================================
  // FILTROS
  // =========================================

  actualizarBusqueda(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  actualizarFiltroFecha(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.filtroFecha.set(input.value);
  }

  actualizarFiltroEstado(evento: Event): void {
    const select = evento.target as HTMLSelectElement;
    this.filtroEstado.set(select.value);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroFecha.set('');
    this.filtroEstado.set('TODOS');
  }

  // =========================================
  // MODAL DE SALIDA Y RETORNO
  // =========================================

  abrirFormularioSalida(solicitud: SolicitudAgenteApi): void {
    this.solicitudFormulario.set(solicitud.idpermiso);
    this.tipoFormulario.set('salida');
    this.horaFormulario.set(this.obtenerHoraActual());
    this.errorMessage.set('');
  }

  abrirFormularioRetorno(solicitud: SolicitudAgenteApi): void {
    this.solicitudFormulario.set(solicitud.idpermiso);
    this.tipoFormulario.set('retorno');
    this.horaFormulario.set(this.obtenerHoraActual());
    this.errorMessage.set('');
  }

  cancelarFormulario(): void {
    if (this.cargando()) {
      return;
    }

    this.solicitudFormulario.set(null);
    this.tipoFormulario.set(null);
    this.horaFormulario.set('');
    this.errorMessage.set('');
  }

  actualizarHora(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.horaFormulario.set(input.value);
  }

  // =========================================
  // GUARDAR SALIDA O RETORNO
  // =========================================

  guardarRegistro(solicitud: SolicitudAgenteApi): void {
    const tipo = this.tipoFormulario();
    const hora = this.horaFormulario();

    if (!tipo || this.cargando()) {
      return;
    }

    if (!hora) {
      this.errorMessage.set('Debe indicar una hora.');
      return;
    }

    if (!this.validarFormatoHora(hora)) {
      this.errorMessage.set(
        'La hora debe tener el formato HH:mm.',
      );
      return;
    }

    if (tipo === 'retorno' && solicitud.horaSalida) {
      const horaSalida = solicitud.horaSalida.substring(0, 5);

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
      this.pendientesService.registrarHoraSalida({
        idPermiso: solicitud.idpermiso,
        horaSalida: hora,
      }).subscribe({
        next: () => {
          this.finalizarRegistro();
        },
        error: (error) => {
          console.error('Error al registrar hora de salida:', error);

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

    this.pendientesService.registrarHoraRetorno({
      idPermiso: solicitud.idpermiso,
      horaRetorno: hora,
    }).subscribe({
      next: () => {
        this.finalizarRegistro();
      },
      error: (error) => {
        console.error('Error al registrar hora de retorno:', error);

        this.errorMessage.set(
          error?.error?.error?.message ??
          error?.error?.message ??
          'No fue posible registrar la hora de retorno.',
        );

        this.cargando.set(false);
      },
    });
  }

  private finalizarRegistro(): void {
    this.solicitudFormulario.set(null);
    this.tipoFormulario.set(null);
    this.horaFormulario.set('');
    this.errorMessage.set('');
    this.cargando.set(false);

    this.cargarSolicitudes();
  }

  // =========================================
  // NO RETORNO
  // =========================================

  marcarNoRetorno(solicitud: SolicitudAgenteApi): void {
    if (
      this.cargando() ||
      !solicitud.horaSalida ||
      solicitud.horaRetorno ||
      solicitud.estadoRetorno === 'NO_RETORNO'
    ) {
      return;
    }

    const confirmar = window.confirm(
      `¿Confirmas que el empleado ${this.obtenerNombre(solicitud)} no retornó?`,
    );

    if (!confirmar) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    this.pendientesService
      .marcarNoRetorno(solicitud.idpermiso)
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.cargarSolicitudes();
        },
        error: (error) => {
          console.error(
            'Error al marcar que el empleado no retornó:',
            error,
          );

          this.errorMessage.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'No fue posible marcar al empleado como no retornado.',
          );

          this.cargando.set(false);
        },
      });
  }

  // =========================================
  // UTILIDADES
  // =========================================

  obtenerHoraActual(): string {
    const ahora = new Date();

    return (
      `${String(ahora.getHours()).padStart(2, '0')}:` +
      `${String(ahora.getMinutes()).padStart(2, '0')}`
    );
  }

  validarFormatoHora(hora: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
  }

  convertirMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);

    return (horas * 60) + minutos;
  }

  obtenerNombre(solicitud: SolicitudAgenteApi): string {
    return [
      solicitud.empleado.nombre,
      solicitud.empleado.segundoNombre,
      solicitud.empleado.apellido,
      solicitud.empleado.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  obtenerSituacion(solicitud: SolicitudAgenteApi): string {
    if (solicitud.estadoRetorno === 'NO_RETORNO') {
      return 'No retornó';
    }

    if (
      solicitud.horaSalida &&
      (solicitud.horaRetorno ||
        solicitud.estadoRetorno === 'RETORNADO')
    ) {
      return 'Retorno registrado';
    }

    if (solicitud.horaSalida) {
      return 'Empleado fuera';
    }

    return 'Pendiente de salida';
  }

  formatearHora(hora: string | null): string {
    return hora ? hora.substring(0, 5) : 'Sin registrar';
  }
}
