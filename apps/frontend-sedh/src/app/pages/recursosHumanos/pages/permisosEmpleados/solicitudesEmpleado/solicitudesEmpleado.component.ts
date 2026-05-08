import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EncabezadosPaginaComponent } from '../../../../../components/encabezadosPagina/encabezadosPagina.component';
import { SolicitudesEmpleadoService } from './solicitudesEmpleado.service';
import { DatosPermiso, InsertarPermisoPersonalBody, InsertarPermisoOficialBody } from './solicitudesEmpleado.service';

export type TipoSolicitud = 'permiso-personal' | 'permiso-oficial';

export interface NuevaSolicitudForm {
  nombreEmpleado: string;
  dependencia: string;
  cargo: string;
  tipoSolicitud: TipoSolicitud | '';
}

export interface Solicitud {
  fec_solicitud: string;
  nom_tipo_solicitud: string;
  nom_estado: 'EN PROCESO' | 'APROBADO' | 'RECHAZADO';
  pri_aporbacion: string | null;
  seg_aprobacion: string | null;
  mot_rechazo: string | null;
}

// Helpers de fecha (zona horaria Honduras UTC-6)
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

@Component({
  selector: 'app-solicitudes-empleado',
  standalone: true,
  imports: [DatePipe, FormsModule, EncabezadosPaginaComponent],
  templateUrl: './solicitudesEmpleado.component.html',
  styleUrls: ['./solicitudesEmpleado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudesEmpleadoComponent implements OnInit {
  private readonly solicitudesService = inject(SolicitudesEmpleadoService);
  private readonly platformId          = inject(PLATFORM_ID);

  solicitudes          = signal<Solicitud[]>([]);
  solicitudesEmergencia = signal<Solicitud[]>([]);

  isActualizando = signal(true);
  errorMessage   = signal('');

  // — Filtros tabla normal —
  filtroFecha  = signal('');
  filtroTipo   = signal('');
  filtroEstado = signal('');

  // — Filtros tabla emergencia —
  filtroFechaE  = signal('');
  filtroTipoE   = signal('');
  filtroEstadoE = signal('');

  solicitudesFiltradas = computed(() => {
    const f = this.filtroFecha().toLowerCase();
    const t = this.filtroTipo().toLowerCase();
    const e = this.filtroEstado().toLowerCase();
    return this.solicitudes().filter(s =>
      (f ? s.fec_solicitud.includes(f) : true) &&
      (t ? s.nom_tipo_solicitud.toLowerCase().includes(t) : true) &&
      (e ? s.nom_estado.toLowerCase().includes(e) : true)
    );
  });

  solicitudesEmergenciaFiltradas = computed(() => {
    const f = this.filtroFechaE().toLowerCase();
    const t = this.filtroTipoE().toLowerCase();
    const e = this.filtroEstadoE().toLowerCase();
    return this.solicitudesEmergencia().filter(s =>
      (f ? s.fec_solicitud.includes(f) : true) &&
      (t ? s.nom_tipo_solicitud.toLowerCase().includes(t) : true) &&
      (e ? s.nom_estado.toLowerCase().includes(e) : true)
    );
  });

  readonly badgeClass = 'badge';

  // ── Modal ──
  modalAbierto   = signal(false);
  cargandoModal  = signal(false);
  isEnviando     = signal(false);
  form = signal<NuevaSolicitudForm>({
    nombreEmpleado: '',
    dependencia: '',
    cargo: '',
    tipoSolicitud: ''
  });

  // ── Estado permiso personal ──
  readonly ppFechaMin = hoyStr();
  readonly ppFechaMax = maxFechaStr();

  ppFecha      = signal(hoyStr());
  ppHoras      = signal(3);
  ppMinutos    = signal(0);
  ppMotivo     = signal('Asunto Personal.');
  ppCitaMedica = signal(0);
  ppHorasDisponibles = signal<string>('--:--');

  ppErrores = computed(() => ({
    fecha:   !this.ppFecha() ||
             this.ppFecha() < this.ppFechaMin ||
             this.ppFecha() > this.ppFechaMax,
    horas:   this.ppHoras() < 0 || this.ppHoras() > 9,
    minutos: this.ppMinutos() < 0 || this.ppMinutos() > 59,
    motivo:  !this.ppMotivo().trim()
  }));

  ppFormInvalido = computed(() =>
    Object.values(this.ppErrores()).some(Boolean) ||
    (this.ppCitaMedica() !== 0 && this.ppCitaMedica() !== 1)
  );

  ppFormatHM = computed(() => {
    const h = String(this.ppHoras()).padStart(2, '0');
    const m = String(this.ppMinutos()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // ── Estado permiso oficial ──
  readonly poFechaMin = hoyStr();
  readonly poFechaMax = maxFechaOficialStr();

  poFecha  = signal(hoyStr());
  poMotivo = signal('');

  poErrores = computed(() => ({
    fecha:  !this.poFecha() ||
            this.poFecha() < this.poFechaMin ||
            this.poFecha() > this.poFechaMax,
    motivo: !this.poMotivo().trim()
  }));

  poFormInvalido = computed(() =>
    Object.values(this.poErrores()).some(Boolean)
  );

  // ── Carga de datos ──
  ngOnInit(): void {
    // Solo carga en el browser: evita mismatch de hidratación SSR
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatos();
    }
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.isActualizando.set(true);
    this.errorMessage.set('');
    forkJoin({
      solicitudes: this.solicitudesService.getMisSolicitudes().pipe(
        catchError(() => of(null))
      ),
      emergencias: this.solicitudesService.getMisSolicitudesEmergencia().pipe(
        catchError(() => of(null))
      )
    }).subscribe(({ solicitudes, emergencias }) => {
      if (solicitudes === null && emergencias === null) {
        this.errorMessage.set('No fue posible cargar las solicitudes. Intente de nuevo más tarde.');
      }
      this.solicitudes.set(solicitudes ?? []);
      this.solicitudesEmergencia.set(emergencias ?? []);
      this.isActualizando.set(false);
    });
  }

  // ── Acciones modal ──
  private resetModal(datos?: DatosPermiso): void {
    this.form.set({
      nombreEmpleado: datos?.nombre      ?? '',
      dependencia:    datos?.dependencia ?? '',
      cargo:          datos?.cargo       ?? '',
      tipoSolicitud:  ''
    });
    this.ppFecha.set(hoyStr());
    this.ppHoras.set(3);
    this.ppMinutos.set(0);
    this.ppMotivo.set('Asunto Personal.');
    this.ppCitaMedica.set(0);
    this.ppHorasDisponibles.set(datos?.horasDisponibles ?? '--:--');
    this.poFecha.set(hoyStr());
    this.poMotivo.set('');
  }

  abrirModal(): void {
    this.cargandoModal.set(true);

    this.solicitudesService.getDatosPermiso().subscribe({
      next: (datos: DatosPermiso) => {
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

  onTipoChange(tipo: string): void {
    this.form.update(f => ({ ...f, tipoSolicitud: tipo as TipoSolicitud | '' }));
  }

  onCampoChange(campo: keyof NuevaSolicitudForm, valor: string): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
  }

  enviarSolicitud(): void {
    if (this.form().tipoSolicitud === 'permiso-personal') {
      const body: InsertarPermisoPersonalBody = {
        fecha:      this.ppFecha(),
        horas:      this.ppFormatHM(),
        motivo:     this.ppMotivo(),
        emergencia: this.ppCitaMedica() === 1
      };
      this.isEnviando.set(true);
      this.solicitudesService.insertarPermisoPersonal(body).subscribe({
        next: () => {
          this.isEnviando.set(false);
          this.cerrarModal();
          this.cargarDatos();
        },
        error: () => {
          this.isEnviando.set(false);
        }
      });
      return;
    }
    if (this.form().tipoSolicitud === 'permiso-oficial') {
      const body: InsertarPermisoOficialBody = {
        fecha:  this.poFecha(),
        motivo: this.poMotivo()
      };
      this.isEnviando.set(true);
      this.solicitudesService.insertarPermisoOficial(body).subscribe({
        next: () => {
          this.isEnviando.set(false);
          this.cerrarModal();
          this.cargarDatos();
        },
        error: () => {
          this.isEnviando.set(false);
        }
      });
      return;
    }
  }

  primerRevision(s: Solicitud): string {
    return s.pri_aporbacion ?? (s.mot_rechazo ? '----------------' : 'PENDIENTE');
  }

  segundaRevision(s: Solicitud): string {
    return s.seg_aprobacion ?? (s.mot_rechazo ? '----------------' : 'PENDIENTE');
  }
}

