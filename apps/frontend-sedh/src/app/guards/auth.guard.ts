import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas privadas.
 * Si el accessToken está vigente → permite el acceso.
 * Si el accessToken expiró pero el refreshToken (cookie) sigue válido
 *   → intenta renovar y luego permite el acceso.
 * Si no hay token o el refresh falla → redirige al login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  if (authService.hasExpiredToken()) {
    return authService.refreshToken().pipe(
      map(() => true),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guard que redirige al dashboard si ya está autenticado.
 * Útil para la página de login.
 */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/menu-principal']);
  return false;
};
