/**
 * Configuración de la aplicación y metadatos del sistema
 * La versión se sincroniza automáticamente con package.json
 */

import packageInfo from '../../../../../package.json';

export const APP_CONFIG = {
  version: packageInfo.version,
  name: packageInfo.name,
} as const;
