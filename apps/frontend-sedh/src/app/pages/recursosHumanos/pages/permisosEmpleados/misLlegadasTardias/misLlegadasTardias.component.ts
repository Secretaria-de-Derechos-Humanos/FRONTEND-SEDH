
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../services/auth.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LlegadaTardia {
  idJustificacion: string;
  emailInstitucional: string;
  fechaLlegada: string;
  horaEntradaEstablecida: string;
  horaLlegadaReal: string;
  minutosRetraso: number;
  motivo: string;
  referenciaDocumento?: string | null;
  horaSalida?: string | null;
  horaRegreso?: string | null;
  observacion?: string | null;
  estado: string;
  minutosDescontados: number;
  horasDisponibles?: string | null;
  fechaRegistro?: string;
}

interface RespuestaReporte {
  status?: string;
  total?: number;
  data?: LlegadaTardia[];
}

interface RespuestaApi<T> {
  success?: boolean;
  data?: T;
  message?: string;
  mensaje?: string;
}

@Component({
  selector: 'app-mis-llegadas-tardias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './misLlegadasTardias.component.html',
  styleUrls: ['./misLlegadasTardias.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisLlegadasTardiasComponent {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly base = environment.apiBaseUrl.replace(/\/+$/, '');

  readonly usuario = this.authService.currentUser;

  readonly enviando = signal(false);
  readonly consultando = signal(false);
  readonly mensajeExito = signal('');
  readonly mensajeError = signal('');
  readonly errorReporte = signal('');

  readonly llegadas = signal<LlegadaTardia[]>([]);
  readonly total = signal(0);

  private fechaLocal(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  readonly fechaInicio = signal(
    `${this.fechaLocal().substring(0, 7)}-01`,
  );

  readonly fechaFinal = signal(this.fechaLocal());

  readonly formulario = {
    fechaLlegada: this.fechaLocal(),
    horaLlegadaReal: '',
    motivo: '',
    referenciaDocumento: '',
    horaSalida: '',
    horaRegreso: '',
    observacion: '',
  };

  constructor() {
    this.consultarMisLlegadasTardias();
  }

  registrarLlegadaTardia(form: NgForm): void {
    this.limpiarMensajes();

    if (!this.usuario()?.email) {
      this.mensajeError.set(
        'No se pudo identificar al usuario autenticado. Inicie sesión nuevamente.',
      );
      return;
    }

    if (!form.valid) {
      this.mensajeError.set(
        'Complete todos los campos obligatorios.',
      );
      return;
    }

    if (!this.formulario.fechaLlegada || !this.formulario.horaLlegadaReal) {
      this.mensajeError.set(
        'Seleccione la fecha y la hora real de llegada.',
      );
      return;
    }

    if (this.formulario.horaLlegadaReal <= '08:00') {
      this.mensajeError.set(
        'Solo se pueden registrar llegadas posteriores a las 08:00 a. m.',
      );
      return;
    }

    const motivo = this.formulario.motivo.trim();

    if (motivo.length < 3 || motivo.length > 1000) {
      this.mensajeError.set(
        'El motivo debe contener entre 3 y 1000 caracteres.',
      );
      return;
    }

    const body = {
      fechaLlegada: this.formulario.fechaLlegada,
      horaLlegadaReal: this.formulario.horaLlegadaReal,
      motivo,
      referenciaDocumento:
        this.formulario.referenciaDocumento.trim() || undefined,
      horaSalida: this.formulario.horaSalida || undefined,
      horaRegreso: this.formulario.horaRegreso || undefined,
      observacion:
        this.formulario.observacion.trim() || undefined,
    };

    this.enviando.set(true);

    this.http.post<RespuestaApi<any>>(
      `${this.base}/rrhh/permisos-personales/llegada-tardia/propia`,
      body,
    ).pipe(
      finalize(() => this.enviando.set(false)),
    ).subscribe({
      next: (respuesta) => {
        const data = respuesta?.data as any;

        this.mensajeExito.set(
          data?.message ??
          respuesta?.message ??
          respuesta?.mensaje ??
          'Tu justificación de llegada tardía fue registrada correctamente.',
        );

        this.formulario.fechaLlegada = this.fechaLocal();
        this.formulario.horaLlegadaReal = '';
        this.formulario.motivo = '';
        this.formulario.referenciaDocumento = '';
        this.formulario.horaSalida = '';
        this.formulario.horaRegreso = '';
        this.formulario.observacion = '';

        form.resetForm(this.formulario);

        this.consultarMisLlegadasTardias();
      },
      error: (error) => {
        this.mensajeError.set(
          this.obtenerMensajeError(error),
        );
      },
    });
  }

  consultarMisLlegadasTardias(): void {
    this.errorReporte.set('');

    const inicio = this.fechaInicio();
    const final = this.fechaFinal();

    if (!inicio || !final) {
      this.errorReporte.set(
        'Seleccione la fecha inicial y la fecha final.',
      );
      return;
    }

    if (inicio > final) {
      this.errorReporte.set(
        'La fecha inicial no puede ser posterior a la fecha final.',
      );
      return;
    }

    const params = new HttpParams()
      .set('fechaInicio', inicio)
      .set('fechaFinal', final);

    this.consultando.set(true);

    this.http.get<RespuestaApi<RespuestaReporte>>(
      `${this.base}/rrhh/permisos-personales/llegadas-tardias/propias`,
      { params },
    ).pipe(
      finalize(() => this.consultando.set(false)),
    ).subscribe({
      next: (respuesta) => {
        const reporte = respuesta?.data;
        const data = Array.isArray(reporte?.data)
          ? reporte.data
          : [];

        this.llegadas.set(data);
        this.total.set(reporte?.total ?? data.length);
      },
      error: (error) => {
        this.llegadas.set([]);
        this.total.set(0);
        this.errorReporte.set(
          this.obtenerMensajeError(error),
        );
      },
    });
  }

  limpiarMensajes(): void {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '—';

    const partes = fecha.substring(0, 10).split('-');

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private obtenerMensajeError(error: any): string {
    return (
      error?.error?.message ??
      error?.error?.mensaje ??
      error?.message ??
      'Ocurrió un error al procesar la solicitud.'
    );
  }
    exportarExcel(): void {
    const registros = this.llegadas();

    if (!registros.length) {
      this.errorReporte.set(
        'No hay registros para exportar en el período seleccionado.',
      );
      return;
    }

    const nombreEmpleado = [
      this.usuario()?.nombre ?? '',
      this.usuario()?.apellido ?? '',
    ].join(' ').trim();

    const datos = registros.map((registro) => ({
      Empleado: nombreEmpleado,
      Correo: this.usuario()?.email ?? '',
      Fecha: this.formatearFecha(registro.fechaLlegada),
      'Entrada establecida': registro.horaEntradaEstablecida,
      'Hora de llegada': registro.horaLlegadaReal,
      'Minutos de retraso': registro.minutosRetraso,
      'Minutos descontados': registro.minutosDescontados,
      'Saldo disponible': registro.horasDisponibles ?? '',
      Motivo: registro.motivo,
      'Referencia del documento': registro.referenciaDocumento ?? '',
      'Hora de salida': registro.horaSalida ?? '',
      'Hora de regreso': registro.horaRegreso ?? '',
      Observaciones: registro.observacion ?? '',
      Estado: registro.estado,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);

    hoja['!cols'] = [
      { wch: 25 },
      { wch: 30 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 45 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 35 },
      { wch: 16 },
    ];

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      libro,
      hoja,
      'Mis llegadas tardías',
    );

    XLSX.writeFile(
      libro,
      `Mis_llegadas_tardias_${this.fechaInicio()}_${this.fechaFinal()}.xlsx`,
    );
  }

  exportarPDF(): void {
    const registros = this.llegadas();

    if (!registros.length) {
      this.errorReporte.set(
        'No hay registros para exportar en el período seleccionado.',
      );
      return;
    }

    const nombreEmpleado = [
      this.usuario()?.nombre ?? '',
      this.usuario()?.apellido ?? '',
    ].join(' ').trim();

    const correo = this.usuario()?.email ?? '';

    const documento = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    documento.setFontSize(16);
    documento.text('Historial de llegadas tardías', 14, 15);

    documento.setFontSize(10);
    documento.text(`Empleado: ${nombreEmpleado}`, 14, 23);
    documento.text(`Correo: ${correo}`, 14, 29);
    documento.text(
      `Período: ${this.formatearFecha(this.fechaInicio())} al ${this.formatearFecha(this.fechaFinal())}`,
      14,
      35,
    );
    documento.text(`Total de registros: ${registros.length}`, 14, 41);

    autoTable(documento, {
      startY: 47,
      head: [[
        'Fecha',
        'Entrada',
        'Llegada',
        'Retraso',
        'Descontado',
        'Saldo',
        'Motivo',
        'Estado',
      ]],
      body: registros.map((registro) => [
        this.formatearFecha(registro.fechaLlegada),
        registro.horaEntradaEstablecida ?? '',
        registro.horaLlegadaReal ?? '',
        `${registro.minutosRetraso} min`,
        `${registro.minutosDescontados} min`,
        registro.horasDisponibles ?? '—',
        registro.motivo ?? '',
        registro.estado ?? '',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [37, 74, 122],
      },
      columnStyles: {
        6: { cellWidth: 75 },
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    documento.save(
      `Mis_llegadas_tardias_${this.fechaInicio()}_${this.fechaFinal()}.pdf`,
    );
  }
}
