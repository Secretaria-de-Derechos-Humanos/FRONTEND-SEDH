import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-buscar-editar-empleados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './buscarEditarEmpleados.component.html',
  styleUrls: ['./buscarEditarEmpleados.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuscarEditarEmpleadosComponent {
  totalEmpleados = signal<number>(0);
  cargando = signal<boolean>(false);

  constructor() {
    // TODO: Implementar carga de datos desde servicio
  }
}
