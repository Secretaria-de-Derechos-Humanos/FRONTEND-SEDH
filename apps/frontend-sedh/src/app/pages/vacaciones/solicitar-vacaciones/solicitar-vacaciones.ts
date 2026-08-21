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
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import {
  SaldoVacaciones,
  SolicitudVacaciones,
  VacacionesApiService,
} from '../../../core/services/vacaciones-api';

@Component({
  selector: 'app-solicitar-vacaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './solicitar-vacaciones.html',
  styleUrl: './solicitar-vacaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarVacacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly vacacionesApi =
    inject(VacacionesApiService);

  // =========================================================
  // DATOS
  // =========================================================

  readonly solicitudes =
    signal<SolicitudVacaciones[]>([]);

  readonly cargandoSolicitudes =
    signal(false);

  readonly saldo =
    signal<SaldoVacaciones | null>(null);

  readonly diasSolicitados =
    signal(0);

  // =========================================================
  // ESTADOS
  // =========================================================

  readonly cargandoSaldo =
    signal(false);

  readonly calculandoDias =
    signal(false);

  readonly guardando =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  // =========================================================
  // FECHA MÍNIMA
  // =========================================================

  readonly fechaMinima =
    new Date()
      .toISOString()
      .slice(0, 10);

  // =========================================================
  // FORMULARIO
  // =========================================================

  readonly formulario =
    this.fb.nonNullable.group({
      fechaInicio: [
        '',
        Validators.required,
      ],

      fechaFin: [
        '',
        Validators.required,
      ],

      observaciones: [
        '',
        Validators.maxLength(200),
      ],
    });

  // =========================================================
  // VALIDAR SALDO
  // =========================================================

  readonly saldoSuficiente =
    computed(() => {
      const saldoActual =
        this.saldo();

      if (!saldoActual) {
        return false;
      }

      return (
        this.diasSolicitados() > 0 &&
        this.diasSolicitados() <=
          saldoActual.diasDisponibles
      );
    });

  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {
    this.cargarSaldo();
    this.cargarSolicitudes();
  }

  // =========================================================
  // CARGAR SALDO
  // =========================================================

  cargarSaldo(): void {
    this.cargandoSaldo.set(true);
    this.errorMessage.set('');

    this.vacacionesApi
      .obtenerMiSaldo()
      .subscribe({
        next: (saldo) => {
          this.saldo.set(saldo);
          this.cargandoSaldo.set(false);
        },

        error: (error) => {
          console.error(
            'Error al consultar saldo:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo consultar el saldo de vacaciones.',
            ),
          );

          this.cargandoSaldo.set(false);
        },
      });
  }

  // =========================================================
  // ACTUALIZAR FECHAS
  // =========================================================

  actualizarFechas(): void {
    this.diasSolicitados.set(0);

    this.errorMessage.set('');
    this.successMessage.set('');

    const fechaInicio =
      this.formulario.controls
        .fechaInicio.value;

    const fechaFin =
      this.formulario.controls
        .fechaFin.value;

    if (!fechaInicio || !fechaFin) {
      return;
    }

    if (fechaFin < fechaInicio) {
      this.errorMessage.set(
        'La fecha final no puede ser menor que la inicial.',
      );

      return;
    }

    this.calcularDias(
      fechaInicio,
      fechaFin,
    );
  }

  // =========================================================
  // CALCULAR DÍAS
  // =========================================================

  calcularDias(
    fechaInicio: string,
    fechaFin: string,
  ): void {
    this.calculandoDias.set(true);

    this.vacacionesApi
      .calcularDias(
        fechaInicio,
        fechaFin,
      )
      .subscribe({
        next: (dias) => {
          this.diasSolicitados.set(dias);

          this.calculandoDias.set(false);

          const saldoActual =
            this.saldo();

          if (
            saldoActual &&
            dias >
              saldoActual.diasDisponibles
          ) {
            this.errorMessage.set(
              `Está solicitando ${dias} días, pero solamente tiene ` +
              `${saldoActual.diasDisponibles} disponibles.`,
            );
          }
        },

        error: (error) => {
          console.error(
            'Error al calcular días:',
            error,
          );

          this.diasSolicitados.set(0);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron calcular los días solicitados.',
            ),
          );

          this.calculandoDias.set(false);
        },
      });
  }

  // =========================================================
  // GUARDAR SOLICITUD
  // =========================================================

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.errorMessage.set(
        'Complete correctamente los campos obligatorios.',
      );

      return;
    }

    if (!this.saldoSuficiente()) {
      this.errorMessage.set(
        'No tiene suficientes días disponibles.',
      );

      return;
    }

    this.guardando.set(true);

    this.errorMessage.set('');
    this.successMessage.set('');

    const valores =
      this.formulario.getRawValue();

    this.vacacionesApi
      .crearSolicitud({
        fechaInicio:
          valores.fechaInicio,

        fechaFin:
          valores.fechaFin,

        observaciones:
          valores.observaciones.trim() ||
          undefined,
      })
      .subscribe({
        next: (respuesta) => {
          this.guardando.set(false);

          this.successMessage.set(
            respuesta.message ||
              'Solicitud enviada correctamente.',
          );

          this.formulario.reset({
            fechaInicio: '',
            fechaFin: '',
            observaciones: '',
          });

          this.diasSolicitados.set(0);

          this.cargarSaldo();
          this.cargarSolicitudes();
        },

        error: (error) => {
          console.error(
            'Error al guardar solicitud:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo guardar la solicitud.',
            ),
          );

          this.guardando.set(false);
        },
      });
  }

  // =========================================================
  // CARGAR MIS SOLICITUDES
  // =========================================================

  cargarSolicitudes(): void {
    this.cargandoSolicitudes.set(true);

    this.vacacionesApi
      .obtenerMisSolicitudes()
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(
            solicitudes,
          );

          this.cargandoSolicitudes.set(false);
        },

        error: (error) => {
          console.error(
            'Error al consultar solicitudes:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron consultar las solicitudes.',
            ),
          );

          this.cargandoSolicitudes.set(false);
        },
      });
  }

  // =========================================================
  // CANCELAR
  // =========================================================

  cancelar(): void {
    if (this.guardando()) {
      return;
    }

    this.router.navigate([
      '/rrhh',
    ]);
  }

  // =========================================================
  // ESTADO
  // =========================================================

  obtenerEstado(
    solicitud: SolicitudVacaciones,
  ): string {
    return (
      solicitud.estadoSolicitud?.nomEstado ??
      solicitud.estadoSolicitud?.nomestado ??
      'EN PROCESO'
    );
  }

  // =========================================================
  // FORMATEAR FECHA
  // =========================================================

  formatearFecha(
    fecha:
      | string
      | null
      | undefined,
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
  // CLASE ESTADO
  // =========================================================

  claseEstado(
    solicitud: SolicitudVacaciones,
  ): string {
    const estado =
      this.obtenerEstado(solicitud)
        .trim()
        .toUpperCase();

    if (estado.includes('APROB')) {
      return 'aprobada';
    }

    if (estado.includes('RECHAZ')) {
      return 'rechazada';
    }

    return 'proceso';
  }

  // =========================================================
  // MENSAJE DE ERROR
  // =========================================================

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string,
  ): string {
    return (
      error?.error?.error?.message ??
      error?.error?.message ??
      error?.message ??
      mensajePredeterminado
    );
  }
}
