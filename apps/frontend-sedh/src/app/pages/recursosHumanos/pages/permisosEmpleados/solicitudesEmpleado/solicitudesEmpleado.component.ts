import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncabezadosPaginaComponent } from '../../../../../components/encabezadosPagina/encabezadosPagina.component';

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
export class SolicitudesEmpleadoComponent {
  // TODO: reemplazar con llamada al servicio real
  solicitudes = signal<Solicitud[]>([
    {
      fec_solicitud: '2026-04-10',
      nom_tipo_solicitud: 'Permiso personal',
      nom_estado: 'APROBADO',
      pri_aporbacion: 'JUAN PÉREZ',
      seg_aprobacion: 'MARÍA LÓPEZ',
      mot_rechazo: null
    },
    {
      fec_solicitud: '2026-04-22',
      nom_tipo_solicitud: 'Permiso médico',
      nom_estado: 'EN PROCESO',
      pri_aporbacion: null,
      seg_aprobacion: null,
      mot_rechazo: null
    },
    {
      fec_solicitud: '2026-05-01',
      nom_tipo_solicitud: 'Permiso sindical',
      nom_estado: 'RECHAZADO',
      pri_aporbacion: '----------------',
      seg_aprobacion: '----------------',
      mot_rechazo: 'Documentación incompleta'
    }
  ]);

  solicitudesEmergencia = signal<Solicitud[]>([
    {
      fec_solicitud: '2026-05-03',
      nom_tipo_solicitud: 'Emergencia familiar',
      nom_estado: 'EN PROCESO',
      pri_aporbacion: null,
      seg_aprobacion: null,
      mot_rechazo: null
    }
  ]);

  isActualizando = signal(false);
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
  modalAbierto = signal(false);
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
  // TODO: obtener del servicio real
  ppHorasDisponibles = signal(24);

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

  // ── Acciones modal ──
  abrirModal(): void {
    this.form.set({ nombreEmpleado: '', dependencia: '', cargo: '', tipoSolicitud: '' });
    this.ppFecha.set(hoyStr());
    this.ppHoras.set(3);
    this.ppMinutos.set(0);
    this.ppMotivo.set('Asunto Personal.');
    this.ppCitaMedica.set(0);
    this.poFecha.set(hoyStr());
    this.poMotivo.set('');
    this.modalAbierto.set(true);
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
    // TODO: conectar con servicio real
    if (this.form().tipoSolicitud === 'permiso-personal') {
      console.log('Permiso personal:', {
        ...this.form(),
        fecha: this.ppFecha(),
        tiempo: this.ppFormatHM(),
        motivo: this.ppMotivo(),
        citaMedica: this.ppCitaMedica()
      });
    }
    if (this.form().tipoSolicitud === 'permiso-oficial') {
      console.log('Permiso oficial:', {
        ...this.form(),
        fecha: this.poFecha(),
        motivo: this.poMotivo()
      });
    }
    this.cerrarModal();
  }

  primerRevision(s: Solicitud): string {
    return s.pri_aporbacion ?? (s.mot_rechazo ? '----------------' : 'PENDIENTE');
  }

  segundaRevision(s: Solicitud): string {
    return s.seg_aprobacion ?? (s.mot_rechazo ? '----------------' : 'PENDIENTE');
  }
}

