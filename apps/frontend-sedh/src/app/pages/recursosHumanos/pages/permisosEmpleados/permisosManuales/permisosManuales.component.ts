import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { environment } from '../../../../../../environments/environment';
type TipoPestana = 'personal' | 'oficial' | 'tardia';
type TipoPermisoExistente = 'personal' | 'oficial';
interface RespuestaApi<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  mensaje?: string;
}
interface EmpleadoActivo {
  emailInstitucional?: string;
  email?: string;
  nombreCompleto?: string;
  prinombre?: string;
  segnombre?: string;
  priapellido?: string;
  segapellido?: string;
}
interface DisponibilidadManual {
  horasDisponiblesMinutos?: number;
  disponibleSolicitarMinutos?: number;
  disponibleMesMinutos?: number;
  hordisponibles?: string;
  horasDisponibles?: string;
  minutosSaldo?: number;
  consumidoDiaMinutos?: number;
  consumidoMesMinutos?: number;
  [key: string]: unknown;
}
interface ResultadoPermiso {
  status?: string;
  message?: string;
  idPermiso?: string;
  idPermisoOficial?: string;
  emailEmpleado?: string;
  fecha?: string;
  fechaInicio?: string;
  fechaFinal?: string;
  horas?: string;
  diasLaborables?: number;
  esManual?: boolean;
  referenciaDocumento?: string | null;
}
interface ReportePersonal {
  idPermiso: string;
  emailInstitucional: string;
  fecha: string;
  horas: string;
  motivo: string;
  emergencia: boolean;
  referenciaDocumento: string | null;
  estado: string;
  empleado: string;
  fechaRegistro: string;
  registradoPor: string;
}
interface ReporteOficial {
  idPermiso: string;
  emailInstitucional: string;
  fechaInicio: string;
  fechaFinal: string;
  diasLaborables: number;
  motivo: string;
  referenciaDocumento: string | null;
  estado: string;
  empleado: string;
  fechaRegistro: string;
  registradoPor: string;
}
interface RespuestaReporte<T> {
  status: string;
  total: number;
  data: T[];
}

interface ReporteLlegadaTardia {
  idJustificacion: string;
  emailInstitucional: string;
  fechaLlegada: string;
  horaEntradaEstablecida: string;
  horaLlegadaReal: string;
  minutosRetraso: number;
  motivo: string;
  referenciaDocumento: string | null;
  estado: string;
  minutosDescontados: number;
  empleado: string;
  fechaRegistro?: string;
  registradoPor?: string;
}

@Component({
  selector: 'app-permisos-manuales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permisosManuales.component.html',
  styleUrls: ['./permisosManuales.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermisosManualesComponent {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl.replace(/\/+$/, '');
  readonly pestana = signal<TipoPestana>('personal');
  readonly enviando = signal(false);
  readonly mensajeExito = signal('');
  readonly mensajeError = signal('');
  readonly empleadosPersonal = signal<EmpleadoActivo[]>([]);
  readonly empleadosOficial = signal<EmpleadoActivo[]>([]);
  readonly buscandoPersonal = signal(false);
  readonly buscandoOficial = signal(false);
  readonly empleadoPersonalSeleccionado = signal<EmpleadoActivo | null>(null);
  readonly empleadoOficialSeleccionado = signal<EmpleadoActivo | null>(null);
  readonly errorBusquedaPersonal = signal('');
  readonly errorBusquedaOficial = signal('');
  readonly disponibilidadPersonal = signal<DisponibilidadManual | null>(null);
  readonly consultandoDisponibilidad = signal(false);
  readonly errorDisponibilidad = signal('');
  readonly personal = {
    emailEmpleado: '',
    fecha: new Date().toLocaleDateString('en-CA'),
    horas: '01:00',
    motivo: '',
    referenciaDocumento: '',
    emergencia: false,
    horaSalida: '',
    horaRegreso: '',
    observacion: '',
  };
  readonly oficial = {
    emailEmpleado: '',
    fechaInicio: new Date().toLocaleDateString('en-CA'),
    fechaFinal: new Date().toLocaleDateString('en-CA'),
    motivo: '',
    referenciaDocumento: '',
    horaSalida: '',
    horaRegreso: '',
    observacion: '',
  };
  // Estado y resultados de los reportes.
  readonly fechaInicioReporte = signal(new Date().toLocaleDateString('en-CA'));
  readonly fechaFinalReporte = signal(new Date().toLocaleDateString('en-CA'));
  readonly consultandoReportes = signal(false);
  readonly errorReporte = signal('');
  readonly mensajeReporte = signal('');
  readonly reportePersonal = signal<ReportePersonal[]>([]);
  readonly reporteOficial = signal<ReporteOficial[]>([]);
  readonly totalPersonal = signal(0);
  readonly totalOficial = signal(0);
  readonly empleadosTardia = signal<EmpleadoActivo[]>([]);
  readonly buscandoTardia = signal(false);
  readonly empleadoTardiaSeleccionado = signal<EmpleadoActivo | null>(null);
  readonly errorBusquedaTardia = signal('');
  readonly llegadasTardias = signal<ReporteLlegadaTardia[]>([]);
  readonly totalLlegadasTardias = signal(0);
  readonly consultandoLlegadasTardias = signal(false);
  readonly anulandoLlegadaTardia = signal<string | null>(null);

  readonly tardia = {
    emailEmpleado: '',
    fechaLlegada: new Date().toLocaleDateString('en-CA'),
    horaLlegadaReal: '',
    motivo: '',
    referenciaDocumento: '',
    horaSalida: '',
    horaRegreso: '',
    observacion: '',
  };

  buscarEmpleado(tipo: TipoPermisoExistente, termino: string): void {
    const texto = termino.trim();
    if (tipo === 'personal') {
      this.empleadoPersonalSeleccionado.set(null);
      this.disponibilidadPersonal.set(null);
      this.errorDisponibilidad.set('');
      this.errorBusquedaPersonal.set('');
      if (texto.length < 2) { this.empleadosPersonal.set([]); return; }
      this.buscandoPersonal.set(true);
      const params = new HttpParams().set('buscar', texto);
      this.http.get<any>(`${this.base}/rrhh/permisos-personales/buscar-empleados-activos`, { params })
        .pipe(finalize(() => this.buscandoPersonal.set(false)))
        .subscribe({
          next: (r) => this.empleadosPersonal.set(this.normalizarListaEmpleados(r)),
          error: (e) => { this.empleadosPersonal.set([]); this.errorBusquedaPersonal.set(this.obtenerMensajeError(e)); },
        });
      return;
    }
    this.empleadoOficialSeleccionado.set(null);
    this.errorBusquedaOficial.set('');
    if (texto.length < 2) { this.empleadosOficial.set([]); return; }
    this.buscandoOficial.set(true);
    const params = new HttpParams().set('buscar', texto);
    this.http.get<any>(`${this.base}/rrhh/permisos-personales/buscar-empleados-activos`, { params })
      .pipe(finalize(() => this.buscandoOficial.set(false)))
      .subscribe({
        next: (r) => this.empleadosOficial.set(this.normalizarListaEmpleados(r)),
        error: (e) => { this.empleadosOficial.set([]); this.errorBusquedaOficial.set(this.obtenerMensajeError(e)); },
      });
  }
  private normalizarListaEmpleados(respuesta: any): EmpleadoActivo[] {
    const lista = Array.isArray(respuesta) ? respuesta :
      Array.isArray(respuesta?.data) ? respuesta.data :
      Array.isArray(respuesta?.data?.data) ? respuesta.data.data : [];
    return lista.map((e: any) => ({
      ...e,
      emailInstitucional: e.emailInstitucional ?? e.emailinstitucional ?? e.email ?? '',
      nombreCompleto: e.nombreCompleto ?? e.nombrecompleto ??
        [e.prinombre ?? e.priNombre, e.segnombre ?? e.segNombre, e.priapellido ?? e.priApellido, e.segapellido ?? e.segApellido]
          .filter(Boolean).join(' '),
    })).filter((e: EmpleadoActivo) => !!e.emailInstitucional);
  }
  seleccionarEmpleado(tipo: TipoPermisoExistente, empleado: EmpleadoActivo): void {
    if (tipo === 'personal') {
      this.personal.emailEmpleado = empleado.emailInstitucional ?? '';
      this.empleadoPersonalSeleccionado.set(empleado);
      this.empleadosPersonal.set([]);
      this.consultarDisponibilidadPersonal();
    } else {
      this.oficial.emailEmpleado = empleado.emailInstitucional ?? '';
      this.empleadoOficialSeleccionado.set(empleado);
      this.empleadosOficial.set([]);
    }
  }
  consultarDisponibilidadPersonal(): void {
    const empleado = this.empleadoPersonalSeleccionado();
    if (!empleado?.emailInstitucional || !this.personal.fecha) {
      this.disponibilidadPersonal.set(null);
      return;
    }
    this.consultandoDisponibilidad.set(true);
    this.errorDisponibilidad.set('');
    const params = new HttpParams()
      .set('emailEmpleado', empleado.emailInstitucional)
      .set('fecha', this.personal.fecha);
    this.http.get<any>(`${this.base}/rrhh/permisos-personales/disponibilidad-manual`, { params })
      .pipe(finalize(() => this.consultandoDisponibilidad.set(false)))
      .subscribe({
        next: (respuesta) => {
          const d = respuesta?.data ?? respuesta;
          this.disponibilidadPersonal.set(d as DisponibilidadManual);
          if (this.minutosSaldoDisponible(d) <= 0) {
            this.errorDisponibilidad.set('El empleado no tiene horas disponibles para solicitar un permiso personal.');
          }
        },
        error: (error) => {
          this.disponibilidadPersonal.set(null);
          this.errorDisponibilidad.set(this.obtenerMensajeError(error));
        },
      });
  }
  private minutosDesdeHora(valor: unknown): number {
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    if (typeof valor !== 'string') return 0;
    const partes = valor.split(':');
    if (partes.length < 2) return Number(valor) || 0;
    return (Number(partes[0]) || 0) * 60 + (Number(partes[1]) || 0);
  }
private minutosSaldoDisponible(d: DisponibilidadManual | null): number {
  if (!d) return 0;
  // Saldo real del empleado en rrhh.horas_disponibles.
  if (typeof d.horasDisponiblesMinutos === 'number') {
    return d.horasDisponiblesMinutos;
  }
  if (typeof d.minutosSaldo === 'number') {
    return d.minutosSaldo;
  }
  return this.minutosDesdeHora(
    d.horasDisponibles ?? d.hordisponibles
  );
}
saldoPersonalTexto(): string {
  const d = this.disponibilidadPersonal();
  if (!d) {
    return 'Seleccione un empleado para consultar su saldo.';
  }
  const minutos = this.minutosSaldoDisponible(d);
  return `${Math.floor(minutos / 60)} h ${String(
    minutos % 60
  ).padStart(2, '0')} min disponibles`;
}
puedeRegistrarPersonal(): boolean {
  const seleccionado = this.empleadoPersonalSeleccionado();
  const d = this.disponibilidadPersonal();
  if (
    !seleccionado ||
    !d ||
    this.consultandoDisponibilidad() ||
    this.minutosSaldoDisponible(d) <= 0
  ) {
    return false;
  }
  // El registro debe respetar el máximo solicit able
  // calculado por el backend para ese día y ese mes.
  const maximoSolicitable =
    typeof d.disponibleSolicitarMinutos === 'number'
      ? d.disponibleSolicitarMinutos
      : this.minutosSaldoDisponible(d);
  return this.minutosDesdeHora(this.personal.horas) <= maximoSolicitable;
}
  cambiarPestana(tipo: TipoPestana): void {
    if (this.enviando()) return;
    this.pestana.set(tipo);
    this.limpiarMensajes();
    if (tipo === 'tardia') this.consultarReporteLlegadasTardias();
  }
  private limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }
  private obtenerMensajeError(error: any): string {
    const mensaje = error?.error?.message ?? error?.error?.mensaje ?? error?.message;
    if (Array.isArray(mensaje)) return mensaje.join('. ');
    return typeof mensaje === 'string'
      ? mensaje
      : 'No fue posible completar la operación. Verifique los datos e inténtelo nuevamente.';
  }
  private validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  private validarHoras(horas: string): boolean {
    const coincidencia = /^(\d{2}):([0-5]\d)$/.exec(horas);
    if (!coincidencia) return false;
    const minutos = Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
    return minutos > 0 && minutos <= 180;
  }
  registrarPersonal(form: NgForm): void {
    this.limpiarMensajes();
    const datos = {
      emailEmpleado: this.personal.emailEmpleado.trim(),
      fecha: this.personal.fecha,
      horas: this.personal.horas,
      motivo: this.personal.motivo.trim(),
      referenciaDocumento: this.personal.referenciaDocumento.trim(),
      emergencia: this.personal.emergencia,
      horaSalida: this.personal.horaSalida,
      horaRegreso: this.personal.horaRegreso,
      observacion: this.personal.observacion.trim(),
    };
    if (!form.valid) {
      this.mensajeError.set('Complete todos los campos obligatorios correctamente.');
      return;
    }
    if (!this.validarEmail(datos.emailEmpleado)) {
      this.mensajeError.set('Ingrese un correo institucional válido.');
      return;
    }
    if (!this.validarHoras(datos.horas)) {
      this.mensajeError.set('Las horas deben ser mayores que cero y no pueden superar las 3 horas diarias.');
      return;
    }
    if (datos.motivo.length > 200) {
      this.mensajeError.set('El motivo no puede superar los 200 caracteres.');
      return;
    }
    if (datos.referenciaDocumento.length > 100) {
      this.mensajeError.set('La referencia documental no puede superar los 100 caracteres.');
      return;
    }
    const body = {
      emailEmpleado: datos.emailEmpleado,
      fecha: datos.fecha,
      horas: datos.horas,
      motivo: datos.motivo,
      referenciaDocumento: datos.referenciaDocumento || undefined,
      emergencia: datos.emergencia,
      horaSalida: datos.horaSalida || undefined,
      horaRegreso: datos.horaRegreso || undefined,
      observacion: datos.observacion || undefined,
    };
    this.enviando.set(true);
    this.http.post<RespuestaApi<ResultadoPermiso>>(
      `${this.base}/rrhh/permisos-personales/registrar-manual`, body,
    ).pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (respuesta) => {
        this.mensajeExito.set(
          respuesta?.data?.message ?? respuesta?.message ?? 'Permiso personal manual registrado correctamente.',
        );
        this.personal.emailEmpleado = '';
        this.personal.fecha = new Date().toLocaleDateString('en-CA');
        this.personal.horas = '01:00';
        this.personal.motivo = '';
        this.personal.referenciaDocumento = '';
        this.personal.emergencia = false;
        this.personal.horaSalida = '';
        this.personal.horaRegreso = '';
        this.personal.observacion = '';
        form.resetForm();
      },
      error: (error) => this.mensajeError.set(this.obtenerMensajeError(error)),
    });
  }
  registrarOficial(form: NgForm): void {
    this.limpiarMensajes();
    const datos = {
      emailEmpleado: this.oficial.emailEmpleado.trim(),
      fechaInicio: this.oficial.fechaInicio,
      fechaFinal: this.oficial.fechaFinal,
      motivo: this.oficial.motivo.trim(),
      referenciaDocumento: this.oficial.referenciaDocumento.trim(),
      horaSalida: this.oficial.horaSalida,
      horaRegreso: this.oficial.horaRegreso,
      observacion: this.oficial.observacion.trim(),
    };
    if (!form.valid) {
      this.mensajeError.set('Complete todos los campos obligatorios correctamente.');
      return;
    }
    if (!this.validarEmail(datos.emailEmpleado)) {
      this.mensajeError.set('Ingrese un correo institucional válido.');
      return;
    }
    if (!this.empleadoOficialSeleccionado() || this.empleadoOficialSeleccionado()?.emailInstitucional?.toLowerCase() !== datos.emailEmpleado.toLowerCase()) {
      this.mensajeError.set('Busque y seleccione un empleado activo de la lista.');
      return;
    }
    if (!datos.fechaInicio || !datos.fechaFinal || datos.fechaFinal < datos.fechaInicio) {
      this.mensajeError.set('La fecha final debe ser igual o posterior a la fecha inicial.');
      return;
    }
    if (datos.motivo.length > 200) {
      this.mensajeError.set('El motivo no puede superar los 200 caracteres.');
      return;
    }
    if (datos.referenciaDocumento.length > 100) {
      this.mensajeError.set('La referencia documental no puede superar los 100 caracteres.');
      return;
    }
    const body = {
      emailEmpleado: datos.emailEmpleado,
      fechaInicio: datos.fechaInicio,
      fechaFinal: datos.fechaFinal,
      motivo: datos.motivo,
      referenciaDocumento: datos.referenciaDocumento || undefined,
      horaSalida: datos.horaSalida || undefined,
      horaRegreso: datos.horaRegreso || undefined,
      observacion: datos.observacion || undefined,
    };
    this.enviando.set(true);
    this.http.post<RespuestaApi<ResultadoPermiso>>(
      `${this.base}/rrhh/permisos-oficiales/registrar-manual`, body,
    ).pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (respuesta) => {
        const resultado = respuesta?.data;
        const mensaje = resultado?.message ?? respuesta?.message ?? 'Permiso oficial manual registrado correctamente.';
        const dias = resultado?.diasLaborables;
        this.mensajeExito.set(
          typeof dias === 'number' ? `${mensaje}. Días laborables calculados: ${dias}.` : mensaje,
        );
        this.oficial.emailEmpleado = '';
        this.oficial.fechaInicio = new Date().toLocaleDateString('en-CA');
        this.oficial.fechaFinal = new Date().toLocaleDateString('en-CA');
        this.oficial.motivo = '';
        this.oficial.referenciaDocumento = '';
        this.oficial.horaSalida = '';
        this.oficial.horaRegreso = '';
        this.oficial.observacion = '';
        form.resetForm();
      },
      error: (error) => this.mensajeError.set(this.obtenerMensajeError(error)),
    });
  }

  buscarEmpleadoTardia(termino: string): void {
    const texto = termino.trim();
    this.empleadoTardiaSeleccionado.set(null);
    this.tardia.emailEmpleado = texto;
    this.errorBusquedaTardia.set('');
    if (texto.length < 2) {
      this.empleadosTardia.set([]);
      this.buscandoTardia.set(false);
      return;
    }

    this.buscandoTardia.set(true);
    const params = new HttpParams().set('buscar', texto);
    this.http.get<any>(
      `${this.base}/rrhh/permisos-personales/buscar-empleados-activos`,
      { params },
    ).pipe(finalize(() => this.buscandoTardia.set(false))).subscribe({
      next: (respuesta) => this.empleadosTardia.set(this.normalizarListaEmpleados(respuesta)),
      error: (error) => {
        this.empleadosTardia.set([]);
        this.errorBusquedaTardia.set(this.obtenerMensajeError(error));
      },
    });
  }

  seleccionarEmpleadoTardia(empleado: EmpleadoActivo): void {
    this.tardia.emailEmpleado = empleado.emailInstitucional ?? '';
    this.empleadoTardiaSeleccionado.set(empleado);
    this.empleadosTardia.set([]);
    this.errorBusquedaTardia.set('');
  }

  registrarLlegadaTardia(form: NgForm): void {
    this.limpiarMensajes();
    const empleado = this.empleadoTardiaSeleccionado();
    if (!form.valid || !empleado?.emailInstitucional) {
      this.mensajeError.set('Busque y seleccione un empleado activo y complete los campos obligatorios.');
      return;
    }

    if (!this.tardia.fechaLlegada || !this.tardia.horaLlegadaReal) {
      this.mensajeError.set('Seleccione la fecha y la hora real de llegada.');
      return;
    }

    if (this.tardia.horaLlegadaReal <= '08:00') {
      this.mensajeError.set('Solo se pueden registrar llegadas posteriores a las 08:00 a. m.');
      return;
    }

    const motivo = this.tardia.motivo.trim();
    if (motivo.length < 3 || motivo.length > 1000) {
      this.mensajeError.set('El motivo debe contener entre 3 y 1000 caracteres.');
      return;
    }

    const body = {
      emailEmpleado: empleado.emailInstitucional,
      fechaLlegada: this.tardia.fechaLlegada,
      horaLlegadaReal: this.tardia.horaLlegadaReal,
      motivo,
      referenciaDocumento: this.tardia.referenciaDocumento.trim() || undefined,
      horaSalida: this.tardia.horaSalida || undefined,
      horaRegreso: this.tardia.horaRegreso || undefined,
      observacion: this.tardia.observacion.trim() || undefined,
    };

    this.enviando.set(true);
    this.http.post<RespuestaApi<any>>(
      `${this.base}/rrhh/permisos-personales/llegada-tardia`,
      body,
    ).pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: (respuesta) => {
        const data = respuesta?.data as any;
        this.mensajeExito.set(
          data?.message ?? respuesta?.message ?? respuesta?.mensaje ??
          'Justificación de llegada tardía registrada correctamente.',
        );
        this.tardia.emailEmpleado = '';
        this.tardia.fechaLlegada = new Date().toLocaleDateString('en-CA');
        this.tardia.horaLlegadaReal = '';
        this.tardia.motivo = '';
        this.tardia.referenciaDocumento = '';
        this.empleadoTardiaSeleccionado.set(null);
        this.empleadosTardia.set([]);
        this.tardia.horaSalida = '';
        this.tardia.horaRegreso = '';
        this.tardia.observacion = '';
        form.resetForm();
        this.consultarReporteLlegadasTardias();
      },
      error: (error) => this.mensajeError.set(this.obtenerMensajeError(error)),
    });
  }

  consultarReporteLlegadasTardias(): void {
    this.errorReporte.set('');
    this.mensajeReporte.set('');
    const fechaInicio = this.fechaInicioReporte();
    const fechaFinal = this.fechaFinalReporte();

    if (!fechaInicio || !fechaFinal) {
      this.errorReporte.set('Seleccione la fecha inicial y la fecha final.');
      return;
    }
    if (fechaInicio > fechaFinal) {
      this.errorReporte.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFinal', fechaFinal);

    this.consultandoLlegadasTardias.set(true);
    this.http.get<RespuestaReporte<ReporteLlegadaTardia>>(
      `${this.base}/rrhh/permisos-personales/llegadas-tardias`,
      { params },
    ).pipe(finalize(() => this.consultandoLlegadasTardias.set(false))).subscribe({
      next: (respuesta) => {
        const data = Array.isArray(respuesta?.data) ? respuesta.data : [];
        this.llegadasTardias.set(data);
        this.totalLlegadasTardias.set(respuesta?.total ?? data.length);
        this.mensajeReporte.set('Historial de llegadas tardías consultado correctamente.');
      },
      error: (error) => {
        this.llegadasTardias.set([]);
        this.totalLlegadasTardias.set(0);
        this.errorReporte.set(this.obtenerMensajeError(error));
      },
    });
  }

  anularLlegadaTardia(registro: ReporteLlegadaTardia): void {
    if (registro.estado !== 'APROBADO' || this.anulandoLlegadaTardia()) return;
    const confirmar = window.confirm(
      `¿Desea anular la justificación de ${registro.empleado || registro.emailInstitucional} del ${this.formatearFecha(registro.fechaLlegada)}? Se devolverán los minutos descontados.`,
    );
    if (!confirmar) return;

    this.anulandoLlegadaTardia.set(registro.idJustificacion);
    this.http.post<RespuestaApi<any>>(
      `${this.base}/rrhh/permisos-personales/llegada-tardia/anular/${registro.idJustificacion}`,
      {},
    ).pipe(finalize(() => this.anulandoLlegadaTardia.set(null))).subscribe({
      next: (respuesta) => {
        this.mensajeReporte.set(
          (respuesta?.data as any)?.message ?? respuesta?.message ??
          'Justificación anulada y minutos devueltos correctamente.',
        );
        this.consultarReporteLlegadasTardias();
      },
      error: (error) => this.errorReporte.set(this.obtenerMensajeError(error)),
    });
  }

  consultarReportes(): void {
    this.errorReporte.set('');
    this.mensajeReporte.set('');
    const fechaInicio = this.fechaInicioReporte();
    const fechaFinal = this.fechaFinalReporte();
    if (!fechaInicio || !fechaFinal) {
      this.errorReporte.set('Seleccione la fecha inicial y la fecha final.');
      return;
    }
    if (fechaInicio > fechaFinal) {
      this.errorReporte.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFinal', fechaFinal);
    const urlPersonal = `${this.base}/rrhh/permisos-personales/reporte-manual`;
    const urlOficial = `${this.base}/rrhh/permisos-oficiales/reporte-manual`;
    this.consultandoReportes.set(true);
    forkJoin({
      personal: this.http.get<RespuestaReporte<ReportePersonal>>(urlPersonal, { params }),
      oficial: this.http.get<RespuestaReporte<ReporteOficial>>(urlOficial, { params }),
    }).pipe(finalize(() => this.consultandoReportes.set(false))).subscribe({
      next: ({ personal, oficial }) => {
        this.reportePersonal.set(personal?.data ?? []);
        this.totalPersonal.set(personal?.total ?? personal?.data?.length ?? 0);
        this.reporteOficial.set(oficial?.data ?? []);
        this.totalOficial.set(oficial?.total ?? oficial?.data?.length ?? 0);
        this.mensajeReporte.set('Reportes consultados correctamente.');
      },
      error: (error) => {
        this.errorReporte.set(this.obtenerMensajeError(error));
      },
    });
  }
  exportarExcel(): void {
    if (this.reportePersonal().length === 0 && this.reporteOficial().length === 0) {
      this.errorReporte.set('No hay registros para exportar. Consulte primero un rango de fechas.');
      return;
    }
    const libro = XLSX.utils.book_new();
    const datosPersonales = this.reportePersonal().map((p) => ({
      Empleado: p.empleado ?? '',
      Correo: p.emailInstitucional ?? '',
      Fecha: this.formatearFecha(p.fecha),
      Horas: p.horas ?? '',
      Motivo: p.motivo ?? '',
      Emergencia: p.emergencia ? 'Sí' : 'No',
      Referencia: p.referenciaDocumento ?? '',
      Estado: p.estado ?? '',
      'Fecha de registro': this.formatearFecha(p.fechaRegistro),
      'Registrado por': p.registradoPor ?? '',
    }));
    const datosOficiales = this.reporteOficial().map((p) => ({
      Empleado: p.empleado ?? '',
      Correo: p.emailInstitucional ?? '',
      'Fecha inicial': this.formatearFecha(p.fechaInicio),
      'Fecha final': this.formatearFecha(p.fechaFinal),
      'Días laborables': p.diasLaborables ?? 0,
      Motivo: p.motivo ?? '',
      Referencia: p.referenciaDocumento ?? '',
      Estado: p.estado ?? '',
      'Fecha de registro': this.formatearFecha(p.fechaRegistro),
      'Registrado por': p.registradoPor ?? '',
    }));
    const hojaPersonal = XLSX.utils.json_to_sheet(datosPersonales);
    const hojaOficial = XLSX.utils.json_to_sheet(datosOficiales);
    hojaPersonal['!cols'] = [
      { wch: 28 }, { wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 36 },
      { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
    ];
    hojaOficial['!cols'] = [
      { wch: 28 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 36 }, { wch: 24 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(libro, hojaPersonal, 'Personales');
    XLSX.utils.book_append_sheet(libro, hojaOficial, 'Oficiales');
    XLSX.writeFile(
      libro,
      `Reporte_Permisos_Manuales${this.fechaInicioReporte()}${this.fechaFinalReporte()}.xlsx`,
    );
  }
  exportarPDF(): void {
    if (this.reportePersonal().length === 0 && this.reporteOficial().length === 0) {
      this.errorReporte.set('No hay registros para exportar. Consulte primero un rango de fechas.');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Reporte de permisos manuales', 14, 15);
    doc.setFontSize(10);
    doc.text(`Periodo: ${this.fechaInicioReporte()} al ${this.fechaFinalReporte()}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Permisos personales (${this.totalPersonal()})`, 14, 30);
    autoTable(doc, {
      startY: 34,
      head: [['Empleado', 'Correo', 'Fecha', 'Horas', 'Motivo', 'Emergencia', 'Referencia', 'Estado']],
      body: this.reportePersonal().map((p) => [
        p.empleado ?? '', p.emailInstitucional ?? '', this.formatearFecha(p.fecha),
        p.horas ?? '', p.motivo ?? '', p.emergencia ? 'Sí' : 'No',
        p.referenciaDocumento ?? '', p.estado ?? '',
      ]),
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    const ultimaTablaPersonal = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
    let posicionY = (ultimaTablaPersonal?.finalY ?? 34) + 12;
    if (posicionY > 175) {
      doc.addPage();
      posicionY = 20;
    }
    doc.setFontSize(12);
    doc.text(`Permisos oficiales (${this.totalOficial()})`, 14, posicionY);
    autoTable(doc, {
      startY: posicionY + 4,
      head: [['Empleado', 'Correo', 'Fecha inicial', 'Fecha final', 'Días', 'Motivo', 'Referencia', 'Estado']],
      body: this.reporteOficial().map((p) => [
        p.empleado ?? '', p.emailInstitucional ?? '', this.formatearFecha(p.fechaInicio),
        this.formatearFecha(p.fechaFinal), String(p.diasLaborables ?? 0),
        p.motivo ?? '', p.referenciaDocumento ?? '', p.estado ?? '',
      ]),
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    doc.save(`Reporte_Permisos_Manuales${this.fechaInicioReporte()}${this.fechaFinalReporte()}.pdf`);
  }
  formatearFecha(valor: string | null | undefined): string {
    if (!valor) return '';
    // Evita cambios de día por conversiones de zona horaria para valores YYYY-MM-DD.
    const fecha = valor.slice(0, 10);
    const partes = fecha.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : valor;
  }
}
