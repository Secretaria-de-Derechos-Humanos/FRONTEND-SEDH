import { Route } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./layouts/login/loginPage.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'menuPrincipal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/menuPrincipal/menuPrincipalPage.component').then(
        (m) => m.MenuPrincipalPageComponent
      ),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/mainLayout/mainLayout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: '/menuPrincipal',
        pathMatch: 'full',
      },
      {
        path: 'configuracion-usuario',
        loadComponent: () =>
          import('./layouts/configuracionUsuario/configuracionUsuarioPage.component').then(
            (m) => m.ConfiguracionUsuarioPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
