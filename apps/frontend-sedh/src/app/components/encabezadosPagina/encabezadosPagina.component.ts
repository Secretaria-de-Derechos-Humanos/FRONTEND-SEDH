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
 *   [nivelEncabezado]="1"
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
   * Requerido.
   */
  titulo = input.required<string>();

  /**
   * Subtítulo opcional.
   * Texto descriptivo o contexto adicional.
   */
  subtitulo = input<string | null>(null);

  /**
   * Nivel del heading HTML (1-6).
   * Por defecto h1 para títulos de página.
   */
  nivelEncabezado = input<1 | 2 | 3 | 4 | 5 | 6>(1);

  /**
   * Alineación del texto.
   * Por defecto 'left' (izquierda).
   */
  alineacion = input<'left' | 'center' | 'right'>('left');

  /**
   * Tag HTML dinámico basado en el nivel de encabezado.
   */
  tagEncabezado = computed(() => `h${this.nivelEncabezado()}`);

  /**
   * Clases CSS para alineación.
   */
  claseAlineacion = computed(() => `align-${this.alineacion()}`);
}
