import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ReporteVacacionesEmpleado,
  VacacionesApiService,
} from '../../../core/services/vacaciones-api';

@Component({
  selector: 'app-reporte-vacaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-vacaciones.component.html',
  styleUrl: './reporte-vacaciones.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReporteVacacionesComponent implements OnInit {

  private readonly vacacionesApi =
    inject(VacacionesApiService);

  // =========================================================
  // DATOS
  // =========================================================

  readonly empleados =
    signal<ReporteVacacionesEmpleado[]>([]);

  readonly anio =
    signal(new Date().getFullYear());

  readonly totalEmpleados =
    signal(0);

  // =========================================================
  // ESTADO
  // =========================================================

  readonly cargando =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  readonly busqueda =
    signal('');

  readonly empleadosFiltrados =
    computed(() => {

      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      if (!texto) {
        return this.empleados();
      }

      return this.empleados().filter(
        (empleado) =>
          empleado.nombreCompleto
            ?.toLowerCase()
            .includes(texto) ||

          empleado.identidad
            ?.toLowerCase()
            .includes(texto),
      );
    });

  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {
    this.cargarReporte();
  }

  // =========================================================
  // CARGAR REPORTE
  // =========================================================

  cargarReporte(): void {

    this.cargando.set(true);

    this.errorMessage.set('');
    this.successMessage.set('');

    this.vacacionesApi
      .obtenerReporteVacaciones(this.anio())
      .subscribe({

        next: (respuesta) => {

          this.empleados.set(
            respuesta.empleados ?? [],
          );

          this.totalEmpleados.set(
            respuesta.totalEmpleados ?? 0,
          );

          this.cargando.set(false);
        },

        error: (error) => {

          console.error(
            'Error al consultar reporte de vacaciones:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo consultar el reporte de vacaciones.',
            ),
          );

          this.empleados.set([]);
          this.totalEmpleados.set(0);

          this.cargando.set(false);
        },
      });
  }

  // =========================================================
  // CAMBIAR AÑO
  // =========================================================

  cambiarAnio(
    event: Event,
  ): void {

    const valor =
      (event.target as HTMLInputElement).value;

    const nuevoAnio =
      Number(valor);

    if (
      !Number.isInteger(nuevoAnio) ||
      nuevoAnio < 2000 ||
      nuevoAnio > 2100
    ) {
      return;
    }

    this.anio.set(nuevoAnio);

    this.cargarReporte();
  }

  // =========================================================
  // BÚSQUEDA
  // =========================================================

  cambiarBusqueda(
    event: Event,
  ): void {

    const valor =
      (event.target as HTMLInputElement).value;

    this.busqueda.set(valor);
  }

  // =========================================================
  // FORMATEAR NÚMEROS
  // =========================================================

  formatearDias(
    dias: number | null | undefined,
  ): string {

    return String(
      Number(dias ?? 0),
    );
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
