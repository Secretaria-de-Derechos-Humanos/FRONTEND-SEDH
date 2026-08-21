import { inject } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  AuthService,
} from '../services/auth.service';

export const rolesGuard: CanActivateFn =
  (
    route:
      ActivatedRouteSnapshot,
  ) => {
    const authService =
      inject(AuthService);
    const router =
      inject(Router);
    const usuario =
      authService.currentUser();

    if (!usuario) {
      return router.createUrlTree([
        '/login',
      ]);
    }

    const rolesPermitidos =
      route.data?.['roles'] as
        number[] | undefined;

    /*
     * Si la ruta no especifica roles,
     * basta con estar autenticado.
     */
    if (
      !rolesPermitidos?.length
    ) {
      return true;
    }

    const rolesUsuario =
      (usuario.roles ?? [])
        .map(
          (rol) =>
            Number(rol.r),
        );

    const tienePermiso =
      rolesPermitidos.some(
        (rolPermitido) =>
          rolesUsuario.includes(
            rolPermitido,
          ),
      );

    if (tienePermiso) {
      return true;
    }

    /*
     * Si intenta escribir manualmente
     * una URL no autorizada,
     * lo enviamos al menú principal.
     */
    return router.createUrlTree([
      '/menu-principal',
    ]);
  };
