import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Estructura de tipado estricto para el desglose de reportes de permisos por empleado
export interface ReportePermisoEmpleado {
  id: number;
  empleado: string;
  identidad: string;
  departamento: string;
  permisosSolicitados: number;
  diasAcumulados: number;
  ultimoEstado: 'Aprobado' | 'Pendiente' | 'Rechazado';
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent {

  // Variables originales de tu captura
  reportesDisponibles = signal<number>(4); // Cambiado a 4 para hacer match con los datos mock
  cargando = signal<boolean>(false);

  // Filtro visual para la UI
  mesEvaluado = signal<string>('Junio 2026');

  // Contadores para las tarjetas informativas superiores (KPIs)
  totalPermisosEmitidos = signal<number>(18);
  diasJustificadosTotales = signal<number>(45);
  solicitudesRevision = signal<number>(2);

  // Lista de datos simulados para la tabla
  listaReportes = signal<ReportePermisoEmpleado[]>([
    {
      id: 1,
      empleado: 'Carlos Mendoza',
      identidad: '0801-1992-03421',
      departamento: 'Recursos Humanos',
      permisosSolicitados: 3,
      diasAcumulados: 5,
      ultimoEstado: 'Aprobado'
    },
    {
      id: 2,
      empleado: 'María José Oliva',
      identidad: '1503-1995-00214',
      departamento: 'Asesoría Legal',
      permisosSolicitados: 5,
      diasAcumulados: 12,
      ultimoEstado: 'Pendiente'
    },
    {
      id: 3,
      empleado: 'Juan Ramón Gómez',
      identidad: '0703-1988-01152',
      departamento: 'Tecnologías de la Información',
      permisosSolicitados: 2,
      diasAcumulados: 2,
      ultimoEstado: 'Aprobado'
    },
    {
      id: 4,
      empleado: 'Elena Pastrana',
      identidad: '0801-1996-12400',
      departamento: 'Administración General',
      permisosSolicitados: 1,
      diasAcumulados: 1,
      ultimoEstado: 'Rechazado'
    }
  ]);

  constructor() {
    // Aquí cargarías los datos desde el servicio cuando el backend esté listo
  }

  // Función simulada para las descargas de reportes en local
  descargarFormato(tipo: 'pdf' | 'excel') {
    alert('Preparando descarga del reporte consolidado en formato ${tipo.toUpperCase()}...');
  }
}
