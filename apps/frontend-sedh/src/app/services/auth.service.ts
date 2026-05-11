import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, EMPTY } from 'rxjs';
import { map, catchError, tap, share, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { EP_AUTH_LOGIN, EP_AUTH_REFRESH, EP_AUTH_LOGOUT } from '../config/api.endpoints';

export interface UserRol {
  r: number;
  m: number | number[];
}

export interface User {
  sub: string;
  email: string;
  telefono: string;
  nombre: string;
  apellido: string;
  puesto: string;
  dependencia: string;
  fechaIngreso: string;
  roles: UserRol[];
}

interface LoginApiResponse {
  success: boolean;
  data: { accessToken: string };
  message: string;
}

interface RefreshApiResponse {
  success: boolean;
  data: { accessToken: string };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly ACCESS_TOKEN_KEY = 'sedh_access_token';
  public readonly currentUser = signal<User | null>(this.getUserFromToken());

  /** Guarda el Observable de refresh en vuelo para deduplicar peticiones concurrentes */
  private refreshTokenInFlight$: Observable<string> | null = null;

  // ── JWT helpers ─────────────────────────────────────────────────────────────

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  private parseUser(token: string): User | null {
    const p = this.decodeJwtPayload(token);
    if (!p) return null;
    return {
      sub: p['sub'] as string,
      email: p['email'] as string,
      telefono: p['telefono'] as string,
      nombre: p['nombre'] as string,
      apellido: p['apellido'] as string,
      puesto: p['puesto'] as string,
      dependencia: p['dependencia'] as string,
      fechaIngreso: p['fechaIngreso'] as string,
      roles: p['roles'] as UserRol[],
    };
  }

  private isExpired(token: string): boolean {
    const p = this.decodeJwtPayload(token);
    if (!p || typeof p['exp'] !== 'number') return true;
    return Date.now() >= (p['exp'] as number) * 1000;
  }

  // ── sessionStorage helpers ───────────────────────────────────────────────────

  private getStoredToken(): string | null {
    if (!this.isBrowser) return null;
    try { return sessionStorage.getItem(this.ACCESS_TOKEN_KEY); } catch { return null; }
  }

  private saveToken(token: string): void {
    if (!this.isBrowser) return;
    try { sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token); } catch { /* no disponible */ }
  }

  private clearToken(): void {
    if (!this.isBrowser) return;
    try { sessionStorage.removeItem(this.ACCESS_TOKEN_KEY); } catch { /* no disponible */ }
  }

  private getUserFromToken(): User | null {
    const token = this.getStoredToken();
    if (!token || this.isExpired(token)) return null;
    return this.parseUser(token);
  }

  // ── API pública ──────────────────────────────────────────────────────────────

  getAccessTokenValue(): string | null {
    return this.getStoredToken();
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isExpired(token);
  }

  hasExpiredToken(): boolean {
    const token = this.getStoredToken();
    return !!token && this.isExpired(token);
  }

  /** Milisegundos restantes hasta que expire el access token. 0 si ya expiró o no hay token. */
  getTokenExpiresIn(): number {
    const token = this.getStoredToken();
    if (!token) return 0;
    const p = this.decodeJwtPayload(token);
    if (!p || typeof p['exp'] !== 'number') return 0;
    return Math.max(0, (p['exp'] as number) * 1000 - Date.now());
  }

  login(email: string, contrasena: string): Observable<User> {
    return this.http
      .post<LoginApiResponse>(
        `${environment.apiBaseUrl}${EP_AUTH_LOGIN}`,
        { email, contrasena },
        { withCredentials: true }
      )
      .pipe(
        map(response => {
          const token = response.data.accessToken;
          this.saveToken(token);
          const user = this.parseUser(token);
          if (!user) throw new Error('Token inválido recibido del servidor');
          this.currentUser.set(user);
          return user;
        }),
        catchError(error => {
          const msg: string = error.error?.message ?? 'Credenciales incorrectas';
          return throwError(() => new Error(msg));
        })
      );
  }

  /**
   * Llama a /auth/refresh y devuelve el nuevo accessToken.
   * Si hay una llamada en vuelo, todos los suscriptores comparten la misma petición
   * (patrón share) para evitar refrescos duplicados ante 401 concurrentes.
   */
  refreshToken(): Observable<string> {
    if (this.refreshTokenInFlight$) {
      return this.refreshTokenInFlight$;
    }

    this.refreshTokenInFlight$ = this.http
      .post<RefreshApiResponse>(
        `${environment.apiBaseUrl}${EP_AUTH_REFRESH}`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map(response => {
          const token = response.data.accessToken;
          this.saveToken(token);
          this.currentUser.set(this.parseUser(token));
          return token;
        }),
        catchError(error => {
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshTokenInFlight$ = null;
        }),
        share()
      );

    return this.refreshTokenInFlight$;
  }

  // Limpia la sesión local sin llamar al backend (uso interno y en errores de red)
  clearSession(): void {
    this.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  // Cierra sesión llamando al backend (uso explícito desde UI)
  logout(): Observable<void> {
    const token = this.getAccessTokenValue();
    const headers = new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
    return this.http
      .post<void>(
        `${environment.apiBaseUrl}${EP_AUTH_LOGOUT}`,
        {},
        { withCredentials: true, headers }
      )
      .pipe(
        tap({
          next: () => this.clearSession(),
          error: () => this.clearSession()
        }),
        catchError(() => EMPTY)
      );
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }
}
