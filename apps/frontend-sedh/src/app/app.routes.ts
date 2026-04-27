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
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/mainLayout/mainLayout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'menu-principal',
        pathMatch: 'full',
      },
      {
        path: 'menu-principal',
        loadComponent: () =>
          import('./pages/menuPrincipal/menuPrincipalPage.component').then(
            (m) => m.MenuPrincipalPageComponent
          ),
      },
      {
        path: 'configuracion-usuario',
        loadComponent: () =>
          import('./pages/configuracionUsuario/configuracionUsuarioPage.component').then(
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
