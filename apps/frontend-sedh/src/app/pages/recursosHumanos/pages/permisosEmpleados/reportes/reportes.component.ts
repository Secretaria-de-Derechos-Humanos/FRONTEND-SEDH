import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent {
  reportesDisponibles = signal<number>(0);
  cargando = signal<boolean>(false);

  constructor() {
    // TODO: Implementar carga de datos desde servicio
  }
}
