import { Route } from '@angular/router';

import {
  authGuard,
  loginGuard,
} from './guards/auth.guard';
import {
  adminGuard,
} from './guards/admin.guard';
import {
  rolesGuard,
} from './guards/roles.guard';
export const appRoutes: Route[] = [

  // =========================================================
  // INICIO
  // =========================================================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // =========================================================
  // LOGIN
  // =========================================================

  {
    path: 'login',
    canActivate: [
      loginGuard,
    ],

    loadComponent: () =>
      import(
        './layouts/login/loginPage.component'
      ).then(
        (m) =>
          m.LoginPageComponent,
      ),
  },

  // =========================================================
  // APLICACIÓN AUTENTICADA
  // =========================================================

  {
    path: '',
    canActivate: [
      authGuard,
    ],

    loadComponent: () =>
      import(
        './layouts/mainLayout/mainLayout.component'
      ).then(
        (m) =>
          m.MainLayoutComponent,
      ),

    children: [

      // =======================================================
      // MENÚ PRINCIPAL
      // =======================================================

      {
        path: 'menu-principal',

        loadComponent: () =>
          import(
            './pages/menuPrincipal/menuPrincipalPage.component'
          ).then(
            (m) =>
              m.MenuPrincipalPageComponent,
          ),
      },

      // =======================================================
      // PERFIL
      // =======================================================

      {
        path: 'perfil-usuario',

        loadComponent: () =>
          import(
            './pages/configuracionUsuario/configuracionUsuarioPage.component'
          ).then(
            (m) =>
              m.ConfiguracionUsuarioPageComponent,
          ),
      },

      // =======================================================
      // GESTIÓN DE USUARIOS - ADMIN
      // =======================================================

      {
        path: 'gestion-usuarios',

        canActivate: [
          adminGuard,
        ],

        loadComponent: () =>
          import(
            '../core/usuarios/pages/gestion-usuarios'
          ).then(
            (m) =>
              m.GestionUsuariosComponent,
          ),
      },

      // =======================================================
      // CREAR USUARIO - ADMIN
      // =======================================================

      {
        path: 'crear-usuario',

        canActivate: [
          adminGuard,
        ],

        loadComponent: () =>
          import(
            './components/crear-usuario/crear-usuario'
          ).then(
            (m) =>
              m.CrearUsuarioComponent,
          ),
      },

      // =======================================================
      // PENDIENTES
      // ROLES: 2, 3, 5
      // =======================================================

      {
        path: 'pendientes',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            2,
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/pendientes/pendientes.component'
          ).then(
            (m) =>
              m.PendientesComponent,
          ),
      },

      // =======================================================
      // MÓDULO RECURSOS HUMANOS
      // =======================================================

      {
        path: 'rrhh',

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/main/recursosHumanosMain.component'
          ).then(
            (m) =>
              m.RecursosHumanosMainComponent,
          ),
      },

      // =======================================================
      // SOLICITAR ALGO A RRHH
      // ROLES: 1, 2, 3, 4, 5
      // =======================================================

      {
        path: 'rrhh/mis-solicitudes',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            1,
            2,
            3,
            4,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/solicitudesEmpleado/solicitudesEmpleado.component'
          ).then(
            (m) =>
              m.SolicitudesEmpleadoComponent,
          ),
      },

      // =======================================================
      // APROBACIONES DE PERMISOS
      // ROLES: 2, 3, 5
      // =======================================================

      {
        path: 'rrhh/aprobaciones',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            2,
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/aprobaciones/aprobaciones.component'
          ).then(
            (m) =>
              m.AprobacionesComponent,
          ),
      },

      // =======================================================
      // SALIDAS Y RETORNOS
      // ROLES: 4, 5
      // =======================================================

      {
        path: 'rrhh/salidas-retornos',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            4,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/salidasRetornos/salidasRetornos.component'
          ).then(
            (m) =>
              m.SalidasRetornosComponent,
          ),
      },

      // =======================================================
      // REPORTES
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/reportes',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/reportes/reportes.component'
          ).then(
            (m) =>
              m.ReportesComponent,
          ),
      },

      // =======================================================
      // BUSCAR / EDITAR
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/buscar-editar',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/buscarEditarEmpleados/buscarEditarEmpleados.component'
          ).then(
            (m) =>
              m.BuscarEditarEmpleadosComponent,
          ),
      },

      // =======================================================
      // REPORTE DE PERMISOS
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/reporte-permisos',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/reportePermisos/reportePermisos.component'
          ).then(
            (m) =>
              m.ReportePermisosComponent,
          ),
      },

      // =======================================================
      // CONTROL DE SALIDAS
      // ROLES: 4, 5
      // =======================================================

      {
        path: 'rrhh/control-salidas',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            4,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/control-Salidas/controlSalidas.component'
          ).then(
            (m) =>
              m.ControlSalidasComponent,
          ),
      },

      // =======================================================
      // GESTIÓN DE EMPLEADOS
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/gestion-empleados',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/buscarEditarEmpleados/buscarEditarEmpleados.component'
          ).then(
            (m) =>
              m.BuscarEditarEmpleadosComponent,
          ),
      },

      // =======================================================
      // CREAR EMPLEADO
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/empleados/crear',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/gestionEmpleados/crearEmpleado/crearEmpleado.component'
          ).then(
            (m) =>
              m.CrearEmpleadoComponent,
          ),
      },

      // =======================================================
      // EDITAR EMPLEADO
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'rrhh/empleados/editar',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/recursosHumanos/pages/permisosEmpleados/editarEmpleado/editarEmpleado.component'
          ).then(
            (m) =>
              m.EditarEmpleadoComponent,
          ),
      },

      // =======================================================
      // CAMBIAR PASSWORD
      // =======================================================

      {
        path: 'cambiar-password',

        loadComponent: () =>
          import(
            './pages/cambiar-password/cambiar-password'
          ).then(
            (m) =>
              m.CambiarPasswordComponent,
          ),
      },

      // =======================================================
      // SOLICITAR VACACIONES
      // ROLES: 1, 2, 3, 4, 5
      // =======================================================

      {
        path: 'vacaciones/solicitar',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            1,
            2,
            3,
            4,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/vacaciones/solicitar-vacaciones/solicitar-vacaciones'
          ).then(
            (m) =>
              m.SolicitarVacacionesComponent,
          ),
      },
      // =====================================================
// REPORTE DE VACACIONES
// ROLES: 2, 3, 5
// =====================================================

{
  path: 'vacaciones/reporte',
  canActivate: [rolesGuard],
  data: {
    roles: [2, 3, 5],
  },
  loadComponent: () =>
    import(
      './pages/vacaciones/reporte-vacaciones/reporte-vacaciones.component'
    ).then(
      (m) => m.ReporteVacacionesComponent,
    ),
},

      // =======================================================
      // VACACIONES PENDIENTES JEFE
      // ROLES: 2, 5
      // =======================================================

      {
        path: 'vacaciones/pendientes-jefe',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            2,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/vacaciones/pendientes-jefe/pendientes-jefe'
          ).then(
            (m) =>
              m.PendientesJefeComponent,
          ),
      },

      // =======================================================
      // VACACIONES PENDIENTES SUBGERENCIA
      // ROLES: 3, 5
      // =======================================================

      {
        path: 'vacaciones/pendientes-subgerente',

        canActivate: [
          rolesGuard,
        ],

        data: {
          roles: [
            3,
            5,
          ],
        },

        loadComponent: () =>
          import(
            './pages/vacaciones/pendientes-subgerente/pendientes-subgerente'
          ).then(
            (m) =>
              m.PendientesSubgerenteComponent,
          ),
      },

    ],
  },

  // =========================================================
  // RUTA NO ENCONTRADA
  // =========================================================

  {
    path: '**',
    redirectTo: 'login',
  },
];
