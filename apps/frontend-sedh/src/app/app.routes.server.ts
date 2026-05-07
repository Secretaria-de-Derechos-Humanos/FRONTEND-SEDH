import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Login se renderiza en el cliente para evitar submit nativo antes de la hidratación
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'app/**',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
