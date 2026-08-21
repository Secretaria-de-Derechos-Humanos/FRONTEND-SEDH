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
  CommonModule,
  isPlatformBrowser,
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  ActionButtonComponent,
} from '../../components/actionButton/actionButton.component';

import {
  EncabezadosPaginaComponent,
} from '../../components/encabezadosPagina/encabezadosPagina.component';

import {
  ModalAprobarPermisosRRHHComponent,
  RechazarPayload,
  SolicitudPermiso,
} from '../../components/modalAprobarPermisosRRHH/modalAprobarPermisosRRHH.component';

import {
  PendienteJefeInmediatoApi,
  PendientesService,
  ResponderPermisoParams,
} from './pendientes.service';

import {
  ToastService,
} from '../../services/toast.service';

import {
  AuthService,
} from '../../services/auth.service';


interface SolicitudPendiente {
  idPermiso: string;
  fechaSolicitud: Date;
  empleado: string;
  estado: string;
  dependencia: string;
  detalle: SolicitudPermiso;
}


@Component({
  selector: 'app-pendientes',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ActionButtonComponent,
    EncabezadosPaginaComponent,
    ModalAprobarPermisosRRHHComponent,
  ],

  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css'],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PendientesComponent
  implements OnInit {

  private readonly pendientesService =
    inject(PendientesService);

  private readonly toastService =
    inject(ToastService);

  private readonly authService =
    inject(AuthService);

  private readonly platformId =
    inject(PLATFORM_ID);


  /*
   * ==============================
   * DATOS
   * ==============================
   */

  readonly solicitudesOriginales =
    signal<SolicitudPendiente[]>([]);


  /*
   * ==============================
   * FILTROS
   * ==============================
   */

  readonly filtroFecha =
    signal('');

  readonly filtroEmpleado =
    signal('');

  readonly filtroEstado =
    signal('');

  readonly filtroDependencia =
    signal('');


  /*
   * ==============================
   * ESTADOS DE LA PANTALLA
   * ==============================
   */

  readonly cargando =
    signal(false);

  readonly procesando =
    signal(false);


  /*
   * ==============================
   * MODAL
   * ==============================
   */

  readonly modalPermisoVisible =
    signal(false);

  readonly solicitudSeleccionada =
    signal<SolicitudPermiso | null>(
      null,
    );


  /*
   * ==============================
   * ROL DEL USUARIO
   * ==============================
   *
   * 2 = Jefe inmediato
   * 3 = Subgerente RRHH
   * 5 = Administrador
   */

  readonly rolActual =
    computed(() => {

      const roles =
        this.authService
          .currentUser()
          ?.roles ?? [];

      const subgerente =
        roles.find(
          (acceso) =>
            Number(acceso.r) === 3,
        );

      if (subgerente) {
        return 3;
      }

      const jefe =
        roles.find(
          (acceso) =>
            Number(acceso.r) === 2,
        );

      if (jefe) {
        return 2;
      }

      const administrador =
        roles.find(
          (acceso) =>
            Number(acceso.r) === 5,
        );

      if (administrador) {
        return 5;
      }

      return 0;
    });


  /*
   * ==============================
   * LISTADO FILTRADO
   * ==============================
   */

  readonly solicitudes =
    computed(() => {

      const fecha =
        this.filtroFecha()
          .trim()
          .toLowerCase();

      const empleado =
        this.filtroEmpleado()
          .trim()
          .toLowerCase();

      const estado =
        this.filtroEstado()
          .trim()
          .toLowerCase();

      const dependencia =
        this.filtroDependencia()
          .trim()
          .toLowerCase();


      return this.solicitudesOriginales()
        .filter(
          (solicitud) => {

            const fechaTexto =
              this.formatearFecha(
                solicitud.fechaSolicitud,
              ).toLowerCase();

            return (
              fechaTexto.includes(
                fecha,
              ) &&

              solicitud.empleado
                .toLowerCase()
                .includes(
                  empleado,
                ) &&

              solicitud.estado
                .toLowerCase()
                .includes(
                  estado,
                ) &&

              solicitud.dependencia
                .toLowerCase()
                .includes(
                  dependencia,
                )
            );
          },
        );
    });


  /*
   * ==============================
   * INICIO
   * ==============================
   */

  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId,
      )
    ) {

      this.cargarPendientes();

    }
  }


  /*
   * ==============================
   * CARGAR SOLICITUDES
   * ==============================
   */

  cargarPendientes(): void {

    if (
      this.cargando()
    ) {
      return;
    }


    this.cargando.set(
      true,
    );


    const rol =
      this.rolActual();


    /*
     * Subgerente RRHH
     */
    const peticion$ =
      rol === 3
        ? this.pendientesService
            .getPendientesSubgerente()

        : this.pendientesService
            .getPendientesJefeInmediato();


    peticion$
      .subscribe({

        next: (
          pendientes,
        ) => {

          this.solicitudesOriginales
            .set(
              this.mapPendientesApiToTable(
                pendientes,
              ),
            );

          this.cargando.set(
            false,
          );
        },


        error: (
          error,
        ) => {

          console.error(
            'Error al cargar solicitudes pendientes:',
            error,
          );


          this.solicitudesOriginales
            .set(
              [],
            );


          this.toastService
            .mostrar(
              'error',

              this.obtenerMensajeError(
                error,
                'No fue posible cargar las solicitudes pendientes.',
              ),
            );


          this.cargando.set(
            false,
          );
        },
      });
  }


  /*
   * ==============================
   * MODAL
   * ==============================
   */

  abrirModalPermiso(
    solicitud:
      SolicitudPermiso,
  ): void {

    this.solicitudSeleccionada
      .set(
        solicitud,
      );

    this.modalPermisoVisible
      .set(
        true,
      );
  }


  cerrarModalPermiso(): void {

    this.modalPermisoVisible
      .set(
        false,
      );

    this.solicitudSeleccionada
      .set(
        null,
      );
  }


  /*
   * ==============================
   * VER DETALLE
   * ==============================
   */

  verDetalles(
    idPermiso: string,
  ): void {

    const solicitud =
      this.solicitudesOriginales()
        .find(
          (item) =>
            item.idPermiso ===
            idPermiso,
        );


    if (!solicitud) {

      this.toastService
        .mostrar(
          'error',
          'No se encontró la solicitud seleccionada.',
        );

      return;
    }


    this.abrirModalPermiso(
      solicitud.detalle,
    );
  }


  /*
   * ==============================
   * APROBAR
   * ==============================
   */

  aprobarSolicitud(
    idPermiso: string,
  ): void {

    if (
      this.procesando()
    ) {
      return;
    }


    const solicitud =
      this.solicitudesOriginales()
        .find(
          (item) =>
            item.idPermiso ===
            idPermiso,
        );


    if (!solicitud) {

      this.toastService
        .mostrar(
          'error',
          'No se encontró la solicitud seleccionada.',
        );

      return;
    }


    const detalle =
      solicitud.detalle;


    const tipo =
      detalle.nom_tipo_solicitud ??
      `PERMISO ${detalle.tipoSolicitud}`;


    const params:
      ResponderPermisoParams = {

        idpermiso:
          idPermiso,

        tipo,

        motRechazo:
          null,
      };


    this.procesando.set(
      true,
    );


    /*
     * Subgerente usa su endpoint.
     *
     * Jefe inmediato y administrador
     * utilizan el endpoint de jefe
     * según la lógica actual del proyecto.
     */
    const peticion$ =
      this.rolActual() === 3

        ? this.pendientesService
            .responderPermisoSubgerente(
              params,
            )

        : this.pendientesService
            .responderPermiso(
              params,
            );


    peticion$
      .subscribe({

        next: (
          resultado,
        ) => {

          this.toastService
            .mostrar(
              'exito',
              resultado,
            );


          this.cerrarModalPermiso();

          this.procesando.set(
            false,
          );

          this.cargarPendientes();
        },


        error: (
          error,
        ) => {

          console.error(
            'Error al aprobar solicitud:',
            error,
          );


          this.toastService
            .mostrar(
              'error',

              this.obtenerMensajeError(
                error,
                'No fue posible aprobar la solicitud.',
              ),
            );


          this.procesando.set(
            false,
          );
        },
      });
  }


  /*
   * ==============================
   * RECHAZAR
   * ==============================
   */

  rechazarSolicitud(
    payload:
      RechazarPayload,
  ): void {

    if (
      this.procesando()
    ) {
      return;
    }


    const solicitud =
      this.solicitudesOriginales()
        .find(
          (item) =>
            item.idPermiso ===
            payload.id,
        );


    if (!solicitud) {

      this.toastService
        .mostrar(
          'error',
          'No se encontró la solicitud seleccionada.',
        );

      return;
    }


    const detalle =
      solicitud.detalle;


    const tipo =
      detalle.nom_tipo_solicitud ??
      `PERMISO ${detalle.tipoSolicitud}`;


    const params:
      ResponderPermisoParams = {

        idpermiso:
          payload.id,

        tipo,

        motRechazo:
          payload.motRechazo,
      };


    /*
     * Para permiso PERSONAL
     * se envían las horas.
     */
    if (
      detalle.tipoSolicitud ===
      'PERSONAL'
    ) {

      params.horas =
        this.normalizarHoras(
          detalle.hor_solicitadas,
        );
    }


    this.procesando.set(
      true,
    );


    const peticion$ =
      this.rolActual() === 3

        ? this.pendientesService
            .responderPermisoSubgerente(
              params,
            )

        : this.pendientesService
            .responderPermiso(
              params,
            );


    peticion$
      .subscribe({

        next: (
          resultado,
        ) => {

          this.toastService
            .mostrar(
              'exito',
              resultado,
            );


          this.cerrarModalPermiso();

          this.procesando.set(
            false,
          );

          this.cargarPendientes();
        },


        error: (
          error,
        ) => {

          console.error(
            'Error al rechazar solicitud:',
            error,
          );


          this.toastService
            .mostrar(
              'error',

              this.obtenerMensajeError(
                error,
                'No fue posible rechazar la solicitud.',
              ),
            );


          this.procesando.set(
            false,
          );
        },
      });
  }


  /*
   * ==============================
   * BOTONES DE ACCIÓN
   * ==============================
   */

  handleAction(
    action: string,
    idPermiso: string,
  ): void {

    switch (
      action
    ) {

      /*
       * Ver
       */
      case 'view':

        this.verDetalles(
          idPermiso,
        );

        break;


      /*
       * Abrimos el modal también para
       * realizar la aprobación desde ahí.
       */
      case 'edit':

        this.verDetalles(
          idPermiso,
        );

        break;


      /*
       * Abrimos detalle para que el usuario
       * confirme rechazo y escriba motivo.
       */
      case 'delete':

        this.verDetalles(
          idPermiso,
        );

        break;


      default:

        this.verDetalles(
          idPermiso,
        );
    }
  }


  /*
   * ==============================
   * FECHA
   * ==============================
   */

  formatearFecha(
    fecha: Date,
  ): string {

    return new Date(
      fecha,
    ).toLocaleDateString(
      'es-HN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }


  /*
   * ==============================
   * MAPEAR RESPUESTA API
   * ==============================
   */

  private mapPendientesApiToTable(
    pendientes:
      PendienteJefeInmediatoApi[],
  ): SolicitudPendiente[] {

    return pendientes
      .map(
        (
          pendiente,
        ): SolicitudPendiente => {

          const empleado =
            this.construirNombreCompleto(
              pendiente,
            );


          const fechaSolicitud =
            this.crearFechaLocal(
              pendiente.fecha,
            );


          const detalle:
            SolicitudPermiso = {

              id:
                pendiente.idpermiso,

              id_permiso:
                pendiente.idpermiso,

              empleado,

              pri_nombre:
                pendiente
                  .empleado
                  .nombre,

              seg_nombre:
                pendiente
                  .empleado
                  .segundoNombre ??
                '',

              pri_apellido:
                pendiente
                  .empleado
                  .apellido,

              seg_apellido:
                pendiente
                  .empleado
                  .segundoApellido ??
                '',

              tipoSolicitud:
                pendiente
                  .tipoPermiso,

              nom_tipo_solicitud:
                pendiente.tipo,

              dependencia:
                pendiente
                  .dependencia,

              nom_dependencia:
                pendiente
                  .dependencia,

              fechaSolicitud,

              fec_solicitud:
                fechaSolicitud,

              nom_cargo:
                pendiente.cargo,

              hor_solicitadas:
                pendiente
                  .horasSolicitadas ??
                null,

              motivo:
                pendiente.motivo,

              cat_emergencia:
                pendiente
                  .emergencia ??
                null,

              nom_estado:
                pendiente.estado,

              mot_rechazo:
                pendiente
                  .motRechazo,
            };


          return {

            idPermiso:
              pendiente
                .idpermiso,

            fechaSolicitud,

            empleado,

            estado:
              pendiente.estado,

            dependencia:
              pendiente
                .dependencia,

            detalle,
          };
        },
      )
      .sort(
        (
          a,
          b,
        ) =>
          b.fechaSolicitud
            .getTime() -
          a.fechaSolicitud
            .getTime(),
      );
  }


  /*
   * ==============================
   * NOMBRE COMPLETO
   * ==============================
   */

  private construirNombreCompleto(
    pendiente:
      PendienteJefeInmediatoApi,
  ): string {

    return [
      pendiente.empleado.nombre,

      pendiente
        .empleado
        .segundoNombre,

      pendiente
        .empleado
        .apellido,

      pendiente
        .empleado
        .segundoApellido,
    ]
      .filter(
        Boolean,
      )
      .join(
        ' ',
      );
  }


  /*
   * ==============================
   * FECHA LOCAL
   * ==============================
   */

  private crearFechaLocal(
    fecha: string,
  ): Date {

    const fechaLimpia =
      fecha.substring(
        0,
        10,
      );

    return new Date(
      `${fechaLimpia}T00:00:00`,
    );
  }


  /*
   * ==============================
   * NORMALIZAR HORAS
   * ==============================
   */

  private normalizarHoras(
    horas:
      | string
      | null
      | undefined,
  ): string | null {

    if (!horas) {
      return null;
    }


    const valor =
      horas.trim();


    /*
     * HH:mm:ss
     */
    if (
      /^\d{2}:\d{2}:\d{2}$/
        .test(
          valor,
        )
    ) {

      return valor;
    }


    /*
     * HH:mm
     */
    if (
      /^\d{2}:\d{2}$/
        .test(
          valor,
        )
    ) {

      return `${valor}:00`;
    }


    const [
      hora = '00',
      minuto = '00',
      segundo = '00',
    ] =
      valor.split(
        ':',
      );


    return [
      hora.padStart(
        2,
        '0',
      ),

      minuto.padStart(
        2,
        '0',
      ),

      segundo.padStart(
        2,
        '0',
      ),
    ].join(
      ':',
    );
  }


  /*
   * ==============================
   * ERROR API
   * ==============================
   */

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string,
  ): string {

    const mensaje =
      error?.error
        ?.error
        ?.message ??

      error?.error
        ?.message ??

      error?.message;


    if (
      Array.isArray(
        mensaje,
      )
    ) {

      return mensaje.join(
        ', ',
      );
    }


    return (
      mensaje ??
      mensajePredeterminado
    );
  }
}
