import { Component, ChangeDetectionStrategy, signal, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_CONFIG } from '../../config/app.config.constants';

@Component({
  selector: 'sedh-system-preloader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './systemPreloader.component.html',
  styleUrl: './systemPreloader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemPreloaderComponent {
  // Versión del sistema desde package.json
  protected readonly version = APP_CONFIG.version;

  // Progreso de la carga (0-100)
  protected readonly progress = signal(0);

  // Emite cuando la animación completa
  loadComplete = output<void>();

  // Duración total del preloader en ms
  private readonly PRELOAD_DURATION = 8000; // 8 segundos

  // Intervalo de actualización del progreso
  private readonly UPDATE_INTERVAL = 100; // actualizar cada 100ms

  constructor() {
    // Simular progreso de carga en 8 segundos
    effect(() => {
      const totalSteps = this.PRELOAD_DURATION / this.UPDATE_INTERVAL;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;

        if (currentStep >= totalSteps) {
          this.progress.set(100);
          clearInterval(interval);
          // Esperar 300ms adicionales antes de emitir
          setTimeout(() => this.loadComplete.emit(), 300);
          return;
        }

        // Progreso suave con pequeña variación aleatoria
        const baseProgress = (currentStep / totalSteps) * 100;
        const randomVariation = Math.random() * 2 - 1; // ±1%
        const newProgress = Math.min(99, baseProgress + randomVariation);

        this.progress.set(newProgress);
      }, this.UPDATE_INTERVAL);

      // Cleanup
      return () => clearInterval(interval);
    });
  }
}
