import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionItem {
  id: string;
  label: string;
  icon: string;
  color?: 'primary' | 'secondary' | 'danger' | 'info';
}

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actionButton.component.html',
  styleUrls: ['./actionButton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonComponent {
  // Estado de apertura del speed dial
  isOpen = signal(false);

  // Acciones por defecto
  actions = signal<ActionItem[]>([
    {
      id: 'view',
      label: 'Ver detalles',
      icon: 'eye',
      color: 'info'
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'pencil',
      color: 'primary'
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'trash',
      color: 'danger'
    }
  ]);

  // Output para emitir la acción seleccionada
  actionSelected = output<string>();

  /**
   * Alterna el estado de apertura del speed dial
   */
  toggle(): void {
    this.isOpen.update(value => !value);
  }

  /**
   * Ejecuta una acción y cierra el speed dial
   * @param actionId - ID de la acción seleccionada
   */
  executeAction(actionId: string): void {
    this.actionSelected.emit(actionId);
    this.isOpen.set(false);
  }

  /**
   * Cierra el speed dial
   */
  close(): void {
    this.isOpen.set(false);
  }
}
