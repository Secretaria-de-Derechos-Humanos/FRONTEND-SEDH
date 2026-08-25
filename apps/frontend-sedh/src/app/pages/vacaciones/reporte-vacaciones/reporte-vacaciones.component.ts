import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import * as XLSX from 'xlsx';

import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';

import {
  AjusteSaldoVacaciones,
  CargaInicialSaldo,
  DescuentoMasivoVacaciones,
  HistorialVacaciones,
  ReporteVacacionesEmpleado,
  VacacionesApiService,
} from '../../../core/services/vacaciones-api';


@Component({
  selector: 'app-reporte-vacaciones',

  standalone: true,

  imports: [
    CommonModule,
    DatePipe,
  ],

  templateUrl:
    './reporte-vacaciones.component.html',

  styleUrl:
    './reporte-vacaciones.component.css',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ReporteVacacionesComponent
  implements OnInit {

  private readonly vacacionesApi =
    inject(VacacionesApiService);


  // =========================================================
  // ESTADO PRINCIPAL
  // =========================================================

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

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');


  readonly busqueda =
    signal('');


  // =========================================================
  // FILTRO DE EMPLEADOS
  // =========================================================

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


  // =========================================================
  // SELECCIÓN
  // =========================================================

  readonly empleadosSeleccionados =
    signal<string[]>([]);


  readonly todosSeleccionados =
    computed(() => {

      const visibles =
        this.empleadosFiltrados();

      const seleccionados =
        new Set(
          this.empleadosSeleccionados(),
        );

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


  // =========================================================
  // CARGA INICIAL
  // =========================================================

  readonly cargaInicial =
    signal<CargaInicialSaldo>({
      idUsuario: '',
      anio: new Date().getFullYear(),
      diasAsignados: 0,
      diasUtilizados: 0,
      diasReservados: 0,
      observacion: '',
    });


  // =========================================================
  // AJUSTE INDIVIDUAL
  // =========================================================

  readonly ajusteIndividual =
    signal<AjusteSaldoVacaciones>({
      idUsuario: '',
      tipo: 'DESCONTAR',
      dias: 0,
      justificacion: '',
    });


  // =========================================================
  // DESCUENTO MASIVO
  // =========================================================

  readonly descuentoMasivo =
    signal<DescuentoMasivoVacaciones>({
      idUsuarios: [],
      dias: 0,
      justificacion: '',
    });


  // =========================================================
  // HISTORIAL
  // =========================================================

  readonly historial =
    signal<HistorialVacaciones[]>([]);

  readonly empleadoHistorial =
    signal<ReporteVacacionesEmpleado | null>(
      null,
    );

  readonly mostrandoHistorial =
    signal(false);


  // =========================================================
  // EMPLEADOS DISPONIBLES PARA CARGA
  // =========================================================

  readonly empleadosDisponiblesCarga =
    computed(() => {

      const carga =
        this.cargaInicial().idUsuario;

      const ajuste =
        this.ajusteIndividual().idUsuario;

      return this.empleados().filter(
        (empleado) =>
          empleado.idUsuario === carga ||
          empleado.idUsuario !== ajuste,
      );
    });


  // =========================================================
  // EMPLEADOS DISPONIBLES PARA AJUSTE
  // =========================================================

  readonly empleadosDisponiblesAjuste =
    computed(() => {

      const carga =
        this.cargaInicial().idUsuario;

      const ajuste =
        this.ajusteIndividual().idUsuario;

      return this.empleados().filter(
        (empleado) =>
          empleado.idUsuario === ajuste ||
          empleado.idUsuario !== carga,
      );
    });


  // =========================================================
  // INIT
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
      .obtenerReporteVacaciones(
        this.anio(),
      )
      .subscribe({

        next: (respuesta) => {

          const empleados =
            respuesta.empleados ?? [];

          this.empleados.set(
            empleados,
          );

          this.totalEmpleados.set(
            respuesta.totalEmpleados ?? 0,
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
              .filter(
                (id) =>
                  ids.has(id),
              );


          this.empleadosSeleccionados.set(
            seleccion,
          );


          this.descuentoMasivo.update(
            (actual) => ({
              ...actual,
              idUsuarios:
                seleccion,
            }),
          );


          this.cargando.set(false);
        },


        error: (error: unknown) => {

          console.error(
            'Error al consultar reporte:',
            error,
          );

          this.mostrarError(
            this.obtenerMensajeError(
              error,
              'No se pudo consultar el reporte de vacaciones.',
            ),
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
        },
      });
  }


  // =========================================================
  // CAMBIAR AÑO
  // =========================================================

  cambiarAnio(
    event: Event,
  ): void {

    const nuevoAnio =
      Number(
        (event.target as HTMLInputElement)
          .value,
      );


    if (
      !Number.isInteger(nuevoAnio) ||
      nuevoAnio < 2000 ||
      nuevoAnio > 2100
    ) {
      return;
    }


    this.anio.set(
      nuevoAnio,
    );


    this.cargaInicial.update(
      (actual) => ({
        ...actual,
        anio: nuevoAnio,
      }),
    );


    this.cargarReporte();
  }


  // =========================================================
  // BUSCAR
  // =========================================================

  cambiarBusqueda(
    event: Event,
  ): void {

    this.busqueda.set(
      (event.target as HTMLInputElement)
        .value,
    );
  }


  // =========================================================
  // SELECCIONAR EMPLEADO
  // =========================================================

  alternarSeleccionEmpleado(
    idUsuario: string,
  ): void {

    const actuales =
      this.empleadosSeleccionados();


    const nuevos =
      actuales.includes(idUsuario)

        ? actuales.filter(
            (id) =>
              id !== idUsuario,
          )

        : [
            ...actuales,
            idUsuario,
          ];


    this.empleadosSeleccionados.set(
      nuevos,
    );


    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: nuevos,
      }),
    );
  }


  // =========================================================
  // SELECCIONAR TODOS
  // =========================================================

  seleccionarTodosEmpleados(): void {

    const ids =
      this.empleadosFiltrados()
        .map(
          (empleado) =>
            empleado.idUsuario,
        );


    this.empleadosSeleccionados.set(
      ids,
    );


    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: ids,
      }),
    );
  }


  // =========================================================
  // DESELECCIONAR TODOS
  // =========================================================

  deseleccionarTodosEmpleados(): void {

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


    this.empleadosSeleccionados.set(
      restantes,
    );


    this.descuentoMasivo.update(
      (actual) => ({
        ...actual,
        idUsuarios: restantes,
      }),
    );
  }


  // =========================================================
  // ALTERNAR TODOS
  // =========================================================

  alternarSeleccionTodos(): void {

    if (
      this.todosSeleccionados()
    ) {

      this.deseleccionarTodosEmpleados();

    } else {

      this.seleccionarTodosEmpleados();

    }
  }


  // =========================================================
  // ESTÁ SELECCIONADO
  // =========================================================

  estaSeleccionado(
    idUsuario: string,
  ): boolean {

    return this
      .empleadosSeleccionados()
      .includes(idUsuario);
  }


  // =========================================================
  // NOMBRE EMPLEADO
  // =========================================================

  obtenerNombreEmpleado(
    idUsuario: string,
  ): string {

    const empleado =
      this.empleados().find(
        (item) =>
          item.idUsuario === idUsuario,
      );


    return empleado
      ? `${empleado.nombreCompleto} — ${empleado.identidad}`
      : '';
  }


  // =========================================================
  // CARGA INICIAL
  // =========================================================

  cargarSaldoInicialEmpleado(): void {

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
      !Number.isInteger(
        datos.diasAsignados,
      ) ||
      datos.diasAsignados < 0 ||
      datos.diasAsignados > 365
    ) {
      return this.mostrarError(
        'La cantidad de días asignados no es válida.',
      );
    }


    if (
      !Number.isInteger(
        datos.diasUtilizados,
      ) ||
      datos.diasUtilizados < 0 ||
      datos.diasUtilizados >
        datos.diasAsignados
    ) {
      return this.mostrarError(
        'Los días utilizados no pueden superar los días asignados.',
      );
    }


    if (
      !Number.isInteger(
        datos.diasReservados,
      ) ||
      datos.diasReservados < 0 ||
      datos.diasReservados >
        datos.diasAsignados -
          datos.diasUtilizados
    ) {
      return this.mostrarError(
        'Los días reservados no pueden superar el saldo disponible.',
      );
    }


    if (
      !datos.observacion.trim()
    ) {
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


  // =========================================================
  // AJUSTE INDIVIDUAL
  // =========================================================

  ejecutarAjusteIndividual(): void {

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


    if (
      !datos.justificacion.trim()
    ) {
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


  // =========================================================
  // DESCUENTO MASIVO
  // =========================================================

  ejecutarDescuentoMasivo(): void {

    let seleccionados =
      this.empleadosSeleccionados();


    if (
      seleccionados.length === 0
    ) {

      this.seleccionarTodosEmpleados();

      seleccionados =
        this.empleadosSeleccionados();
    }


    const datos =
      this.descuentoMasivo();


    if (
      seleccionados.length === 0
    ) {
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


    if (
      !datos.justificacion.trim()
    ) {
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
        idUsuarios:
          seleccionados,

        dias:
          datos.dias,

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


  // =========================================================
  // HISTORIAL
  // =========================================================

  verHistorial(
    empleado: ReporteVacacionesEmpleado,
  ): void {

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


  // =========================================================
  // CERRAR HISTORIAL
  // =========================================================

  cerrarHistorial(): void {

    this.mostrandoHistorial.set(
      false,
    );

    this.historial.set([]);

    this.empleadoHistorial.set(
      null,
    );
  }


  // =========================================================
  // ACTUALIZAR CARGA
  // =========================================================

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


  // =========================================================
  // ACTUALIZAR AJUSTE
  // =========================================================

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


  // =========================================================
  // ACTUALIZAR DESCUENTO MASIVO
  // =========================================================

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


  // =========================================================
  // LIMPIAR CARGA INICIAL
  // =========================================================

  limpiarCargaInicial(): void {

    this.cargaInicial.set({
      idUsuario: '',

      anio:
        this.anio(),

      diasAsignados: 0,

      diasUtilizados: 0,

      diasReservados: 0,

      observacion: '',
    });
  }


  // =========================================================
  // LIMPIAR AJUSTE
  // =========================================================

  limpiarAjusteIndividual(): void {

    this.ajusteIndividual.set({
      idUsuario: '',

      tipo: 'DESCONTAR',

      dias: 0,

      justificacion: '',
    });
  }


  // =========================================================
  // LIMPIAR DESCUENTO MASIVO
  // =========================================================

  limpiarDescuentoMasivo(): void {

    this.empleadosSeleccionados.set(
      [],
    );


    this.descuentoMasivo.set({
      idUsuarios: [],

      dias: 0,

      justificacion: '',
    });
  }


  // =========================================================
  // CONVERTIR NÚMERO
  // =========================================================

  convertirNumero(
    valor: string,
  ): number {

    const numero =
      Number(valor);

    return Number.isFinite(numero)
      ? numero
      : 0;
  }


  // =========================================================
  // FORMATEAR DÍAS
  // =========================================================

  formatearDias(
    dias: number | null | undefined,
  ): string {

    return String(
      Number(dias ?? 0),
    );
  }


  // =========================================================
  // EXPORTAR EXCEL
  // =========================================================

  exportarExcel(): void {

    const empleados =
      this.empleadosFiltrados();


    if (
      empleados.length === 0
    ) {
      return this.mostrarError(
        'No hay registros para exportar.',
      );
    }


    const datos =
      empleados.map(
        (empleado, index) => ({

          '#':
            index + 1,

          Empleado:
            empleado.nombreCompleto,

          Identidad:
            empleado.identidad || '-',

          'Tipo de contratación':
            empleado.tipoContratacion || '-',

          Año:
            empleado.anio,

          'Días asignados':
            empleado.diasAsignados,

          'Días utilizados':
            empleado.diasUtilizados,

          'Días reservados':
            empleado.diasReservados,

          'Días disponibles':
            empleado.diasDisponibles,
        }),
      );


    const hoja =
      XLSX.utils.json_to_sheet(
        datos,
      );


    const libro =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      'Vacaciones',
    );


    XLSX.writeFile(
      libro,
      `reporte-vacaciones-${this.anio()}.xlsx`,
    );
  }


  // =========================================================
  // EXPORTAR PDF
  // =========================================================

  exportarPdf(): void {

    const empleados =
      this.empleadosFiltrados();


    if (
      empleados.length === 0
    ) {
      return this.mostrarError(
        'No hay registros para exportar.',
      );
    }


    const pdf =
      new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });


    pdf.setFontSize(16);

    pdf.text(
      'Reporte de vacaciones',
      14,
      15,
    );


    pdf.setFontSize(10);

    pdf.text(
      `Año: ${this.anio()}`,
      14,
      22,
    );


    pdf.text(
      `Total de empleados: ${empleados.length}`,
      14,
      28,
    );


    const filas =
      empleados.map(
        (empleado, index) => [

          index + 1,

          empleado.nombreCompleto,

          empleado.identidad || '-',

          empleado.tipoContratacion || '-',

          empleado.anio,

          empleado.diasAsignados,

          empleado.diasUtilizados,

          empleado.diasReservados,

          empleado.diasDisponibles,
        ],
      );


    autoTable(pdf, {

      startY: 34,

      head: [[
        '#',
        'Empleado',
        'Identidad',
        'Contratación',
        'Año',
        'Asignados',
        'Utilizados',
        'Reservados',
        'Disponibles',
      ]],

      body: filas,

      styles: {
        fontSize: 7,
        cellPadding: 2,
      },

      headStyles: {
        fontSize: 7,
        fontStyle: 'bold',
      },

      margin: {
        left: 10,
        right: 10,
      },
    });


    pdf.save(
      `reporte-vacaciones-${this.anio()}.pdf`,
    );
  }


  // =========================================================
  // MOSTRAR ERROR
  // =========================================================

  private mostrarError(
    mensaje: string,
  ): void {

    this.errorMessage.set(
      mensaje,
    );

    this.successMessage.set(
      '',
    );
  }


  // =========================================================
  // OBTENER MENSAJE DE ERROR
  // =========================================================

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {

    if (
      typeof error === 'object' &&
      error !== null
    ) {

      const respuesta =
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
        respuesta.error?.error?.message ??
        respuesta.error?.message ??
        respuesta.message ??
        mensajePredeterminado
      );
    }


    return mensajePredeterminado;
  }
}
