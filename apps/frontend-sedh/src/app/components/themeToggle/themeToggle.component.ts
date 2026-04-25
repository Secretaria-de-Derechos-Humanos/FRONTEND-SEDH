import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'sedh-theme-toggle',
  standalone: true,
  imports: [],
  templateUrl: './themeToggle.component.html',
  styleUrl: './themeToggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  /**
   * Variante visual del botón:
   * - 'floating': botón circular flotante (para login)
   * - 'navbar': botón compacto para barra de navegación
   */
  variant = input<'floating' | 'navbar'>('navbar');

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
