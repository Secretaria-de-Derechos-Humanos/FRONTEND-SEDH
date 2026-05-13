# SEDH — Sistema Electrónico de Datos de Hacienda

Frontend institucional construido con **Angular 21+**, **Nx Monorepo** y **PrimeNG**.

---

## Requisitos

- Node.js >= 20
- npm >= 10
- Nx CLI global: `npm install -g nx`

---

## Comandos principales

```sh
# Servidor de desarrollo
npx nx serve frontend-sedh --configuration=development

# Build de producción
npx nx build frontend-sedh

# Ver todas las tareas disponibles del proyecto
npx nx show project frontend-sedh

# Grafo de dependencias del workspace
npx nx graph
```

---

## Despliegue en producción (IIS)

**Ejecutar los siguientes comandos en PowerShell con permisos de Administrador:**

```powershell
# 1. Navegar al proyecto
Set-Location "C:\Users\Desarrollo\Documents\GitHub\FRONTEND-SEDH"

# 2. Instalar dependencias (si es necesario)
npm install

# 3. Limpiar caché de Nx
npx nx reset

# 4. Construir versión de producción
npx nx build frontend-sedh --configuration=production

# 5. Definir origen (build) y destino (ruta IIS real)
$sourcePath = "C:\Users\Desarrollo\Documents\GitHub\FRONTEND-SEDH\dist\apps\frontend-sedh\browser"
$publishPath = "C:\inetpub\qa.sedh.gob.hn"

# 6. Validar que el build exista
if (!(Test-Path $sourcePath)) {
	throw "No existe el build en $sourcePath"
}

# 7. Detener IIS para despliegue limpio
iisreset /stop

# 8. Crear carpeta destino si no existe
if (!(Test-Path $publishPath)) {
	New-Item -ItemType Directory -Path $publishPath -Force | Out-Null
}

# 9. Limpiar destino por completo (sin archivos extra)
Remove-Item "$publishPath\*" -Recurse -Force -ErrorAction SilentlyContinue

# 10. Copiar en modo espejo (solo archivos del build actual)
robocopy $sourcePath $publishPath /MIR /R:1 /W:1

# 11. Iniciar IIS
iisreset /start

# 12. Validar despliegue y archivos publicados
Get-ChildItem $publishPath -Filter "main-*.js" | Select-Object Name, LastWriteTime
Get-ChildItem $publishPath -Filter "index*.html" | Select-Object Name, LastWriteTime
Invoke-WebRequest http://localhost -UseBasicParsing | Select-Object StatusCode
```

**Nota:** Este flujo hace un despliegue limpio en la ruta física real del sitio IIS y elimina archivos obsoletos de versiones anteriores.

---

## Estructura del proyecto

```
FRONTEND-SEDH/
├── apps/
│   └── frontend-sedh/
│       └── src/app/
│           ├── template/                  # Recursos compartidos
│           │   ├── components/
│           │   │   ├── navbar/            # NavbarTopComponent
│           │   │   └── sidebar/           # SidebarLeftComponent
│           │   ├── layouts/               # MainLayoutComponent
│           │   ├── models/                # Interfaces TypeScript
│           │   ├── pages/
│           │   │   ├── login/             # LoginPageComponent
│           │   │   └── dashboard/         # DashboardPageComponent
│           │   └── services/              # ThemeService
│           └── [unidad]/                  # Carpeta por departamento
│               ├── components/
│               ├── pages/
│               └── services/
├── .github/prompts/                       # Agente y skills de Copilot
└── node_modules/
```

---

## Rutas de la aplicación

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | → `/login` | Redirección automática |
| `/login` | `LoginPageComponent` | Pantalla de acceso |
| `/app/dashboard` | `DashboardPageComponent` | Panel principal |
| `/app/recursosHumanos` | *(próximamente)* | Módulo de RRHH |

---

## Stack tecnológico

| Tecnología | Versión |
|---|---|
| Angular | 21.2+ |
| Nx | 22.6+ |
| PrimeNG | 18+ |
| TypeScript | Strict mode |
| Bundler | esbuild |
| SSR | Angular SSR (Express) |

---

## Convenciones de desarrollo

- **Archivos**: camelCase (`loginPage.component.ts`)
- **Componentes**: siempre Standalone + `OnPush`
- **Estado**: Angular Signals
- **Estilos**: variables CSS `--sedh-*` (nunca hex directos en componentes)
- **UI**: PrimeNG como primera opción, CSS personalizado si no cubre el caso

---

## Agregar una nueva unidad (departamento)

```sh
# Crear carpeta de nueva unidad (ej: finanzas)
mkdir apps/frontend-sedh/src/app/finanzas
mkdir apps/frontend-sedh/src/app/finanzas/components
mkdir apps/frontend-sedh/src/app/finanzas/pages
mkdir apps/frontend-sedh/src/app/finanzas/services
```

Luego agregar la ruta en `app.routes.ts` y el item de navegación en `sidebarLeft.component.ts`.

---

## Variables de entorno

Configura en `apps/frontend-sedh/src/environments/`:
- `environment.ts` — desarrollo
- `environment.prod.ts` — producción


[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve frontend-sedh
```

To create a production bundle:

```sh
npx nx build frontend-sedh
```

To see all available targets to run for a project, run:

```sh
npx nx show project frontend-sedh
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
