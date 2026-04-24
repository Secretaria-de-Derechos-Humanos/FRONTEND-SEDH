import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const THEME_KEY = 'sedh-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _isDark = signal(this.loadStoredTheme());

  readonly isDark = this._isDark.asReadonly();
  readonly themeLabel = computed(() => (this._isDark() ? 'Modo Claro' : 'Modo Oscuro'));
  readonly themeIcon = computed(() => (this._isDark() ? 'pi pi-sun' : 'pi pi-moon'));

  constructor() {
    // Aplica la clase al arrancar según lo guardado en localStorage
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('dark-theme', this._isDark());
    }
  }

  toggleTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this._isDark.update((v) => !v);
    document.body.classList.toggle('dark-theme', this._isDark());
    localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
  }

  private loadStoredTheme(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem(THEME_KEY) === 'dark';
  }
}
