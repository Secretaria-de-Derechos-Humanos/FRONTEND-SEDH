import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprobaciones.component.html',
  styleUrls: ['./aprobaciones.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AprobacionesComponent {
  solicitudesPendientes = signal<number>(0);
  cargando = signal<boolean>(false);

  constructor() {
    // TODO: Implementar carga de datos desde servicio
  }
}
