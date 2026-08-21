import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';
import { AuthService } from '../../app/services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const usuarioRolId = (authService as any).getRol();
  if (usuarioRolId == 5) {
    return true; // ✅ Es admin, lo dejamos pasar a la ruta
  }

  alert('Acceso Denegado: Solo el rol Administrador puede ingresar aquí.');
  router.navigate(['/menu-principal']);
  return false;

 //return true;
};
