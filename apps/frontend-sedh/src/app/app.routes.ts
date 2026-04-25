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
      import('./login/loginPage.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/mainLayout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboardPage.component').then(
            (m) => m.DashboardPageComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
