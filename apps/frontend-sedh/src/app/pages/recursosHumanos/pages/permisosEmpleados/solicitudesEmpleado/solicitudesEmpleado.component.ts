import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  DatePipe,
  isPlatformBrowser,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  EncabezadosPaginaComponent,
} from '../../../../../components/encabezadosPagina/encabezadosPagina.component';

import {
  DatosPermiso,
  InsertarPermisoOficialBody,
  InsertarPermisoPersonalBody,
  SolicitudesEmpleadoService,
} from './solicitudesEmpleado.service';

export type TipoSolicitud =
  | 'permiso-personal'
  | 'permiso-oficial';

export interface NuevaSolicitudForm {
  nombreEmpleado: string;
  dependencia: string;
  cargo: string;
  tipoSolicitud: TipoSolicitud | '';
}

export interface Solicitud {
  fec_solicitud: string;
  nom_tipo_solicitud: string;

  nom_estado:
    | 'EN PROCESO'
    | 'APROBADO'
    | 'RECHAZADO';

  pri_aporbacion: string | null;
  seg_aprobacion: string | null;
  mot_rechazo: string | null;
}

/**
 * Devuelve la fecha local en formato YYYY-MM-DD.
 */
function hoyStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Permisos personales:
 * máximo siete días desde la fecha actual.
 */
function maxFechaStr(): string {
  const fecha = new Date();

  fecha.setDate(
    fecha.getDate() + 7,
  );

  return fecha.toLocaleDateString('en-CA');
}

/**
 * Permisos oficiales:
 * máximo catorce días desde la fecha actual.
 */
function maxFechaOficialStr(): string {
  const fecha = new Date();

  fecha.setDate(
    fecha.getDate() + 14,
  );

  return fecha.toLocaleDateString('en-CA');
}

@Component({
  selector: 'app-solicitudes-empleado',
  standalone: true,

  imports: [
    DatePipe,
    FormsModule,
    EncabezadosPaginaComponent,
  ],

  templateUrl:
    './solicitudesEmpleado.component.html',

  styleUrls: [
    './solicitudesEmpleado.component.css',
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SolicitudesEmpleadoComponent
  implements OnInit
{
  private readonly solicitudesService =
    inject(SolicitudesEmpleadoService);

  private readonly platformId =
    inject(PLATFORM_ID);

  /* =========================================================
     LISTADOS
     ========================================================= */

  readonly solicitudes =
    signal<Solicitud[]>([]);

  readonly solicitudesEmergencia =
    signal<Solicitud[]>([]);

  readonly isActualizando =
    signal(true);

  readonly errorMessage =
    signal('');

  /* =========================================================
     FILTROS: SOLICITUDES NORMALES
     ========================================================= */

  readonly filtroFecha =
    signal('');

  readonly filtroTipo =
    signal('');

  readonly filtroEstado =
    signal('');

  /* =========================================================
     FILTROS: EMERGENCIAS
     ========================================================= */

  readonly filtroFechaE =
    signal('');

  readonly filtroTipoE =
    signal('');

  readonly filtroEstadoE =
    signal('');

  readonly solicitudesFiltradas =
    computed(() => {
      const filtroFecha =
        this.filtroFecha()
          .trim()
          .toLowerCase();

      const filtroTipo =
        this.filtroTipo()
          .trim()
          .toLowerCase();

      const filtroEstado =
        this.filtroEstado()
          .trim()
          .toLowerCase();

      return this.solicitudes().filter(
        (solicitud) =>
          (
            filtroFecha
              ? solicitud.fec_solicitud
                  .toLowerCase()
                  .includes(filtroFecha)
              : true
          ) &&
          (
            filtroTipo
              ? solicitud.nom_tipo_solicitud
                  .toLowerCase()
                  .includes(filtroTipo)
              : true
          ) &&
          (
            filtroEstado
              ? solicitud.nom_estado
                  .toLowerCase()
                  .includes(filtroEstado)
              : true
          ),
      );
    });

  readonly solicitudesEmergenciaFiltradas =
    computed(() => {
      const filtroFecha =
        this.filtroFechaE()
          .trim()
          .toLowerCase();

      const filtroTipo =
        this.filtroTipoE()
          .trim()
          .toLowerCase();

      const filtroEstado =
        this.filtroEstadoE()
          .trim()
          .toLowerCase();

      return this.solicitudesEmergencia()
        .filter(
          (solicitud) =>
            (
              filtroFecha
                ? solicitud.fec_solicitud
                    .toLowerCase()
                    .includes(filtroFecha)
                : true
            ) &&
            (
              filtroTipo
                ? solicitud.nom_tipo_solicitud
                    .toLowerCase()
                    .includes(filtroTipo)
                : true
            ) &&
            (
              filtroEstado
                ? solicitud.nom_estado
                    .toLowerCase()
                    .includes(filtroEstado)
                : true
            ),
        );
    });

  readonly badgeClass = 'badge';

  /* =========================================================
     MODAL
     ========================================================= */

  readonly modalAbierto =
    signal(false);

  readonly cargandoModal =
    signal(false);

  readonly isEnviando =
    signal(false);

  readonly modalError =
    signal('');

  readonly form =
    signal<NuevaSolicitudForm>({
      nombreEmpleado: '',
      dependencia: '',
      cargo: '',
      tipoSolicitud: '',
    });

  /* =========================================================
     PERMISO PERSONAL
     ========================================================= */

  readonly ppFechaMin =
    hoyStr();

  readonly ppFechaMax =
    maxFechaStr();

  readonly ppFecha =
    signal(hoyStr());

  readonly ppHoras =
    signal(0);

  readonly ppMinutos =
    signal(0);

  readonly ppMotivo =
    signal('Asunto Personal.');

  readonly ppCitaMedica =
    signal(0);

  /**
   * Texto que se muestra en la tarjeta.
   */
  readonly ppHorasDisponibles =
    signal('--:--');

  readonly ppDisponibilidadDia =
    signal('--:--');

  readonly ppConsultandoDisponibilidad =
    signal(false);

  /**
   * Valores en minutos para validar el formulario.
   */
  readonly ppDisponibleMesMinutos =
    signal(0);

  readonly ppDisponibleDiaMinutos =
    signal(0);

  readonly ppDisponibilidadCargada =
    signal(false);

  readonly ppMinutosSolicitados =
    computed(() => {
      const horas =
        Number(this.ppHoras()) || 0;

      const minutos =
        Number(this.ppMinutos()) || 0;

      return (
        horas * 60 +
        minutos
      );
    });

  readonly ppErrores =
    computed(() => {
      const horas =
        Number(this.ppHoras());

      const minutos =
        Number(this.ppMinutos());

      const minutosSolicitados =
        this.ppMinutosSolicitados();

      const fechaInvalida =
        !this.ppFecha() ||
        this.ppFecha() <
          this.ppFechaMin ||
        this.ppFecha() >
          this.ppFechaMax;

      const horasInvalidas =
        !Number.isInteger(horas) ||
        horas < 0 ||
        horas > 3 ||
        (
          horas === 3 &&
          minutos > 0
        );

      const minutosInvalidos =
        !Number.isInteger(minutos) ||
        minutos < 0 ||
        minutos > 59;

      const tiempoVacio =
        minutosSolicitados <= 0;

      const excedeLimiteDiario =
        minutosSolicitados > 180;

      const excedeDisponibleDia =
        this.ppDisponibilidadCargada() &&
        minutosSolicitados >
          this.ppDisponibleDiaMinutos();

      const excedeDisponibleMes =
        this.ppDisponibilidadCargada() &&
        minutosSolicitados >
          this.ppDisponibleMesMinutos();

      return {
        fecha:
          fechaInvalida,

        horas:
          horasInvalidas,

        minutos:
          minutosInvalidos,

        tiempoVacio,

        excedeLimiteDiario,

        excedeDisponibleDia,

        excedeDisponibleMes,

        motivo:
          !this.ppMotivo().trim(),
      };
    });

  readonly ppFormInvalido =
    computed(() => {
      const errores =
        this.ppErrores();

      return (
        errores.fecha ||
        errores.horas ||
        errores.minutos ||
        errores.tiempoVacio ||
        errores.excedeLimiteDiario ||
        errores.excedeDisponibleDia ||
        errores.excedeDisponibleMes ||
        errores.motivo ||
        !this.ppDisponibilidadCargada() ||
        this.ppConsultandoDisponibilidad() ||
        (
          this.ppCitaMedica() !== 0 &&
          this.ppCitaMedica() !== 1
        )
      );
    });

  readonly ppFormatHM =
    computed(() => {
      const horas =
        String(
          Math.max(
            0,
            Number(this.ppHoras()) || 0,
          ),
        ).padStart(2, '0');

      const minutos =
        String(
          Math.max(
            0,
            Number(this.ppMinutos()) || 0,
          ),
        ).padStart(2, '0');

      return `${horas}:${minutos}`;
    });

  /* =========================================================
     PERMISO OFICIAL
     ========================================================= */

  readonly poFechaMin =
    hoyStr();

  readonly poFechaMax =
    maxFechaOficialStr();

  readonly poFecha =
    signal(hoyStr());

  readonly poMotivo =
    signal('');

  readonly poErrores =
    computed(() => ({
      fecha:
        !this.poFecha() ||
        this.poFecha() <
          this.poFechaMin ||
        this.poFecha() >
          this.poFechaMax,

      motivo:
        !this.poMotivo().trim(),
    }));

  readonly poFormInvalido =
    computed(() =>
      Object.values(
        this.poErrores(),
      ).some(Boolean),
    );

  /* =========================================================
     CICLO DE VIDA
     ========================================================= */

  ngOnInit(): void {
    if (
      isPlatformBrowser(
        this.platformId,
      )
    ) {
      this.cargarDatos();
    }
  }

  /* =========================================================
     CARGA DE SOLICITUDES
     ========================================================= */

  actualizarDatos(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.isActualizando.set(true);
    this.errorMessage.set('');

    forkJoin({
      solicitudes:
        this.solicitudesService
          .getMisSolicitudes()
          .pipe(
            catchError(() => of(null)),
          ),

      emergencias:
        this.solicitudesService
          .getMisSolicitudesEmergencia()
          .pipe(
            catchError(() => of(null)),
          ),
    }).subscribe({
      next: ({
        solicitudes,
        emergencias,
      }) => {
        if (
          solicitudes === null &&
          emergencias === null
        ) {
          this.errorMessage.set(
            'No fue posible cargar las solicitudes. Intente nuevamente.',
          );
        }

        this.solicitudes.set(
          solicitudes ?? [],
        );

        this.solicitudesEmergencia.set(
          emergencias ?? [],
        );

        this.isActualizando.set(false);
      },

      error: () => {
        this.errorMessage.set(
          'No fue posible cargar las solicitudes.',
        );

        this.isActualizando.set(false);
      },
    });
  }

  /* =========================================================
     MODAL
     ========================================================= */

  private resetModal(
    datos?: DatosPermiso,
  ): void {
    this.form.set({
      nombreEmpleado:
        datos?.nombre ?? '',

      dependencia:
        datos?.dependencia ?? '',

      cargo:
        datos?.cargo ?? '',

      tipoSolicitud:
        'permiso-personal',
    });

    this.modalError.set('');

    this.ppFecha.set(
      hoyStr(),
    );

    this.ppHoras.set(0);
    this.ppMinutos.set(0);

    this.ppMotivo.set(
      'Asunto Personal.',
    );

    this.ppCitaMedica.set(0);

    this.ppHorasDisponibles.set(
      datos?.horasDisponibles ??
        '--:--',
    );

    this.ppDisponibilidadDia.set(
      '--:--',
    );

    this.ppDisponibleMesMinutos.set(
      0,
    );

    this.ppDisponibleDiaMinutos.set(
      0,
    );

    this.ppDisponibilidadCargada.set(
      false,
    );

    this.ppConsultandoDisponibilidad.set(
      false,
    );

    this.poFecha.set(
      hoyStr(),
    );

    this.poMotivo.set('');
  }

  abrirModal(): void {
    this.cargandoModal.set(true);
    this.modalError.set('');

    this.solicitudesService
      .getDatosPermiso()
      .subscribe({
        next: (
          datos: DatosPermiso,
        ) => {
          this.resetModal(datos);

          this.cargandoModal.set(
            false,
          );

          this.modalAbierto.set(
            true,
          );

          this.cargarDisponibilidadPermisoPersonal(
            this.ppFecha(),
          );
        },

        error: (error: unknown) => {
          console.error(
            'Error cargando datos del permiso:',
            error,
          );

          this.resetModal();

          this.modalError.set(
            'No fue posible cargar la información del empleado.',
          );

          this.cargandoModal.set(
            false,
          );

          this.modalAbierto.set(
            true,
          );

          this.cargarDisponibilidadPermisoPersonal(
            this.ppFecha(),
          );
        },
      });
  }

  cerrarModal(): void {
    if (this.isEnviando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.modalError.set('');
  }

  onTipoChange(
    tipo: string,
  ): void {
    this.form.update(
      (formulario) => ({
        ...formulario,

        tipoSolicitud:
          tipo as
            | TipoSolicitud
            | '',
      }),
    );

    this.modalError.set('');

    if (
      tipo ===
      'permiso-personal'
    ) {
      this.cargarDisponibilidadPermisoPersonal(
        this.ppFecha(),
      );
    }
  }

  /* =========================================================
     DISPONIBILIDAD DEL PERMISO PERSONAL
     ========================================================= */

  cambiarFechaPermisoPersonal(
    fecha: string,
  ): void {
    this.ppFecha.set(fecha);
    this.modalError.set('');

    if (
      !fecha ||
      fecha <
        this.ppFechaMin ||
      fecha >
        this.ppFechaMax
    ) {
      this.ppHorasDisponibles.set(
        '--:--',
      );

      this.ppDisponibilidadDia.set(
        '--:--',
      );

      this.ppDisponibleMesMinutos.set(
        0,
      );

      this.ppDisponibleDiaMinutos.set(
        0,
      );

      this.ppDisponibilidadCargada.set(
        false,
      );

      return;
    }

    this.cargarDisponibilidadPermisoPersonal(
      fecha,
    );
  }

  private cargarDisponibilidadPermisoPersonal(
    fecha: string,
  ): void {
    if (!fecha) {
      return;
    }

    this.ppConsultandoDisponibilidad.set(
      true,
    );

    this.ppDisponibilidadCargada.set(
      false,
    );

    this.solicitudesService
      .consultarDisponibilidadPermisoPersonal(
        fecha,
      )
      .subscribe({
        next: (
          disponibilidad,
        ) => {
          const disponibleMes =
            Math.max(
              0,
              Number(
                disponibilidad
                  .disponibleMesMinutos,
              ) || 0,
            );

          const disponibleDia =
            Math.max(
              0,
              Number(
                disponibilidad
                  .disponibleDiaMinutos,
              ) || 0,
            );

          this.ppDisponibleMesMinutos.set(
            disponibleMes,
          );

          this.ppDisponibleDiaMinutos.set(
            disponibleDia,
          );

          this.ppHorasDisponibles.set(
            this.formatearMinutos(
              disponibleMes,
            ),
          );

          this.ppDisponibilidadDia.set(
            this.formatearMinutos(
              disponibleDia,
            ),
          );

          this.ppDisponibilidadCargada.set(
            true,
          );

          this.ppConsultandoDisponibilidad.set(
            false,
          );
        },

        error: (error: unknown) => {
          console.error(
            'Error al consultar disponibilidad:',
            error,
          );

          this.ppHorasDisponibles.set(
            '--:--',
          );

          this.ppDisponibilidadDia.set(
            '--:--',
          );

          this.ppDisponibleMesMinutos.set(
            0,
          );

          this.ppDisponibleDiaMinutos.set(
            0,
          );

          this.ppDisponibilidadCargada.set(
            false,
          );

          this.ppConsultandoDisponibilidad.set(
            false,
          );

          this.modalError.set(
            this.obtenerMensajeError(
              error,
              'No fue posible consultar las horas disponibles.',
            ),
          );
        },
      });
  }

  private formatearMinutos(
    minutosTotales: number,
  ): string {
    const valor =
      Math.max(
        0,
        Math.round(
          Number(minutosTotales) ||
            0,
        ),
      );

    const horas =
      Math.floor(
        valor / 60,
      );

    const minutos =
      valor % 60;

    return (
      `${String(horas).padStart(2, '0')}:` +
      `${String(minutos).padStart(2, '0')}`
    );
  }

  /* =========================================================
     ENVÍO
     ========================================================= */

  enviarSolicitud(): void {
    this.modalError.set('');

    if (
      this.form().tipoSolicitud ===
      'permiso-personal'
    ) {
      if (
        this.ppFormInvalido()
      ) {
        this.modalError.set(
          'Revise los datos del permiso personal.',
        );

        return;
      }

      const body:
        InsertarPermisoPersonalBody = {
          fecha:
            this.ppFecha(),

          horas:
            this.ppFormatHM(),

          motivo:
            this.ppMotivo().trim(),

          emergencia:
            this.ppCitaMedica() ===
            1,
        };

      this.isEnviando.set(true);

      this.solicitudesService
        .insertarPermisoPersonal(
          body,
        )
        .subscribe({
          next: () => {
            this.isEnviando.set(
              false,
            );

            this.cerrarModal();
            this.cargarDatos();
          },

          error: (
            error: unknown,
          ) => {
            this.isEnviando.set(
              false,
            );

            this.modalError.set(
              this.obtenerMensajeError(
                error,
                'No fue posible registrar el permiso personal.',
              ),
            );

            this.cargarDisponibilidadPermisoPersonal(
              this.ppFecha(),
            );
          },
        });

      return;
    }

    if (
      this.form().tipoSolicitud ===
      'permiso-oficial'
    ) {
      if (
        this.poFormInvalido()
      ) {
        this.modalError.set(
          'Revise los datos del permiso oficial.',
        );

        return;
      }

      const body:
        InsertarPermisoOficialBody = {
          fecha:
            this.poFecha(),

          motivo:
            this.poMotivo().trim(),
        };

      this.isEnviando.set(true);

      this.solicitudesService
        .insertarPermisoOficial(
          body,
        )
        .subscribe({
          next: () => {
            this.isEnviando.set(
              false,
            );

            this.cerrarModal();
            this.cargarDatos();
          },

          error: (
            error: unknown,
          ) => {
            this.isEnviando.set(
              false,
            );

            this.modalError.set(
              this.obtenerMensajeError(
                error,
                'No fue posible registrar el permiso oficial.',
              ),
            );
          },
        });
    }
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    const respuesta =
      error as {
        error?: {
          message?: string;

          error?: {
            message?: string;
            details?: string[];
          };

          data?: {
            message?: string;
          };
        };

        message?: string;
      };

    const detalles =
      respuesta.error?.error
        ?.details;

    if (
      Array.isArray(detalles) &&
      detalles.length > 0
    ) {
      return detalles.join(', ');
    }

    return (
      respuesta.error?.error
        ?.message ??
      respuesta.error?.data
        ?.message ??
      respuesta.error?.message ??
      respuesta.message ??
      mensajePredeterminado
    );
  }

  /* =========================================================
     DATOS DE LAS TABLAS
     ========================================================= */

  primerRevision(
    solicitud: Solicitud,
  ): string {
    return (
      solicitud.pri_aporbacion ??
      (
        solicitud.mot_rechazo
          ? '----------------'
          : 'PENDIENTE'
      )
    );
  }

  segundaRevision(
    solicitud: Solicitud,
  ): string {
    return (
      solicitud.seg_aprobacion ??
      (
        solicitud.mot_rechazo
          ? '----------------'
          : 'PENDIENTE'
      )
    );
  }
}
