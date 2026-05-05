import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EncabezadosPaginaComponent } from '../../../../components/encabezadosPagina/encabezadosPagina.component';

interface RegistroPermiso {
  empleado: string;
  fec_solicitud: string | Date;
  nom_tipo: string;
  hor_salida: string;
  hor_retorno: string;
  hor_permiso: string;
  hor_disponible?: string;
}

interface DepGroup {
  nom_dependencia: string;
  totalEmpleados: number;
  totalPermisos: number;
  registros: RegistroPermiso[];
}

@Component({
  selector: 'app-reporte-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule, EncabezadosPaginaComponent],
  templateUrl: './reportePermisos.component.html',
  styleUrls: ['./reportePermisos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportePermisosComponent {
  dependencias = signal<DepGroup[]>([]);
  depSeleccionada = signal<DepGroup | null>(null);
  modalAbierto = signal(false);

  mesBusqueda = new Date().getMonth() + 1;
  anioBusqueda = new Date().getFullYear();

  readonly anios: number[] = [2025, 2026];
  readonly nombresMeses: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  registrosSeleccionados = computed(() => this.depSeleccionada()?.registros ?? []);

  abrirModal(dep: DepGroup): void {
    this.depSeleccionada.set(dep);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.depSeleccionada.set(null);
  }

  buscarPorMes(): void {
    // Endpoint pendiente de integración
  }
}
