import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {
  AjusteSaldoVacaciones,
  CargaInicialSaldo,
  DescuentoMasivoVacaciones,
  HistorialVacaciones,
  ReporteVacacionesEmpleado,
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
    DatePipe,
  ],
  templateUrl: './solicitar-vacaciones.html',
  styleUrl: './solicitar-vacaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarVacacionesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly authService = inject(AuthService);

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
  // GESTIÓN / REPORTE DE VACACIONES
  // =========================================================

  readonly rolActual = computed(() => {
  const roles =
    this.authService.currentUser()?.roles ?? [];

  // 5 = Administrador
  const tieneAdministrador = roles.some(
    (acceso) => Number(acceso.r) === 5,
  );

  if (tieneAdministrador) {
    return 5;
  }

  // 3 = Subgerente RRHH
  const tieneSubgerente = roles.some(
    (acceso) => Number(acceso.r) === 3,
  );

  if (tieneSubgerente) {
    return 3;
  }

  // 6 = Verificador Vacaciones
  const tieneVerificador = roles.some(
    (acceso) => Number(acceso.r) === 6,
  );

  if (tieneVerificador) {
    return 6;
  }

  // 2 = Jefe
  const tieneJefe = roles.some(
    (acceso) => Number(acceso.r) === 2,
  );

  if (tieneJefe) {
    return 2;
  }

  // 1 = Empleado
  const tieneEmpleado = roles.some(
    (acceso) => Number(acceso.r) === 1,
  );

  if (tieneEmpleado) {
    return 1;
  }

  return 0;
});

readonly puedeVerReporte = computed(() => {
  const rol = this.rolActual();

  return (
    rol === 1 ||
    rol === 2 ||
    rol === 3 ||
    rol === 5 ||
    rol === 6
  );
});

readonly puedeAdministrarSaldos = computed(() => {
  const rol = this.rolActual();

  return rol === 3 || rol === 5;
});
  readonly empleados =
    signal<ReporteVacacionesEmpleado[]>([]);

  readonly anio =
    signal(new Date().getFullYear());

  readonly totalEmpleados =
    signal(0);

  readonly cargando =
    signal(false);

  readonly procesando =
    signal(false);

  readonly busqueda =
    signal('');

  readonly empleadosSeleccionados =
    signal<string[]>([]);

  readonly todosSeleccionados =
    computed(() => {
      const visibles =
        this.empleadosFiltrados();

      const seleccionados =
        new Set(this.empleadosSeleccionados());

      return (
        visibles.length > 0 &&
        visibles.every(
          (empleado) =>
            seleccionados.has(
              empleado.idUsuario,
            ),
        )
      );
    });

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
            .includes(texto) ||
          empleado.tipoContratacion
            ?.toLowerCase()
            .includes(texto),
      );
    });

  readonly cargaInicial =
    signal<CargaInicialSaldo>({
      idUsuario: '',
      anio: new Date().getFullYear(),
      diasAsignados: 0,
      diasUtilizados: 0,
      diasReservados: 0,
      observacion: '',
    });

  readonly ajusteIndividual =
    signal<AjusteSaldoVacaciones>({
      idUsuario: '',
      tipo: 'DESCONTAR',
      dias: 0,
      justificacion: '',
    });

  readonly descuentoMasivo =
    signal<DescuentoMasivoVacaciones>({
      idUsuarios: [],
      dias: 0,
      justificacion: '',
    });

  readonly historial =
    signal<HistorialVacaciones[]>([]);

  readonly empleadoHistorial =
    signal<ReporteVacacionesEmpleado | null>(null);

  readonly mostrandoHistorial =
    signal(false);

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

    if (this.puedeVerReporte()) {
      this.cargarReporte();
    }
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
    if (!this.tieneAnticipacionMinima(fechaInicio)) {
  this.errorMessage.set(
    'Las vacaciones deben solicitarse con un mínimo de 5 días hábiles de anticipación.',
  );

  this.diasSolicitados.set(0);
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
    const fechaInicio =
  this.formulario.controls.fechaInicio.value;

if (!this.tieneAnticipacionMinima(fechaInicio)) {
  this.errorMessage.set(
    'Las vacaciones deben solicitarse con un mínimo de 5 días hábiles de anticipación.',
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
// VALIDAR ANTICIPACIÓN DE 5 DÍAS HÁBILES
// =========================================================

tieneAnticipacionMinima(fechaInicio: string): boolean {
  if (!fechaInicio) {
    return false;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaInicioVacaciones = new Date(`${fechaInicio}T00:00:00`);

  let diasHabiles = 0;
  const fechaAuxiliar = new Date(hoy);

  while (fechaAuxiliar < fechaInicioVacaciones) {
    fechaAuxiliar.setDate(fechaAuxiliar.getDate() + 1);

    const diaSemana = fechaAuxiliar.getDay();

    // 0 = domingo
    // 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasHabiles++;
    }
  }

  return diasHabiles >= 5;
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
  // REPORTE DE EMPLEADOS
  // =========================================================

  cargarReporte(): void {
    if (!this.puedeVerReporte()) {
      return;
    }

    this.cargando.set(true);
    this.errorMessage.set('');

    this.vacacionesApi
      .obtenerReporteVacaciones(this.anio())
      .subscribe({
        next: (respuesta) => {
          const empleados =
            respuesta.empleados ?? [];

          this.empleados.set(empleados);
          this.totalEmpleados.set(
            respuesta.totalEmpleados ?? empleados.length,
          );

          const ids =
            new Set(
              empleados.map(
                (empleado) =>
                  empleado.idUsuario,
              ),
            );

          const seleccion =
            this.empleadosSeleccionados()
              .filter((id) => ids.has(id));

          this.empleadosSeleccionados.set(
            seleccion,
          );

          this.descuentoMasivo.update(
            (actual) => ({
              ...actual,
              idUsuarios: seleccion,
            }),
          );

          this.cargando.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al consultar reporte:',
            error,
          );

          this.empleados.set([]);
          this.totalEmpleados.set(0);
          this.empleadosSeleccionados.set([]);

          this.descuentoMasivo.update(
            (actual) => ({
              ...actual,
              idUsuarios: [],
            }),
          );

          this.cargando.set(false);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo consultar el reporte de vacaciones.',
            ),
          );
        },
      });
  }

  cambiarAnio(event: Event): void {
    const nuevoAnio = Number(
      (event.target as HTMLInputElement).value,
    );

    if (
      !Number.isInteger(nuevoAnio) ||
      nuevoAnio < 2000 ||
      nuevoAnio > 2100
    ) {
      return;
    }

    this.anio.set(nuevoAnio);

    this.cargaInicial.update(
      (actual) => ({
        ...actual,
        anio: nuevoAnio,
      }),
    );

    this.cargarReporte();
  }

  cambiarBusqueda(event: Event): void {
    this.busqueda.set(
      (event.target as HTMLInputElement).value,
    );
  }

  obtenerNombreEmpleado(idUsuario: string): string {
    const empleado =
      this.empleados().find(
        (item) =>
          item.idUsuario === idUsuario,
      );

    return empleado
      ? `${empleado.nombreCompleto} — ${empleado.identidad}`
      : '';
  }

  alternarSeleccionEmpleado(idUsuario: string): void {
    if (!this.puedeAdministrarSaldos()) {
      return;
    }

    const actuales =
      this.empleadosSeleccionados();

    const nuevos =
      actuales.includes(idUsuario)
        ? actuales.filter(
            (id) => id !== idUsuario,
          )
        : [...actuales, idUsuario];

    this.empleadosSeleccionados.set(nuevos);

    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: nuevos,
      }),
    );
  }

  seleccionarTodosEmpleados(): void {
    if (!this.puedeAdministrarSaldos()) {
      return;
    }

    const ids =
      this.empleadosFiltrados()
        .map(
          (empleado) =>
            empleado.idUsuario,
        );

    this.empleadosSeleccionados.set(ids);

    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: ids,
      }),
    );
  }

  deseleccionarTodosEmpleados(): void {
    if (!this.puedeAdministrarSaldos()) {
      return;
    }

    const visibles =
      new Set(
        this.empleadosFiltrados()
          .map(
            (empleado) =>
              empleado.idUsuario,
          ),
      );

    const restantes =
      this.empleadosSeleccionados()
        .filter(
          (id) =>
            !visibles.has(id),
        );

    this.empleadosSeleccionados.set(restantes);

    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: restantes,
      }),
    );
  }

  alternarSeleccionTodos(): void {
    if (this.todosSeleccionados()) {
      this.deseleccionarTodosEmpleados();
    } else {
      this.seleccionarTodosEmpleados();
    }
  }

  estaSeleccionado(idUsuario: string): boolean {
    return this.empleadosSeleccionados().includes(
      idUsuario,
    );
  }

  actualizarCargaInicial(
    cambios: Partial<CargaInicialSaldo>,
  ): void {
    this.cargaInicial.update(
      (actual) => ({
        ...actual,
        ...cambios,
      }),
    );
  }

  actualizarAjusteIndividual(
    cambios: Partial<AjusteSaldoVacaciones>,
  ): void {
    this.ajusteIndividual.update(
      (actual) => ({
        ...actual,
        ...cambios,
      }),
    );
  }

  actualizarDescuentoMasivo(
    cambios: Partial<DescuentoMasivoVacaciones>,
  ): void {
    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        ...cambios,
      }),
    );
  }

  limpiarCargaInicial(): void {
    this.cargaInicial.set({
      idUsuario: '',
      anio: this.anio(),
      diasAsignados: 0,
      diasUtilizados: 0,
      diasReservados: 0,
      observacion: '',
    });
  }

  limpiarAjusteIndividual(): void {
    this.ajusteIndividual.set({
      idUsuario: '',
      tipo: 'DESCONTAR',
      dias: 0,
      justificacion: '',
    });
  }

  limpiarDescuentoMasivo(): void {
    this.empleadosSeleccionados.set([]);

    this.descuentoMasivo.set({
      idUsuarios: [],
      dias: 0,
      justificacion: '',
    });
  }

  cargarSaldoInicialEmpleado(): void {
    if (!this.puedeAdministrarSaldos()) {
      return this.mostrarError(
        'No tiene permisos para administrar saldos de vacaciones.',
      );
    }

    const datos =
      this.cargaInicial();

    if (!datos.idUsuario) {
      return this.mostrarError(
        'Debe seleccionar un empleado.',
      );
    }

    if (
      !Number.isInteger(datos.anio) ||
      datos.anio < 2000 ||
      datos.anio > 2100
    ) {
      return this.mostrarError(
        'El año de la carga inicial no es válido.',
      );
    }

    if (
      !Number.isInteger(datos.diasAsignados) ||
      datos.diasAsignados < 0 ||
      datos.diasAsignados > 365
    ) {
      return this.mostrarError(
        'La cantidad de días asignados no es válida.',
      );
    }

    if (
      !Number.isInteger(datos.diasUtilizados) ||
      datos.diasUtilizados < 0 ||
      datos.diasUtilizados >
        datos.diasAsignados
    ) {
      return this.mostrarError(
        'Los días utilizados no pueden superar los días asignados.',
      );
    }

    if (
      !Number.isInteger(datos.diasReservados) ||
      datos.diasReservados < 0 ||
      datos.diasReservados >
        datos.diasAsignados -
          datos.diasUtilizados
    ) {
      return this.mostrarError(
        'Los días reservados no pueden superar el saldo disponible.',
      );
    }

    if (!datos.observacion.trim()) {
      return this.mostrarError(
        'La justificación de la carga inicial es obligatoria.',
      );
    }

    this.procesando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.vacacionesApi
      .cargarSaldoInicial({
        ...datos,
        observacion:
          datos.observacion.trim(),
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);

          this.successMessage.set(
            `Saldo inicial de ${this.obtenerNombreEmpleado(
              datos.idUsuario,
            )} registrado correctamente.`,
          );

          this.limpiarCargaInicial();
          this.cargarReporte();
          this.cargarSaldo();
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar saldo inicial:',
            error,
          );

          this.procesando.set(false);

          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo registrar el saldo inicial.',
            ),
          );
        },
      });
  }

  ejecutarAjusteIndividual(): void {
    if (!this.puedeAdministrarSaldos()) {
      return this.mostrarError(
        'No tiene permisos para administrar saldos de vacaciones.',
      );
    }

    const datos =
      this.ajusteIndividual();

    if (!datos.idUsuario) {
      return this.mostrarError(
        'Debe seleccionar un empleado.',
      );
    }

    if (
      !Number.isInteger(datos.dias) ||
      datos.dias <= 0 ||
      datos.dias > 365
    ) {
      return this.mostrarError(
        'La cantidad de días debe ser mayor que cero y menor o igual a 365.',
      );
    }

    if (!datos.justificacion.trim()) {
      return this.mostrarError(
        'La justificación es obligatoria.',
      );
    }

    this.procesando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.vacacionesApi
      .ajustarSaldo({
        ...datos,
        justificacion:
          datos.justificacion.trim(),
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);

          this.successMessage.set(
            datos.tipo === 'DESCONTAR'
              ? `Descuento aplicado a ${this.obtenerNombreEmpleado(
                  datos.idUsuario,
                )}.`
              : `Días agregados a ${this.obtenerNombreEmpleado(
                  datos.idUsuario,
                )}.`,
          );

          this.limpiarAjusteIndividual();
          this.cargarReporte();
          this.cargarSaldo();
        },

        error: (error: unknown) => {
          console.error(
            'Error al ajustar saldo:',
            error,
          );

          this.procesando.set(false);

          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo actualizar el saldo.',
            ),
          );
        },
      });
  }

  ejecutarDescuentoMasivo(): void {
    if (!this.puedeAdministrarSaldos()) {
      return this.mostrarError(
        'No tiene permisos para administrar saldos de vacaciones.',
      );
    }

    let seleccionados =
      this.empleadosSeleccionados();

    if (seleccionados.length === 0) {
      this.seleccionarTodosEmpleados();
      seleccionados =
        this.empleadosSeleccionados();
    }

    const datos =
      this.descuentoMasivo();

    if (seleccionados.length === 0) {
      return this.mostrarError(
        'No existen empleados disponibles para el descuento masivo.',
      );
    }

    if (
      !Number.isInteger(datos.dias) ||
      datos.dias <= 0 ||
      datos.dias > 365
    ) {
      return this.mostrarError(
        'La cantidad de días debe ser mayor que cero y menor o igual a 365.',
      );
    }

    if (!datos.justificacion.trim()) {
      return this.mostrarError(
        'La justificación es obligatoria.',
      );
    }

    if (
      !window.confirm(
        `Se aplicará un descuento de ${datos.dias} día(s) a ${seleccionados.length} empleado(s). ¿Desea continuar?`,
      )
    ) {
      return;
    }

    this.procesando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.vacacionesApi
      .aplicarDescuentoMasivo({
        idUsuarios: seleccionados,
        dias: datos.dias,
        justificacion:
          datos.justificacion.trim(),
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);

          this.successMessage.set(
            `Descuento masivo aplicado a ${seleccionados.length} empleado(s).`,
          );

          this.limpiarDescuentoMasivo();
          this.cargarReporte();
          this.cargarSaldo();
        },

        error: (error: unknown) => {
          console.error(
            'Error en descuento masivo:',
            error,
          );

          this.procesando.set(false);

          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo aplicar el descuento masivo.',
            ),
          );
        },
      });
  }

  verHistorial(
    empleado: ReporteVacacionesEmpleado,
  ): void {
    if (!this.puedeAdministrarSaldos()) {
      return;
    }

    this.procesando.set(true);
    this.errorMessage.set('');

    this.vacacionesApi
      .obtenerHistorialVacaciones(
        empleado.idUsuario,
      )
      .subscribe({
        next: (
          historial: HistorialVacaciones[],
        ) => {
          this.historial.set(
            historial ?? [],
          );

          this.empleadoHistorial.set(
            empleado,
          );

          this.mostrandoHistorial.set(
            true,
          );

          this.procesando.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al consultar historial:',
            error,
          );

          this.procesando.set(false);

          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo consultar el historial.',
            ),
          );
        },
      });
  }

  cerrarHistorial(): void {
    this.mostrandoHistorial.set(false);
    this.historial.set([]);
    this.empleadoHistorial.set(null);
  }

  convertirNumero(valor: string): number {
    const numero = Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }

  formatearDias(
    dias: number | null | undefined,
  ): string {
    return String(Number(dias ?? 0));
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
  // MOSTRAR ERROR
  // =========================================================

  private mostrarError(mensaje: string): void {
    this.errorMessage.set(mensaje);
    this.successMessage.set('');
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
