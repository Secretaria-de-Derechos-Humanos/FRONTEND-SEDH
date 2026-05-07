import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const AUTH_ENDPOINTS = [
  environment.endpoints.login,
  environment.endpoints.refreshToken,
  environment.endpoints.logout, // logout maneja su propio Bearer; se excluye del retry-on-401
];

const isAuthEndpoint = (url: string): boolean =>
  AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));

/**
 * Interceptor HTTP que gestiona la autenticación JWT.
 *
 * - Inyecta el header "Authorization: Bearer <token>" en todas las
 *   peticiones que NO sean endpoints de autenticación.
 * - En caso de respuesta 401, intenta renovar el accessToken usando
 *   el refreshToken (cookie HttpOnly) y reintenta la petición original.
 * - Si el refresh también falla, cierra la sesión y redirige al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Los endpoints /auth/* usan cookie HttpOnly, no necesitan Bearer
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = authService.getAccessTokenValue();
  const authorizedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newToken =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
          ),
          catchError(refreshError => {
            authService.clearSession();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
