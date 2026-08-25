import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  computed,
  inject,
  PLATFORM_ID
} from '@angular/core';

import {
  DatePipe,
  isPlatformBrowser
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  forkJoin,
  of
} from 'rxjs';

import {
  catchError
} from 'rxjs/operators';

import {
  EncabezadosPaginaComponent
} from '../../../../../components/encabezadosPagina/encabezadosPagina.component';

import {
  SolicitudesEmpleadoService,
  DatosPermiso,
  InsertarPermisoPersonalBody,
  InsertarPermisoOficialBody
} from './solicitudesEmpleado.service';

import {
  VacacionesApiService,
  SolicitudVacaciones
} from '../../../../../core/services/vacaciones-api';


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

  idPermiso: string;

  fec_solicitud: string;

  nom_tipo_solicitud: string;

  nom_estado:
    | 'EN PROCESO'
    | 'APROBADO'
    | 'RECHAZADO'
    | 'ANULADO';

  pri_aporbacion: string | null;

  seg_aprobacion: string | null;

  mot_rechazo: string | null;

}


// ─────────────────────────────────────────────────────────────────────────────
// FECHAS
// ─────────────────────────────────────────────────────────────────────────────

function hoyStr(): string {

  return new Date().toLocaleDateString('en-CA');

}


function maxFechaStr(): string {

  const d = new Date();

  d.setDate(d.getDate() + 7);

  return d.toLocaleDateString('en-CA');

}


function maxFechaOficialStr(): string {

  const d = new Date();

  d.setDate(d.getDate() + 14);

  return d.toLocaleDateString('en-CA');

}


// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

@Component({

  selector: 'app-solicitudes-empleado',

  standalone: true,

  imports: [
    DatePipe,
    FormsModule,
    EncabezadosPaginaComponent
  ],

  templateUrl:
    './solicitudesEmpleado.component.html',

  styleUrls: [
    './solicitudesEmpleado.component.css'
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush

})
export class SolicitudesEmpleadoComponent
  implements OnInit {


  private readonly solicitudesService =
    inject(SolicitudesEmpleadoService);

  private readonly vacacionesApi =
    inject(VacacionesApiService);


  private readonly platformId =
    inject(PLATFORM_ID);


  // ───────────────────────────────────────────────────────────────────────────
  // SOLICITUDES
  // ───────────────────────────────────────────────────────────────────────────

  solicitudes =
    signal<Solicitud[]>([]);


  solicitudesEmergencia =
    signal<Solicitud[]>([]);

  solicitudesVacaciones =
    signal<SolicitudVacaciones[]>([]);

  isAnulandoVacaciones =
    signal(false);

  idVacacionAnulando =
    signal<string | null>(null);


  isActualizando =
    signal(true);


  errorMessage =
    signal('');


  // ───────────────────────────────────────────────────────────────────────────
  // ANULACIÓN
  // ───────────────────────────────────────────────────────────────────────────

  isAnulando =
    signal(false);


  idPermisoAnulando =
    signal<string | null>(null);


  mensajeAnulacion =
    signal('');


  errorAnulacion =
    signal('');


  // ───────────────────────────────────────────────────────────────────────────
  // FILTROS
  // ───────────────────────────────────────────────────────────────────────────

  filtroFecha =
    signal('');

  filtroTipo =
    signal('');

  filtroEstado =
    signal('');


  filtroFechaE =
    signal('');

  filtroTipoE =
    signal('');

  filtroEstadoE =
    signal('');


  solicitudesFiltradas =
    computed(() => {

      const f =
        this.filtroFecha()
          .toLowerCase();

      const t =
        this.filtroTipo()
          .toLowerCase();

      const e =
        this.filtroEstado()
          .toLowerCase();


      return this.solicitudes()
        .filter(s =>

          (f
            ? s.fec_solicitud
                .includes(f)
            : true
          )

          &&

          (t
            ? s.nom_tipo_solicitud
                .toLowerCase()
                .includes(t)
            : true
          )

          &&

          (e
            ? s.nom_estado
                .toLowerCase()
                .includes(e)
            : true
          )

        );

    });


  solicitudesEmergenciaFiltradas =
    computed(() => {

      const f =
        this.filtroFechaE()
          .toLowerCase();

      const t =
        this.filtroTipoE()
          .toLowerCase();

      const e =
        this.filtroEstadoE()
          .toLowerCase();


      return this.solicitudesEmergencia()
        .filter(s =>

          (f
            ? s.fec_solicitud
                .includes(f)
            : true
          )

          &&

          (t
            ? s.nom_tipo_solicitud
                .toLowerCase()
                .includes(t)
            : true
          )

          &&

          (e
            ? s.nom_estado
                .toLowerCase()
                .includes(e)
            : true
          )

        );

    });


  readonly badgeClass =
    'badge';


  // ───────────────────────────────────────────────────────────────────────────
  // MODAL
  // ───────────────────────────────────────────────────────────────────────────

  modalAbierto =
    signal(false);


  cargandoModal =
    signal(false);


  isEnviando =
    signal(false);


  form =
    signal<NuevaSolicitudForm>({

      nombreEmpleado: '',

      dependencia: '',

      cargo: '',

      tipoSolicitud: ''

    });


  // ───────────────────────────────────────────────────────────────────────────
  // PERMISO PERSONAL
  // ───────────────────────────────────────────────────────────────────────────

  readonly ppFechaMin =
    hoyStr();


  readonly ppFechaMax =
    maxFechaStr();


  ppFecha =
    signal(hoyStr());


  ppHoras =
    signal(3);


  ppMinutos =
    signal(0);


  ppMotivo =
    signal('Asunto Personal.');


  ppCitaMedica =
    signal(0);


  ppHorasDisponibles =
    signal<string>('--:--');


  ppErrores =
    computed(() => ({

      fecha:
        !this.ppFecha()

        ||

        this.ppFecha()
          < this.ppFechaMin

        ||

        this.ppFecha()
          > this.ppFechaMax,


      horas:
        this.ppHoras() < 0
        ||
        this.ppHoras() > 9,


      minutos:
        this.ppMinutos() < 0
        ||
        this.ppMinutos() > 59,


      motivo:
        !this.ppMotivo().trim()

    }));


  ppFormInvalido =
    computed(() =>

      Object
        .values(this.ppErrores())
        .some(Boolean)

      ||

      (
        this.ppCitaMedica() !== 0
        &&
        this.ppCitaMedica() !== 1
      )

    );


  ppFormatHM =
    computed(() => {

      const h =
        String(this.ppHoras())
          .padStart(2, '0');


      const m =
        String(this.ppMinutos())
          .padStart(2, '0');


      return `${h}:${m}`;

    });


  // ───────────────────────────────────────────────────────────────────────────
  // PERMISO OFICIAL
  // ───────────────────────────────────────────────────────────────────────────

  readonly poFechaMin =
    hoyStr();


  readonly poFechaMax =
    maxFechaOficialStr();


  poFecha =
    signal(hoyStr());


  poMotivo =
    signal('');


  poErrores =
    computed(() => ({

      fecha:
        !this.poFecha()

        ||

        this.poFecha()
          < this.poFechaMin

        ||

        this.poFecha()
          > this.poFechaMax,


      motivo:
        !this.poMotivo().trim()

    }));


  poFormInvalido =
    computed(() =>

      Object
        .values(this.poErrores())
        .some(Boolean)

    );


  // ───────────────────────────────────────────────────────────────────────────
  // INICIO
  // ───────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {

    if (
      isPlatformBrowser(
        this.platformId
      )
    ) {

      this.cargarDatos();

    }

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ACTUALIZAR
  // ───────────────────────────────────────────────────────────────────────────

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
            catchError(() => of(null))
          ),


      emergencias:
        this.solicitudesService
          .getMisSolicitudesEmergencia()
          .pipe(
            catchError(() => of(null))
          ),

      vacaciones:
        this.vacacionesApi
          .obtenerMisSolicitudes()
          .pipe(
            catchError(() => of(null))
          )

    })

      .subscribe(
        ({
          solicitudes,
          emergencias,
          vacaciones
        }) => {

          if (
            solicitudes === null
            &&
            emergencias === null
            &&
            vacaciones === null
          ) {

            this.errorMessage.set(
              'No fue posible cargar las solicitudes. Intente de nuevo más tarde.'
            );

          }


          this.solicitudes.set(
            solicitudes ?? []
          );


          this.solicitudesEmergencia.set(
            emergencias ?? []
          );

          this.solicitudesVacaciones.set(
            vacaciones ?? []
          );


          this.isActualizando.set(false);

        }
      );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // MODAL
  // ───────────────────────────────────────────────────────────────────────────

  private resetModal(
    datos?: DatosPermiso
  ): void {

    this.form.set({

      nombreEmpleado:
        datos?.nombre ?? '',

      dependencia:
        datos?.dependencia ?? '',

      cargo:
        datos?.cargo ?? '',

      tipoSolicitud:
        ''

    });


    this.ppFecha.set(
      hoyStr()
    );


    this.ppHoras.set(3);

    this.ppMinutos.set(0);

    this.ppMotivo.set(
      'Asunto Personal.'
    );

    this.ppCitaMedica.set(0);

    this.ppHorasDisponibles.set(
      datos?.horasDisponibles
      ?? '--:--'
    );


    this.poFecha.set(
      hoyStr()
    );

    this.poMotivo.set('');

  }


  abrirModal(): void {

    this.cargandoModal.set(true);


    this.solicitudesService
      .getDatosPermiso()
      .subscribe({

        next: (datos) => {

          this.resetModal(datos);

          this.cargandoModal.set(false);

          this.modalAbierto.set(true);

        },


        error: () => {

          this.resetModal();

          this.cargandoModal.set(false);

          this.modalAbierto.set(true);

        }

      });

  }


  cerrarModal(): void {

    this.modalAbierto.set(false);

  }


  onTipoChange(
    tipo: string
  ): void {

    this.form.update(
      f => ({

        ...f,

        tipoSolicitud:
          tipo as TipoSolicitud | ''

      })
    );

  }


  onCampoChange(
    campo: keyof NuevaSolicitudForm,
    valor: string
  ): void {

    this.form.update(
      f => ({

        ...f,

        [campo]: valor

      })
    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ENVIAR
  // ───────────────────────────────────────────────────────────────────────────

  enviarSolicitud(): void {


    // PERSONAL

    if (
      this.form().tipoSolicitud
      ===
      'permiso-personal'
    ) {

      const body:
        InsertarPermisoPersonalBody = {

        fecha:
          this.ppFecha(),

        horas:
          this.ppFormatHM(),

        motivo:
          this.ppMotivo(),

        emergencia:
          this.ppCitaMedica() === 1

      };


      this.isEnviando.set(true);


      this.solicitudesService
        .insertarPermisoPersonal(body)
        .subscribe({

          next: () => {

            this.isEnviando.set(false);

            this.cerrarModal();

            this.cargarDatos();

          },


          error: (error) => {

            console.error(
              'Error al registrar permiso personal:',
              error
            );

            this.isEnviando.set(false);

          }

        });


      return;

    }


    // OFICIAL

    if (
      this.form().tipoSolicitud
      ===
      'permiso-oficial'
    ) {

      const body:
        InsertarPermisoOficialBody = {

        fecha:
          this.poFecha(),

        motivo:
          this.poMotivo()

      };


      this.isEnviando.set(true);


      this.solicitudesService
        .insertarPermisoOficial(body)
        .subscribe({

          next: () => {

            this.isEnviando.set(false);

            this.cerrarModal();

            this.cargarDatos();

          },


          error: (error) => {

            console.error(
              'Error al registrar permiso oficial:',
              error
            );

            this.isEnviando.set(false);

          }

        });


      return;

    }

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ¿PUEDE ANULAR?
  // ───────────────────────────────────────────────────────────────────────────

  puedeAnular(
    solicitud: Solicitud
  ): boolean {

    return (

      !!solicitud.idPermiso

      &&

      (
        solicitud.nom_estado
        === 'EN PROCESO'

        ||

        solicitud.nom_estado
        === 'APROBADO'
      )

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ¿SE ESTÁ ANULANDO?
  // ───────────────────────────────────────────────────────────────────────────

  estaAnulando(
    solicitud: Solicitud
  ): boolean {

    return (

      this.isAnulando()

      &&

      this.idPermisoAnulando()
      ===
      solicitud.idPermiso

    );

  }


  // ───────────────────────────────────────────────────────────────────────────
  // ANULAR SOLICITUD
  // ───────────────────────────────────────────────────────────────────────────

  anularSolicitud(
    solicitud: Solicitud
  ): void {

    if (
      !this.puedeAnular(solicitud)
    ) {

      return;

    }


    if (
      this.isAnulando()
    ) {

      return;

    }


    const confirmado =
      window.confirm(
        `¿Está seguro de que desea anular este ${this.obtenerTipoPermiso(solicitud)}?`
      );


    if (!confirmado) {

      return;

    }


    this.errorAnulacion.set('');

    this.mensajeAnulacion.set('');

    this.isAnulando.set(true);

    this.idPermisoAnulando.set(
      solicitud.idPermiso
    );


    const tipo =
      solicitud.nom_tipo_solicitud
        .trim()
        .toLowerCase();


    // PERSONAL

    if (
      tipo.includes('permiso personal')
    ) {

      this.solicitudesService
        .anularPermisoPersonal(
          solicitud.idPermiso
        )
        .subscribe({

          next: (respuesta) => {

            this.isAnulando.set(false);

            this.idPermisoAnulando.set(null);


            this.mensajeAnulacion.set(

              respuesta.message
              ??
              respuesta.mensaje
              ??
              'Permiso personal anulado correctamente.'

            );


            this.cargarDatos();

          },


          error: (error) => {

            console.error(
              'Error al anular permiso personal:',
              error
            );


            this.isAnulando.set(false);

            this.idPermisoAnulando.set(null);


            this.errorAnulacion.set(

              error?.error?.message
              ??
              error?.error?.mensaje
              ??
              'No fue posible anular el permiso personal.'

            );

          }

        });


      return;

    }


    // OFICIAL

    if (
      tipo.includes('permiso oficial')
    ) {

      this.solicitudesService
        .anularPermisoOficial(
          solicitud.idPermiso
        )
        .subscribe({

          next: (respuesta) => {

            this.isAnulando.set(false);

            this.idPermisoAnulando.set(null);


            this.mensajeAnulacion.set(

              respuesta.message
              ??
              respuesta.mensaje
              ??
              'Permiso oficial anulado correctamente.'

            );


            this.cargarDatos();

          },


          error: (error) => {

            console.error(
              'Error al anular permiso oficial:',
              error
            );


            this.isAnulando.set(false);

            this.idPermisoAnulando.set(null);


            this.errorAnulacion.set(

              error?.error?.message
              ??
              error?.error?.mensaje
              ??
              'No fue posible anular el permiso oficial.'

            );

          }

        });


      return;

    }


    this.isAnulando.set(false);

    this.idPermisoAnulando.set(null);


    this.errorAnulacion.set(
      'No se reconoce el tipo de permiso.'
    );

  }


  private obtenerTipoPermiso(
    solicitud: Solicitud
  ): string {

    const tipo =
      solicitud.nom_tipo_solicitud
        .toLowerCase();


    if (
      tipo.includes('permiso personal')
    ) {

      return 'permiso personal';

    }


    if (
      tipo.includes('permiso oficial')
    ) {

      return 'permiso oficial';

    }


    return 'permiso';

  }


  // ───────────────────────────────────────────────────────────────────────────
  // VACACIONES
  // ───────────────────────────────────────────────────────────────────────────

  puedeAnularVacaciones(
    solicitud: SolicitudVacaciones
  ): boolean {

    const id =
      solicitud.idVacaciones ??
      solicitud.idVacacion;

    if (!id) {
      return false;
    }

    const estado =
      solicitud.estadoSolicitud?.nomEstado ??
      solicitud.estadoSolicitud?.nomestado ??
      '';

    if (
      estado !== 'EN PROCESO' &&
      estado !== 'APROBADO'
    ) {
      return false;
    }

    // La solicitud solo puede anularse antes de que inicie el período.
    const fechaInicio =
      new Date(`${solicitud.fecInicial}T00:00:00`);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fechaInicio > hoy;
  }


  estaAnulandoVacaciones(
    solicitud: SolicitudVacaciones
  ): boolean {

    const id =
      solicitud.idVacaciones ??
      solicitud.idVacacion;

    return (
      this.isAnulandoVacaciones() &&
      !!id &&
      this.idVacacionAnulando() === id
    );
  }


  anularVacaciones(
    solicitud: SolicitudVacaciones
  ): void {

    if (!this.puedeAnularVacaciones(solicitud)) {
      return;
    }

    if (this.isAnulandoVacaciones()) {
      return;
    }

    const id =
      solicitud.idVacaciones ??
      solicitud.idVacacion;

    if (!id) {
      return;
    }

    if (
      !window.confirm(
        '¿Está seguro de que desea anular esta solicitud de vacaciones?'
      )
    ) {
      return;
    }

    this.errorAnulacion.set('');
    this.mensajeAnulacion.set('');
    this.isAnulandoVacaciones.set(true);
    this.idVacacionAnulando.set(id);

    this.vacacionesApi
      .anularVacaciones(id)
      .subscribe({

        next: (respuesta: any) => {

          this.isAnulandoVacaciones.set(false);
          this.idVacacionAnulando.set(null);

          this.mensajeAnulacion.set(
            respuesta?.message ??
            respuesta?.mensaje ??
            'Solicitud de vacaciones anulada correctamente.'
          );

          this.cargarDatos();
        },

        error: (error) => {

          console.error(
            'Error al anular vacaciones:',
            error
          );

          this.isAnulandoVacaciones.set(false);
          this.idVacacionAnulando.set(null);

          this.errorAnulacion.set(
            error?.error?.message ??
            error?.error?.mensaje ??
            'No fue posible anular la solicitud de vacaciones.'
          );
        }

      });
  }


  nombreEstadoVacaciones(
    solicitud: SolicitudVacaciones
  ): string {

    return (
      solicitud.estadoSolicitud?.nomEstado ??
      solicitud.estadoSolicitud?.nomestado ??
      'SIN ESTADO'
    );
  }


  // ───────────────────────────────────────────────────────────────────────────
  // REVISIONES
  // ───────────────────────────────────────────────────────────────────────────

  primerRevision(
    s: Solicitud
  ): string {

    return (

      s.pri_aporbacion

      ??

      (
        s.mot_rechazo
          ? '----------------'
          : 'PENDIENTE'
      )

    );

  }


  segundaRevision(
    s: Solicitud
  ): string {

    return (

      s.seg_aprobacion

      ??

      (
        s.mot_rechazo
          ? '----------------'
          : 'PENDIENTE'
      )

    );

  }

}
