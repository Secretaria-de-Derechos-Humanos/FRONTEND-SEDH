import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * Interceptor exclusivo para SSR (Node.js).
 *
 * En el servidor las URLs relativas no se pueden resolver, por lo que
 * este interceptor antepone la URL base de la API antes de que la
 * petición llegue al interceptor de autenticación o a la red.
 *
 * En el browser es un no-op: el proxy de desarrollo y la URL absoluta
 * de producción ya están configurados en environment.
 */
export const ssrAbsoluteUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId) && req.url.startsWith('/')) {
    return next(
      req.clone({ url: `https://api.sedh.gob.hn${req.url}` })
    );
  }

  return next(req);
};
