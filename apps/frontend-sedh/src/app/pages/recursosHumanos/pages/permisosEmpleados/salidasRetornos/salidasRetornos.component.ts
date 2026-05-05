import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-salidas-retornos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './salidasRetornos.component.html',
  styleUrls: ['./salidasRetornos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalidasRetornosComponent {
  registrosHoy = signal<number>(0);
  cargando = signal<boolean>(false);

  constructor() {
    // TODO: Implementar carga de datos desde servicio
  }
}
