// Copia este archivo como environment.ts y completa los valores reales.
// Este archivo de ejemplo SÍ se versiona en git; el archivo real NO.

export const environment = {
  production: false,
  apiBaseUrl: 'https://api.TU_DOMINIO.gob.hn/api/v1',
  endpoints: {
    login: '/auth/login',
    refreshToken: '/auth/refresh',
    logout: '/auth/logout',
  },
} as const;
