import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncabezadosPaginaComponent } from '../../../../components/encabezadosPagina/encabezadosPagina.component';
import { ReportePermisosService, DepGroup, RegistroPermiso } from './reportePermisos.service';

@Component({
  selector: 'app-reporte-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, EncabezadosPaginaComponent],
  templateUrl: './reportePermisos.component.html',
  styleUrls: ['./reportePermisos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportePermisosComponent implements OnInit {
  private readonly reporteService = inject(ReportePermisosService);

  dependencias    = signal<DepGroup[]>([]);
  depSeleccionada = signal<DepGroup | null>(null);
  modalAbierto    = signal(false);
  cargando        = signal(false);
  error           = signal<string | null>(null);
  buscado         = signal(false);
  exportando      = signal(false);

  mesBusqueda  = new Date().getMonth() + 1;
  anioBusqueda = new Date().getFullYear();

  readonly anios: number[] = [2025, 2026];
  readonly nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  registrosSeleccionados = computed(() => this.depSeleccionada()?.registros ?? []);
  hayDatos               = computed(() => this.dependencias().length > 0);

  ngOnInit(): void {
    this.buscarPorMes();
  }

  abrirModal(dep: DepGroup): void {
    this.depSeleccionada.set(dep);
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

    this.reporteService.getReportePorMes(this.mesBusqueda, this.anioBusqueda).subscribe({
      next: (grupos) => {
        this.dependencias.set(grupos);
        this.cargando.set(false);
        this.buscado.set(true);
      },
      error: () => {
        this.error.set('No fue posible obtener el reporte. Intente de nuevo más tarde.');
        this.cargando.set(false);
        this.buscado.set(true);
      }
    });
  }

  async exportarExcel(): Promise<void> {
    if (!this.hayDatos()) return;
    this.exportando.set(true);

    try {
      const { utils, writeFile } = await import('xlsx');

      const encabezados = [
        'Dependencia', 'Empleado', 'Fecha', 'Tipo de permiso',
        'Hora salida', 'Hora retorno', 'Tiempo de permiso', 'Horas disponibles'
      ];

      const filas: (string | number)[][] = [encabezados];

      for (const dep of this.dependencias()) {
        for (const reg of dep.registros) {
          filas.push([
            reg.dependencia,
            reg.empleado,
            this.formatearFecha(reg.fecha),
            reg.tipo,
            reg.horaSalida,
            reg.horaRetorno,
            this.formatearHorasPermiso(reg.horasPermiso),
            reg.horasDisponibles
          ]);
        }
      }

      const ws = utils.aoa_to_sheet(filas);

      // Ancho de columnas
      ws['!cols'] = [
        { wch: 35 }, { wch: 25 }, { wch: 14 }, { wch: 22 },
        { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 16 }
      ];

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Permisos');

      const nombreArchivo = `reporte-permisos-${this.mesBusqueda}-${this.anioBusqueda}.xlsx`;
      writeFile(wb, nombreArchivo);
    } finally {
      this.exportando.set(false);
    }
  }

  async exportarPDF(): Promise<void> {
    if (!this.hayDatos()) return;
    this.exportando.set(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const mesTitulo = this.nombresMeses[this.mesBusqueda - 1];

      // ── Título ──────────────────────────────────────────────────────────
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(38, 77, 160);
      doc.text(`Reporte de permisos — ${mesTitulo} ${this.anioBusqueda}`, 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(`Generado el ${this.formatearFecha(new Date().toISOString().split('T')[0])}`, 14, 24);

      let currentY = 30;

      // ── Tabla por dependencia ────────────────────────────────────────────
      for (const dep of this.dependencias()) {
        // Agrupar por empleado
        const porEmpleado = new Map<string, RegistroPermiso[]>();
        for (const reg of dep.registros) {
          if (!porEmpleado.has(reg.empleado)) porEmpleado.set(reg.empleado, []);
          porEmpleado.get(reg.empleado)!.push(reg);
        }

        // Filas: empleado solo en primera fila del grupo
        const body: string[][] = [];
        for (const [empleado, regs] of porEmpleado) {
          regs.forEach((reg, i) => {
            body.push([
              i === 0 ? empleado : '',
              this.formatearFecha(reg.fecha),
              reg.tipo,
              reg.horaSalida,
              reg.horaRetorno,
              this.formatearHorasPermiso(reg.horasPermiso),
              reg.horasDisponibles
            ]);
          });
        }

        autoTable(doc, {
          startY: currentY,
          head: [[
            { content: dep.dependencia, colSpan: 7, styles: { fillColor: [38, 77, 160], fontStyle: 'bold', fontSize: 10 } }
          ], [
            'Empleado', 'Fecha', 'Tipo de permiso', 'Hora salida', 'Hora retorno', 'Tiempo de permiso', 'Horas disponibles'
          ]],
          body,
          theme: 'striped',
          headStyles:     { fillColor: [230, 235, 245], textColor: [38, 77, 160], fontStyle: 'bold', fontSize: 8 },
          bodyStyles:     { fontSize: 8, textColor: [50, 50, 50] },
          alternateRowStyles: { fillColor: [247, 249, 252] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columnStyles: {
          0: { cellWidth: 44 }, // eslint-disable-line
          1: { cellWidth: 22 }, // eslint-disable-line
          2: { cellWidth: 42 }, // eslint-disable-line
          3: { cellWidth: 22 }, // eslint-disable-line
          4: { cellWidth: 22 }, // eslint-disable-line
          5: { cellWidth: 26 }, // eslint-disable-line
          6: { cellWidth: 26 }  // eslint-disable-line
        },
        margin: { left: 14, right: 14 }, // eslint-disable-line
          didParseCell: (data) => {
            // Fila de encabezado de dependencia (fila 0 del head)
            if (data.section === 'head' && data.row.index === 0) {
              data.cell.styles.fillColor = [38, 77, 160];
              data.cell.styles.textColor = [255, 255, 255];
            }
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      const nombreArchivo = `reporte-permisos-${this.mesBusqueda}-${this.anioBusqueda}.pdf`;
      doc.save(nombreArchivo);
    } finally {
      this.exportando.set(false);
    }
  }

  // ── Helpers privados ────────────────────────────────────────────────────

  private formatearFecha(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  private formatearHorasPermiso(raw: string): string {
    const match = raw.match(/([\d.]+)h\s*([\d.]+)m/);
    if (!match) return raw;
    const h = Math.round(parseFloat(match[1]));
    const m = Math.round(parseFloat(match[2]));
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return raw;
  }
}
