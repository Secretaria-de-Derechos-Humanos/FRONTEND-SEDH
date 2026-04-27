import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizable para encabezados de páginas.
 * Se adapta automáticamente al tema claro/oscuro usando variables CSS.
 *
 * Ejemplo de uso:
 * <app-encabezados-pagina
 *   titulo="Gestión de recursos humanos"
 *   [subtitulo]="'Administración de personal y nómina'"
 * />
 */
@Component({
  selector: 'app-encabezados-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './encabezadosPagina.component.html',
  styleUrls: ['./encabezadosPagina.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EncabezadosPaginaComponent {
  /**
   * Título principal del encabezado.
   */
  titulo = input.required<string>();

  /**
   * Subtítulo opcional.
   */
  subtitulo = input<string | null>(null);

  /**
   * Alineación del texto.
   */
  alineacion = input<'left' | 'center' | 'right'>('left');

  /**
   * Clases CSS para alineación.
   */
  claseAlineacion = computed(() => `align-${this.alineacion()}`);
}
