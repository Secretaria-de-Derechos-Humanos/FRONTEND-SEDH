import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EncabezadosPaginaComponent } from '../../../../components/encabezadosPagina/encabezadosPagina.component';
import {
  DepGroup,
  RegistroPermiso,
  ReportePermisosService,
} from './reportePermisos.service';

interface PdfConAutoTable {
  lastAutoTable?: {
    finalY: number;
  };
}

@Component({
  selector: 'app-reporte-permisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EncabezadosPaginaComponent,
  ],
  templateUrl: './reportePermisos.component.html',
  styleUrls: ['./reportePermisos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportePermisosComponent implements OnInit {
  private readonly reporteService =
    inject(ReportePermisosService);

  dependencias = signal<DepGroup[]>([]);
  depSeleccionada = signal<DepGroup | null>(null);
  modalAbierto = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);
  buscado = signal(false);
  exportando = signal(false);

  mesBusqueda = new Date().getMonth() + 1;
  anioBusqueda = new Date().getFullYear();

  readonly anios: number[] = [2025, 2026];

  readonly nombresMeses: string[] = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  registrosSeleccionados = computed(
    () => this.depSeleccionada()?.registros ?? [],
  );

  hayDatos = computed(
    () => this.dependencias().length > 0,
  );

  ngOnInit(): void {
    this.buscarPorMes();
  }

  abrirModal(dependencia: DepGroup): void {
    this.depSeleccionada.set(dependencia);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.depSeleccionada.set(null);
  }

  buscarPorMes(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.dependencias.set([]);
    this.buscado.set(false);

    this.reporteService
      .getReportePorMes(
        Number(this.mesBusqueda),
        Number(this.anioBusqueda),
        1,
      )
      .subscribe({
        next: (grupos) => {
          this.dependencias.set(grupos);
          this.cargando.set(false);
          this.buscado.set(true);
        },
        error: (error) => {
          console.error(
            'Error al obtener reporte:',
            error,
          );

          console.error(
            'Respuesta del backend:',
            error?.error,
          );

          const detalles = error?.error?.error?.details;

          let mensaje =
            error?.error?.error?.message ??
            error?.error?.message ??
            'No fue posible obtener el reporte. Intente de nuevo más tarde.';

          if (
            Array.isArray(detalles) &&
            detalles.length > 0
          ) {
            mensaje = detalles.join(', ');
          }

          this.error.set(mensaje);
          this.cargando.set(false);
          this.buscado.set(true);
        },
      });
  }

  async exportarExcel(): Promise<void> {
    if (!this.hayDatos()) {
      return;
    }

    this.exportando.set(true);

    try {
      const { utils, writeFile } =
        await import('xlsx');

      const encabezados = [
        'Dependencia',
        'Empleado',
        'Fecha',
        'Tipo de permiso',
        'Hora salida',
        'Hora retorno',
        'Tiempo de permiso',
        'Horas disponibles',
      ];

      const filas: (string | number)[][] = [
        encabezados,
      ];

      for (const dependencia of this.dependencias()) {
        for (const registro of dependencia.registros) {
          filas.push([
            registro.dependencia,
            registro.empleado,
            this.formatearFecha(registro.fecha),
            registro.tipo,
            registro.horaSalida,
            registro.horaRetorno,
            this.formatearHorasPermiso(
              registro.horasPermiso,
            ),
            registro.horasDisponibles ?? '',
          ]);
        }
      }

      const hoja = utils.aoa_to_sheet(filas);

      hoja['!cols'] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 14 },
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 20 },
      ];

      const libro = utils.book_new();

      utils.book_append_sheet(
        libro,
        hoja,
        'Permisos',
      );

      const nombreArchivo =
        `reporte-permisos-${this.mesBusqueda}-${this.anioBusqueda}.xlsx`;

      writeFile(libro, nombreArchivo);
    } catch (error) {
      console.error(
        'Error al exportar Excel:',
        error,
      );

      this.error.set(
        'No fue posible generar el archivo de Excel.',
      );
    } finally {
      this.exportando.set(false);
    }
  }

  async exportarPDF(): Promise<void> {
    if (!this.hayDatos()) {
      return;
    }

    this.exportando.set(true);

    try {
      const { default: jsPDF } =
        await import('jspdf');

      const { default: autoTable } =
        await import('jspdf-autotable');

      const documento = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const mesTitulo =
        this.nombresMeses[this.mesBusqueda - 1];

      documento.setFontSize(14);
      documento.setFont('helvetica', 'bold');
      documento.setTextColor(38, 77, 160);

      documento.text(
        `Reporte de permisos — ${mesTitulo} ${this.anioBusqueda}`,
        14,
        18,
      );

      documento.setFontSize(9);
      documento.setFont('helvetica', 'normal');
      documento.setTextColor(120, 120, 120);

      documento.text(
        `Generado el ${this.formatearFecha(
          new Date().toISOString().split('T')[0],
        )}`,
        14,
        24,
      );

      let currentY = 30;

      for (const dependencia of this.dependencias()) {
        const porEmpleado = new Map<
          string,
          RegistroPermiso[]
        >();

        for (const registro of dependencia.registros) {
          const registrosEmpleado =
            porEmpleado.get(registro.empleado);

          if (registrosEmpleado) {
            registrosEmpleado.push(registro);
          } else {
            porEmpleado.set(
              registro.empleado,
              [registro],
            );
          }
        }

        const body: string[][] = [];

        for (const [empleado, registros] of porEmpleado) {
          registros.forEach((registro, indice) => {
            body.push([
              indice === 0 ? empleado : '',
              this.formatearFecha(registro.fecha),
              registro.tipo,
              registro.horaSalida,
              registro.horaRetorno,
              this.formatearHorasPermiso(
                registro.horasPermiso,
              ),
              registro.horasDisponibles ?? '',
            ]);
          });
        }

        autoTable(documento, {
          startY: currentY,
          head: [
            [
              {
                content: dependencia.dependencia,
                colSpan: 7,
                styles: {
                  fillColor: [38, 77, 160],
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  fontSize: 10,
                },
              },
            ],
            [
              'Empleado',
              'Fecha',
              'Tipo de permiso',
              'Hora salida',
              'Hora retorno',
              'Tiempo de permiso',
              'Horas disponibles',
            ],
          ],
          body,
          theme: 'striped',
          headStyles: {
            fillColor: [230, 235, 245],
            textColor: [38, 77, 160],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
          },
          alternateRowStyles: {
            fillColor: [247, 249, 252],
          },
          columnStyles: {
            0: { cellWidth: 44 },
            1: { cellWidth: 22 },
            2: { cellWidth: 42 },
            3: { cellWidth: 22 },
            4: { cellWidth: 22 },
            5: { cellWidth: 26 },
            6: { cellWidth: 26 },
          },
          margin: {
            left: 14,
            right: 14,
          },
          didParseCell: (data) => {
            if (
              data.section === 'head' &&
              data.row.index === 0
            ) {
              data.cell.styles.fillColor = [
                38,
                77,
                160,
              ];

              data.cell.styles.textColor = [
                255,
                255,
                255,
              ];
            }
          },
        });

        const pdfConTabla =
          documento as typeof documento &
            PdfConAutoTable;

        currentY =
          (pdfConTabla.lastAutoTable?.finalY ??
            currentY) + 8;
      }

      const nombreArchivo =
        `reporte-permisos-${this.mesBusqueda}-${this.anioBusqueda}.pdf`;

      documento.save(nombreArchivo);
    } catch (error) {
      console.error(
        'Error al exportar PDF:',
        error,
      );

      this.error.set(
        'No fue posible generar el archivo PDF.',
      );
    } finally {
      this.exportando.set(false);
    }
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) {
      return '';
    }

    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }

  private formatearHorasPermiso(
    valor: string,
  ): string {
    if (!valor) {
      return '';
    }
    const match = valor.match(
      /([\d.]+)h\s*([\d.]+)m/,
    );

    if (!match) {
      return valor;
    }
    const horas = Math.round(
      Number.parseFloat(match[1]),
    );
    const minutos = Math.round(
      Number.parseFloat(match[2]),
    );
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}m`;
    }
    if (horas > 0) {
      return `${horas}h`;
    }
    if (minutos > 0) {
      return `${minutos}m`;
    }

    return valor;
  }
}
