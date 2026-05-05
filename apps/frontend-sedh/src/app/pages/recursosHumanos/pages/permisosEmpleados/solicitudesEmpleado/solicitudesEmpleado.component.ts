import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Solicitud {
  id: string;
  empleado: string;
  tipoPermiso: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivo: string;
}

@Component({
  selector: 'app-solicitudes-empleado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solicitudesEmpleado.component.html',
  styleUrls: ['./solicitudesEmpleado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitudesEmpleadoComponent {
  solicitudes = signal<Solicitud[]>([]);
  cargando = signal<boolean>(false);

  constructor() {
    // TODO: Implementar carga de datos desde servicio
  }
}
