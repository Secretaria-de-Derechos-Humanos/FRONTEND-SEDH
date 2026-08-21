import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprobacionHistorial, AprobacionPendiente, AprobacionesApiService } from '../../../../../core/services/aprobaciones-api.service';

type PestanaAprobaciones =
  | 'pendientes'
  | 'historial';

type OrigenAprobacion =
  | 'PERSONAL'
  | 'OFICIAL'
  | 'VACACIONES';

interface AprobacionTabla {
  id: string;
  idPermisoPersonal: string;
  idPermisoOficial?: string | null;
  idPermisoVaca?: string | null;
  emailInstitucional: string;
  fecSolicitud: string;
  motivo: string | null;
  horSalida: string | null;
  horRetorno: string | null;
  horSolicitadas: string | number | null;
  idHorasDisponibles: string | number | null;
  catEmergencia: boolean;
  tipoSolicitud: {
    nomTipo: string;
  };
  origen: OrigenAprobacion;
  categoria: string;
  fecInicial?: string | null;
  fecFinal?: string | null;
  fecRetorno?: string | null;
  cantVacaciones?: number | null;
  totDiasRestantes?: number | null;
  registroOriginal: AprobacionPendiente;
}

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './aprobaciones.component.html',
  styleUrls: ['./aprobaciones.component.css' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AprobacionesComponent
  implements OnInit {
  private readonly aprobacionesApi =
    inject(AprobacionesApiService);

  /*
   * Datos recibidos desde el backend
   */
  readonly aprobaciones =
    signal<AprobacionPendiente[]>([]);
  readonly historial =
    signal<AprobacionHistorial[]>([]);
  /*
   * Estado de la pantalla
   */
  readonly pestanaActiva =
    signal<PestanaAprobaciones>(
      'pendientes',
    );

  readonly cargando =
    signal(false);
  readonly exportando =
    signal(false);
  readonly procesandoId =
    signal<string | null>(null);
  readonly errorMessage =
    signal('');
  readonly successMessage =
    signal('');

  /*
   * Modales
   */
  readonly mostrarModalRechazo =
    signal(false);
  readonly mostrarModalDetalle =
    signal(false);
  readonly mostrarModalHistorial =
    signal(false);
  readonly aprobacionSeleccionada =
    signal<AprobacionTabla | null>(null);
  readonly historialSeleccionado =
    signal<AprobacionHistorial | null>(
      null,
    );

  /*
   * Filtros
   */
  readonly busqueda =
    signal('');
  readonly filtroTipo =
    signal('TODOS');
  readonly filtroEmergencia =
    signal('TODOS');
  readonly filtroEstado =
    signal('TODOS');
  readonly fechaDesde =
    signal('');
  readonly fechaHasta =
    signal('');

  motivoRechazo = '';

  /*
   * Une permisos personales y oficiales
   * para mostrarlos en una sola tabla.
   */
  readonly aprobacionesCombinadas =
    computed<AprobacionTabla[]>(() =>
      this.aprobaciones().map(
        (solicitud): AprobacionTabla => ({
          id: solicitud.id,
          idPermisoPersonal: solicitud.idPermisoPersonal,
          idPermisoOficial: solicitud.idPermisoOficial ?? null,
          idPermisoVaca: solicitud.idPermisoVaca ?? null,
          emailInstitucional: solicitud.emailInstitucional,
          fecSolicitud: solicitud.fecSolicitud,
          motivo: solicitud.motivo ?? solicitud.observaciones ?? null,
          horSalida: solicitud.horSalida ?? null,
          horRetorno: solicitud.horRetorno ?? null,
          horSolicitadas:
            solicitud.horSolicitadas ?? solicitud.cantVacaciones ?? null,
          idHorasDisponibles:
            solicitud.idHorasDisponibles ?? solicitud.totDiasRestantes ?? null,
          catEmergencia: Boolean(solicitud.catEmergencia),
          tipoSolicitud: {
            nomTipo:
              solicitud.tipoSolicitud?.nomTipo ??
              this.obtenerNombreTipo(solicitud.origen),
          },
          origen: solicitud.origen,
          categoria: solicitud.categoria,
          fecInicial: solicitud.fecInicial ?? null,
          fecFinal: solicitud.fecFinal ?? null,
          fecRetorno: solicitud.fecRetorno ?? null,
          cantVacaciones: solicitud.cantVacaciones ?? null,
          totDiasRestantes: solicitud.totDiasRestantes ?? null,
          registroOriginal: solicitud,
        }),
      ),
    );

  /*
   * Filtro de la tabla de pendientes.
   */
  readonly aprobacionesFiltradas =
    computed<AprobacionTabla[]>(() => {
      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      const tipo =
        this.filtroTipo();

      const emergencia =
        this.filtroEmergencia();

      return this.aprobacionesCombinadas()
        .filter((aprobacion) => {
          const correo =
            aprobacion
              .emailInstitucional
              .toLowerCase();

          const motivo =
            aprobacion.motivo
              ?.toLowerCase() ??
            '';

          const nombreTipo =
            aprobacion.tipoSolicitud
              .nomTipo
              .toLowerCase();

          const coincideTexto =
            !texto ||
            correo.includes(texto) ||
            motivo.includes(texto) ||
            nombreTipo.includes(texto);

          const coincideTipo =
            tipo === 'TODOS' ||
            aprobacion.tipoSolicitud
              .nomTipo === tipo;

          /*
           * Los permisos oficiales no son
           * solicitudes de emergencia.
           */
          const coincideEmergencia =
            emergencia === 'TODOS' ||
            (
              emergencia === 'SI' &&
              aprobacion.catEmergencia
            ) ||
            (
              emergencia === 'NO' &&
              !aprobacion.catEmergencia
            );

          return (
            coincideTexto &&
            coincideTipo &&
            coincideEmergencia
          );
        });
    });

  /*
   * Filtro del historial.
   */
  readonly historialFiltrado =
    computed(() => {
      const texto =
        this.busqueda()
          .trim()
          .toLowerCase();

      const tipo =
        this.filtroTipo();
      const estado =
        this.filtroEstado();
      const desde =
        this.fechaDesde();
      const hasta =
        this.fechaHasta();
      return this.historial().filter(
        (registro) => {
          const coincideTexto =
            !texto ||
            registro
              .emailInstitucional
              .toLowerCase()
              .includes(texto) ||
            registro
              .tipoSolicitud
              .toLowerCase()
              .includes(texto) ||
            registro.motivo
              ?.toLowerCase()
              .includes(texto) ||
            registro.procesadoPor
              ?.toLowerCase()
              .includes(texto);

          const coincideTipo =
            tipo === 'TODOS' ||
            registro.tipoSolicitud ===
              tipo;
          const coincideEstado =
            estado === 'TODOS' ||
            registro.estado === estado;
          const fecha =
            registro.fechaSolicitud;
          const coincideDesde =
            !desde ||
            fecha >= desde;
          const coincideHasta =
            !hasta ||
            fecha <= hasta;

          return (
            coincideTexto &&
            coincideTipo &&
            coincideEstado &&
            coincideDesde &&
            coincideHasta
          );
        },
      );
    });

  /*
   * Contadores.
   */
  readonly solicitudesPendientes =
    computed(
      () =>
        this.aprobacionesFiltradas()
          .length,
    );

  readonly solicitudesProcesadas =
    computed(
      () =>
        this.historialFiltrado()
          .length,
    );

  /*
   * Tipos disponibles en los filtros.
   */
  readonly tiposDisponibles =
    computed(() => {
      const tiposPendientes =
        this.aprobacionesCombinadas()
          .map(
            (item) =>
              item.tipoSolicitud
                .nomTipo,
          )
          .filter(Boolean);

      const tiposHistorial =
        this.historial()
          .map(
            (item) =>
              item.tipoSolicitud,
          )
          .filter(Boolean);

      return [
        ...new Set([
          'PERMISO PERSONAL',
          'PERMISO OFICIAL',
          'VACACIONES',
          ...tiposPendientes,
          ...tiposHistorial,
        ]),
      ];
    });

  ngOnInit(): void {
    /*
     * Solo se llama una vez cada endpoint.
     */
    this.cargarAprobaciones();
  }

  /*
   * Cargar permisos personales.
   */
  cargarAprobaciones(): void {
    this.cargando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .listarPendientes()
      .subscribe({
        next: (
          datos:
            AprobacionPendiente[],
        ) => {
          this.aprobaciones.set(
            datos ?? [],
          );

          this.cargando.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar permisos personales:',
            error,
          );

          /*
           * Se mantiene la lista vacía,
           * pero no impide mostrar los
           * permisos oficiales.
           */
          this.aprobaciones.set([]);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron cargar los permisos personales.',
            ),
          );

          this.cargando.set(false);
        },
      });
  }


  /*
   * Cambiar entre pestañas.
   */
  cambiarPestana(
    pestana: PestanaAprobaciones,
  ): void {
    this.pestanaActiva.set(
      pestana,
    );

    this.errorMessage.set('');
    this.successMessage.set('');

    if (
      pestana === 'pendientes'
    ) {
      this.cargarAprobaciones();
    } else {
      this.cargarHistorial();
    }
  }

  /*
   * Cargar historial.
   */
  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .listarHistorial()
      .subscribe({
        next: (
          datos:
            AprobacionHistorial[],
        ) => {
          this.historial.set(
            datos ?? [],
          );

          this.cargando.set(false);
        },

        error: (error: unknown) => {
          console.error(
            'Error al cargar historial:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo cargar el historial.',
            ),
          );

          this.cargando.set(false);
        },
      });
  }

  /*
   * Actualizar botón de la pantalla.
   */
  actualizarVista(): void {
    if (
      this.pestanaActiva() ===
      'pendientes'
    ) {
      this.cargarAprobaciones();
    } else {
      this.cargarHistorial();
    }
  }

  actualizarBusqueda(
    valor: string,
  ): void {
    this.busqueda.set(valor);
  }

  actualizarTipo(
    valor: string,
  ): void {
    this.filtroTipo.set(valor);
  }

  actualizarEmergencia(
    valor: string,
  ): void {
    this.filtroEmergencia.set(
      valor,
    );
  }

  actualizarEstado(
    valor: string,
  ): void {
    this.filtroEstado.set(valor);
  }

  actualizarFechaDesde(
    valor: string,
  ): void {
    this.fechaDesde.set(valor);
  }

  actualizarFechaHasta(
    valor: string,
  ): void {
    this.fechaHasta.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroTipo.set('TODOS');
    this.filtroEmergencia.set(
      'TODOS',
    );
    this.filtroEstado.set('TODOS');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
  }

  /*
   * Detalle de una solicitud pendiente.
   */
  verDetalle(
    aprobacion:
      AprobacionTabla,
  ): void {
    this.aprobacionSeleccionada.set(
      aprobacion,
    );

    this.mostrarModalDetalle.set(
      true,
    );
  }

  cerrarDetalle(): void {
    this.mostrarModalDetalle.set(
      false,
    );

    this.aprobacionSeleccionada.set(
      null,
    );
  }

  /*
   * Detalle del historial.
   */
  verDetalleHistorial(
    registro:
      AprobacionHistorial,
  ): void {
    this.historialSeleccionado.set(
      registro,
    );

    this.mostrarModalHistorial.set(
      true,
    );
  }

  cerrarDetalleHistorial(): void {
    this.mostrarModalHistorial.set(
      false,
    );

    this.historialSeleccionado.set(
      null,
    );
  }

  /*
   * Aprobar permiso personal.
   *
   * Por ahora no se intenta aprobar un
   * permiso oficial porque todavía no
   * tienes endpoint PATCH para oficiales.
   */
  aprobar(
    aprobacion:
      AprobacionTabla,
  ): void {
    if (
      aprobacion.origen !==
      'PERSONAL'
    ) {
      this.errorMessage.set(
        `La solicitud de ${this.obtenerNombreTipo(aprobacion.origen)} puede visualizarse, pero todavía no tiene un endpoint de aprobación.`,
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Desea aprobar el permiso de ${aprobacion.emailInstitucional}?`,
      );

    if (!confirmar) {
      return;
    }

    this.procesandoId.set(
      aprobacion.idPermisoPersonal,
    );

    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .aprobar(
        aprobacion
          .idPermisoPersonal,
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Permiso aprobado correctamente.',
          );

          this.procesandoId.set(
            null,
          );
          this.historial.set([]);
          this.cerrarDetalle();
          this.cargarAprobaciones();
        },

        error: (error: unknown) => {
          console.error(
            'Error al aprobar:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo aprobar el permiso.',
            ),
          );

          this.procesandoId.set(
            null,
          );
        },
      });
  }

  /*
   * Abrir modal para rechazo.
   */
  abrirModalRechazo(
    aprobacion:
      AprobacionTabla,
  ): void {
    if (
      aprobacion.origen !==
      'PERSONAL'
    ) {
      this.errorMessage.set(
        `La solicitud de ${this.obtenerNombreTipo(aprobacion.origen)} puede visualizarse, pero todavía no tiene un endpoint de rechazo.`,
      );

      return;
    }

    this.aprobacionSeleccionada.set(
      aprobacion,
    );

    this.motivoRechazo = '';
    this.mostrarModalDetalle.set(
      false,
    );

    this.mostrarModalRechazo.set(
      true,
    );
  }

  cerrarModalRechazo(): void {
    this.mostrarModalRechazo.set(
      false,
    );

    this.aprobacionSeleccionada.set(
      null,
    );

    this.motivoRechazo = '';
  }

  confirmarRechazo(): void {
    const aprobacion =
      this.aprobacionSeleccionada();

    const motivo =
      this.motivoRechazo.trim();

    if (!aprobacion) {
      return;
    }

    if (
      aprobacion.origen !==
      'PERSONAL'
    ) {
      this.errorMessage.set(
        `Todavía no existe un endpoint para rechazar ${this.obtenerNombreTipo(aprobacion.origen)}.`,
      );

      return;
    }

    if (!motivo) {
      this.errorMessage.set(
        'Debe escribir el motivo del rechazo.',
      );

      return;
    }

    this.procesandoId.set(
      aprobacion.idPermisoPersonal,
    );

    this.errorMessage.set('');
    this.successMessage.set('');

    this.aprobacionesApi
      .rechazar(
        aprobacion
          .idPermisoPersonal,
        motivo,
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Permiso rechazado correctamente.',
          );

          this.procesandoId.set(
            null,
          );

          this.cerrarModalRechazo();

          this.cargarAprobaciones();
        },

        error: (error: unknown) => {
          console.error(
            'Error al rechazar:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo rechazar el permiso.',
            ),
          );

          this.procesandoId.set(
            null,
          );
        },
      });
  }

  /*
   * Exportar pendientes a Excel.
   */
  async exportarExcel(): Promise<void> {
    const datos =
      this.aprobacionesFiltradas();

    if (datos.length === 0) {
      this.errorMessage.set(
        'No hay registros para exportar.',
      );

      return;
    }

    this.exportando.set(true);
    this.errorMessage.set('');

    try {
      const XLSX =
        await import('xlsx');

      const filas = datos.map(
        (
          aprobacion,
          indice,
        ) => ({
          Número:
            indice + 1,

          Empleado:
            aprobacion
              .emailInstitucional,

          'Tipo de solicitud':
            aprobacion
              .tipoSolicitud
              .nomTipo,

          'Fecha de solicitud':
            this.formatearFecha(
              aprobacion
                .fecSolicitud,
            ),

          'Hora de salida':
            aprobacion.horSalida ??
            '',

          'Hora de retorno':
            aprobacion.horRetorno ??
            '',

          'Horas solicitadas':
            aprobacion
              .horSolicitadas ??
            '',

          'Horas disponibles':
            aprobacion
              .idHorasDisponibles ??
            '',

          Motivo:
            aprobacion.motivo ??
            '',

          Emergencia:
            aprobacion
              .catEmergencia
              ? 'Sí'
              : 'No',

          Categoría:
            aprobacion.origen === 'VACACIONES'
              ? 'Vacaciones'
              : aprobacion.origen === 'OFICIAL'
                ? 'Permiso oficial'
                : 'Permiso personal',

          Estado:
            'Pendiente',
        }),
      );

      const hoja =
        XLSX.utils
          .json_to_sheet(filas);

      hoja['!cols'] = [
        { wch: 10 },
        { wch: 35 },
        { wch: 24 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 45 },
        { wch: 14 },
        { wch: 20 },
        { wch: 14 },
      ];

      const libro =
        XLSX.utils
          .book_new();

      XLSX.utils
        .book_append_sheet(
          libro,
          hoja,
          'Aprobaciones',
        );

      XLSX.writeFile(
        libro,
        `aprobaciones-pendientes-${this.obtenerFechaActual()}.xlsx`,
      );
    } catch (error) {
      console.error(
        'Error al exportar Excel:',
        error,
      );

      this.errorMessage.set(
        'No se pudo generar el archivo Excel.',
      );
    } finally {
      this.exportando.set(false);
    }
  }

  /*
   * Exportar pendientes a PDF.
   */
  async exportarPDF(): Promise<void> {
    const datos =
      this.aprobacionesFiltradas();

    if (datos.length === 0) {
      this.errorMessage.set(
        'No hay registros para exportar.',
      );

      return;
    }

    this.exportando.set(true);
    this.errorMessage.set('');

    try {
      const { default: jsPDF } =
        await import('jspdf');

      const { default: autoTable } =
        await import(
          'jspdf-autotable'
        );

      const documento =
        new jsPDF({
          orientation:
            'landscape',
          unit: 'mm',
          format: 'a4',
        });

      documento.setFontSize(16);

      documento.setFont(
        'helvetica',
        'bold',
      );

      documento.text(
        'Reporte de aprobaciones pendientes',
        14,
        18,
      );

      documento.setFontSize(9);

      documento.setFont(
        'helvetica',
        'normal',
      );

      documento.text(
        `Generado: ${this.formatearFecha(
          new Date().toISOString(),
        )}`,
        14,
        25,
      );

      documento.text(
        `Total de registros: ${datos.length}`,
        14,
        30,
      );

      const cuerpo =
        datos.map(
          (aprobacion) => [
            aprobacion
              .emailInstitucional,

            aprobacion
              .tipoSolicitud
              .nomTipo,

            aprobacion.origen === 'VACACIONES'
              ? 'Vacaciones'
              : aprobacion.origen === 'OFICIAL'
                ? 'Oficial'
                : 'Personal',

            this.formatearFecha(
              aprobacion
                .fecSolicitud,
            ),

            aprobacion
              .horSalida ??
            '-',

            aprobacion
              .horRetorno ??
            '-',

            aprobacion
              .horSolicitadas ??
            '-',

            String(
              aprobacion
                .idHorasDisponibles ??
              '-',
            ),

            aprobacion.motivo ??
            'Sin motivo',

            aprobacion
              .catEmergencia
              ? 'Sí'
              : 'No',
          ],
        );

      autoTable(documento, {
        startY: 36,

        head: [[
          'Empleado',
          'Tipo',
          'Categoría',
          'Fecha',
          'Salida',
          'Retorno',
          'Tiempo',
          'Disponibles',
          'Motivo',
          'Emergencia',
        ]],

        body: cuerpo,

        theme: 'striped',

        headStyles: {
          fillColor:
            [38, 77, 160],
          textColor:
            [255, 255, 255],
          fontStyle:
            'bold',
          fontSize: 8,
        },

        bodyStyles: {
          fontSize: 7,
        },

        margin: {
          left: 10,
          right: 10,
        },
      });

      documento.save(
        `aprobaciones-pendientes-${this.obtenerFechaActual()}.pdf`,
      );
    } catch (error) {
      console.error(
        'Error al exportar PDF:',
        error,
      );

      this.errorMessage.set(
        'No se pudo generar el reporte PDF.',
      );
    } finally {
      this.exportando.set(false);
    }
  }

  async exportarExcelHistorial():
    Promise<void> {
    console.log(
      'Registros del historial:',
      this.historialFiltrado(),
    );
  }

  async exportarPDFHistorial():
    Promise<void> {
    console.log(
      'Registros del historial:',
      this.historialFiltrado(),
    );
  }

  private obtenerNombreTipo(origen: OrigenAprobacion): string {
    switch (origen) {
      case 'VACACIONES':
        return 'VACACIONES';
      case 'OFICIAL':
        return 'PERMISO OFICIAL';
      default:
        return 'PERMISO PERSONAL';
    }
  }

  private formatearFecha(
    fecha: string,
  ): string {
    if (!fecha) {
      return '';
    }

    const valor =
      fecha.includes('T')
        ? fecha
        : `${fecha}T00:00:00`;

    return new Intl.DateTimeFormat(
      'es-HN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(
      new Date(valor),
    );
  }

  private obtenerFechaActual():
    string {
    return new Date()
      .toISOString()
      .slice(0, 10);
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
        errorHttp.error
          ?.error
          ?.message ??
        errorHttp.error
          ?.message ??
        errorHttp.message ??
        mensajeDefecto
      );
    }

    return mensajeDefecto;
  }
}
