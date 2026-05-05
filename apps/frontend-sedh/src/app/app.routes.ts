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
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/mainLayout/mainLayout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'menu-principal',
        loadComponent: () =>
          import('./pages/menuPrincipal/menuPrincipalPage.component').then(
            (m) => m.MenuPrincipalPageComponent
          ),
      },
      {
        path: 'perfil-usuario',
        loadComponent: () =>
          import('./pages/configuracionUsuario/configuracionUsuarioPage.component').then(
            (m) => m.ConfiguracionUsuarioPageComponent
          ),
      },
      {
        path: 'pendientes',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/pendientes/pendientes.component').then(
            (m) => m.PendientesComponent
          ),
      },
      {
        path: 'rrhh',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/main/recursosHumanosMain.component').then(
            (m) => m.RecursosHumanosMainComponent
          ),
      },
      {
        path: 'rrhh/mis-solicitudes',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/solicitudesEmpleado/solicitudesEmpleado.component').then(
            (m) => m.SolicitudesEmpleadoComponent
          ),
      },
      {
        path: 'rrhh/aprobaciones',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/aprobaciones/aprobaciones.component').then(
            (m) => m.AprobacionesComponent
          ),
      },
      {
        path: 'rrhh/salidas-retornos',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/salidasRetornos/salidasRetornos.component').then(
            (m) => m.SalidasRetornosComponent
          ),
      },
      {
        path: 'rrhh/reportes',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/reportes/reportes.component').then(
            (m) => m.ReportesComponent
          ),
      },
      {
        path: 'rrhh/buscar-editar',
        loadComponent: () =>
          import('./pages/recursosHumanos/pages/permisosEmpleados/buscarEditarEmpleados/buscarEditarEmpleados.component').then(
            (m) => m.BuscarEditarEmpleadosComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
