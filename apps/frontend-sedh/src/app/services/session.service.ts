import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private inactivityTimer?: ReturnType<typeof setTimeout>;
  private countdownInterval?: ReturnType<typeof setInterval>;
  private activityDetected = false;
  private eventsRegistered = false;

  /** 30 segundos — el modal avisa antes de que expire el access token (4 min) */
  readonly COUNTDOWN_SECONDS = 30;

  readonly showModal = signal(false);
  readonly countdown = signal(30);
  /** true cuando la sesión expiró sin posibilidad de renovarla (el refresh token también falló) */
  readonly sessionExpiredForced = signal(false);

  // ── Handler de actividad (referencia fija para poder eliminarla) ─────────────

  private readonly onActivity = (): void => {
    this.activityDetected = true;
  };

  // ── API pública ──────────────────────────────────────────────────────────────

  /** Llama desde MainLayoutComponent.ngOnInit() */
  initSession(): void {
    if (!this.isBrowser) return;
    this.destroySession();
    this.bindActivityEvents();
    this.scheduleCheck();
  }

  /** Llama desde MainLayoutComponent.ngOnDestroy() */
  destroySession(): void {
    clearTimeout(this.inactivityTimer);
    clearInterval(this.countdownInterval);
    this.showModal.set(false);
    this.sessionExpiredForced.set(false);
    this.countdown.set(this.COUNTDOWN_SECONDS);
    this.unbindActivityEvents();
  }

  continuarSesion(): void {
    clearInterval(this.countdownInterval);
    this.showModal.set(false);
    this.authService.refreshToken().subscribe({
      next: () => {
        this.activityDetected = false;
        this.scheduleCheck();
      },
      error: () => {
        this.destroySession();
        this.authService.clearSession();
      }
    });
  }

  performLogout(): void {
    this.destroySession();
    this.authService.logout().subscribe();
  }

  /**
   * Llamado por el interceptor cuando el refresh tiene éxito.
   * Si el modal de inactividad está abierto (no el de sesión expirada forzada),
   * lo cierra y reprograma el timer para que el usuario no sea expulsado
   * aunque no haya interactuado con el modal.
   */
  onTokenRefreshed(): void {
    if (this.showModal() && !this.sessionExpiredForced()) {
      clearInterval(this.countdownInterval);
      this.showModal.set(false);
      this.activityDetected = false;
      this.scheduleCheck();
    }
  }

  // ── Internos ─────────────────────────────────────────────────────────────────

  private bindActivityEvents(): void {
    if (this.eventsRegistered) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, this.onActivity, { passive: true }));
    this.eventsRegistered = true;
  }

  private unbindActivityEvents(): void {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.removeEventListener(e, this.onActivity));
    this.eventsRegistered = false;
  }

  private scheduleCheck(): void {
    clearTimeout(this.inactivityTimer);

    // Calcular el delay basado en la expiración real del token.
    // Queremos mostrar el modal COUNTDOWN_SECONDS antes de que expire.
    // Si el token ya expira en menos de COUNTDOWN_SECONDS, mostrar el modal ya.
    const expiresIn = this.authService.getTokenExpiresIn();
    const countdownMs = this.COUNTDOWN_SECONDS * 1000;
    const delay = expiresIn > countdownMs
      ? expiresIn - countdownMs
      : 0;

    if (delay <= 0) {
      // El token expira pronto o ya expiró → modal inmediato
      if (this.activityDetected) {
        this.activityDetected = false;
        this.authService.refreshToken().subscribe({
          next: () => this.scheduleCheck(),
          error: () => {
            this.destroySession();
            this.authService.clearSession();
          }
        });
      } else {
        this.showInactivityModal();
      }
      return;
    }

    this.inactivityTimer = setTimeout(() => {
      if (this.activityDetected) {
        // Usuario activo → refresh silencioso, sin modal
        this.activityDetected = false;
        this.authService.refreshToken().subscribe({
          next: () => this.scheduleCheck(),
          error: () => {
            this.destroySession();
            this.authService.clearSession();
          }
        });
      } else {
        // Usuario inactivo → mostrar modal con cuenta regresiva
        this.showInactivityModal();
      }
    }, delay);
  }

  /**
   * Muestra el modal de inactividad (modo «¿Desea continuar?»).
   * Llamado cuando el usuario está inactivo O cuando el refresh falla
   * con error transitorio (500, red) y no se debe forzar el logout.
   */
  showInactivityModal(): void {
    if (this.showModal()) return; // ya está visible, no duplicar
    clearTimeout(this.inactivityTimer);
    clearInterval(this.countdownInterval);
    this.sessionExpiredForced.set(false);
    this.countdown.set(this.COUNTDOWN_SECONDS);
    this.showModal.set(true);
    this.startCountdown();
  }

  private startCountdown(): void {
    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const remaining = this.countdown();
      if (remaining <= 1) {
        clearInterval(this.countdownInterval);
        this.performLogout();
      } else {
        this.countdown.set(remaining - 1);
      }
    }, 1000);
  }
}
