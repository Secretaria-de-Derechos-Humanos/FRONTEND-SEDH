import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import {
  GestionEmpleadosService,
  ResultadoBusquedaEmpleado,
  EmpleadoDetalle,
  AccesoSistema,
  DatosSedh,
  MunicipioCatalogo,
  CargoCatalogo,
} from './gestionEmpleados.service';
import { ToastService } from '../../../../services/toast.service';
import { ModalAgregarEmpleadoComponent } from '../../../../components/modalAgregarEmpleado/modalAgregarEmpleado.component';
import { AuthService } from './../../../../services/auth.service';

// ── Definición de tabs ────────────────────────────────────────────────────────

type TabId = 'personales' | 'laboral' | 'accesos' | 'historial';

interface Tab {
  id: TabId;
  titulo: string;
}

const TABS: Tab[] = [
  { id: 'personales', titulo: 'Datos personales' },
  { id: 'laboral', titulo: 'Información laboral' },
  { id: 'accesos', titulo: 'Accesos al sistema' },
  { id: 'historial', titulo: 'Historial de cargos' },
];

interface DatosPersonalesEdicion {
  priNombre: string;
  segNombre: string;
  priApellido: string;
  segApellido: string;
  numIdentidad: string;
  idSexo: string;
  idEstadoCivil: string;
  idDepartamento: number;
  idMunicipio: number | null;
}

@Component({
  selector: 'app-gestion-empleados',
  standalone: true,
  imports: [FormsModule, TitleCasePipe, ModalAgregarEmpleadoComponent],
  templateUrl: './gestionEmpleados.component.html',
  styleUrls: ['./gestionEmpleados.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionEmpleadosComponent {
  private readonly service = inject(GestionEmpleadosService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  readonly puedeEditarDatosPersonales = computed(() => {
    const roles = this.authService.currentUser()?.roles ?? [];
    return roles.some((rol) => {
      const modulos = Array.isArray(rol.m)
        ? rol.m
        : rol.m !== undefined && rol.m !== null
          ? [rol.m]
          : [];

      return (
        [3, 5].includes(Number(rol.r)) &&
        modulos.some((id) => Number(id) === 1)
      );
    });
  });
  // ── Estado ──────────────────────────────────────────────────────────────────
  searchQuery = signal('');
  resultado = signal<ResultadoBusquedaEmpleado | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  tabAbierta = signal<TabId>('personales');
  modoEdicion = signal(false);
  empleadoEdicion = signal<EmpleadoDetalle | null>(null);
  accesosEdicion = signal<AccesoSistema[]>([]);
  datosSedh = signal<DatosSedh | null>(null);
  cargandoDatos = signal(false);
  guardando = signal(false);
  mostrarModalAgregar = signal(false);
  mensajeEdicion = signal('');
  errorEdicion = signal(false);
  modoEdicionPersonal = signal(false);
  datosPersonalesEdicion =
  signal<DatosPersonalesEdicion | null>(null);
  guardandoDatosPersonales = signal(false);
  readonly tabs = TABS;

  // ── Computados ──────────────────────────────────────────────────────────────
  nombreCompleto = computed(() => {
    const emp = this.resultado()?.empleado;
    if (!emp) return '';

    return [
      emp.primerNombre,
      emp.segundoNombre,
      emp.primerApellido,
      emp.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ');
  });

  municipiosFiltrados = computed((): MunicipioCatalogo[] => {
    const depId = this.empleadoEdicion()?.idDepartamento;
    const todos = this.datosSedh()?.municipios ?? [];

    return depId
      ? todos.filter(m => m.idDepartamento === depId)
      : todos;
  });

  /** Devuelve únicamente los cargos de la dependencia seleccionada. */
  cargosPorDependencia = computed((): CargoCatalogo[] => {
    const idDependencia = this.empleadoEdicion()?.idDependencia;
    const cargos = this.datosSedh()?.cargos ?? [];

    if (idDependencia === null || idDependencia === undefined || idDependencia === 0) {
      return [];
    }

    return cargos.filter(
      cargo => Number(cargo.idDependencia) === Number(idDependencia)
    );
  });

  // ── Acciones ────────────────────────────────────────────────────────────────
  buscarEmpleado(): void {
    const query = this.searchQuery().trim();

    if (!query) {
      this.errorMessage.set(
        'Ingrese un nombre, correo institucional o número de identidad para buscar.'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.resultado.set(null);
    this.tabAbierta.set('personales');
    this.modoEdicion.set(false);
    this.empleadoEdicion.set(null);

    this.service.buscarEmpleado(query).subscribe({
      next: (data) => {
        this.resultado.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(
          err.message ??
          'No se encontró ningún empleado con ese criterio de búsqueda.'
        );
        this.isLoading.set(false);
      },
    });
  }

  abrirTab(id: TabId): void {
    this.tabAbierta.set(
      this.tabAbierta() === id ? ('' as TabId) : id
    );
  }

  estaAbierta(id: TabId): boolean {
    return this.tabAbierta() === id;
  }

  iniciarEdicion(): void {
    const emp = this.resultado()?.empleado;
    if (!emp) return;

    this.empleadoEdicion.set({ ...emp });

    this.accesosEdicion.set(
      (this.resultado()?.accesosSistema ?? []).map(a => ({ ...a }))
    );

    this.modoEdicion.set(true);

    if (!this.datosSedh()) {
      this.cargandoDatos.set(true);

      this.service.cargarDatosSedh().subscribe({
        next: (data) => {
          this.datosSedh.set(data);
          this.cargandoDatos.set(false);
        },
        error: () => this.cargandoDatos.set(false),
      });
    }
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.empleadoEdicion.set(null);
    this.accesosEdicion.set([]);
  }

  actualizarCampo(
    campo: keyof EmpleadoDetalle,
    valor: unknown
  ): void {
    this.empleadoEdicion.update(e =>
      e ? { ...e, [campo]: valor } : e
    );
  }

  /** Actualiza un campo de catálogo sincronizando id + nombre. */
  seleccionarCatalogo(
    id: unknown,
    campoId: keyof EmpleadoDetalle,
    campoNombre: keyof EmpleadoDetalle,
    lista: Array<{ id: unknown; nombre: string }>
  ): void {
    const item = lista.find(i => String(i.id) === String(id));
    if (!item) return;

    this.empleadoEdicion.update(e =>
      e
        ? { ...e, [campoId]: item.id, [campoNombre]: item.nombre }
        : e
    );
  }

  /** Selecciona departamento y resetea municipio. */
  seleccionarDepartamento(id: unknown): void {
    this.seleccionarCatalogo(
      id,
      'idDepartamento',
      'departamento',
      this.datosSedh()?.departamentos ?? []
    );

    this.empleadoEdicion.update(e =>
      e ? { ...e, idMunicipio: 0, municipio: '' } : e
    );
  }

  /**
   * Selecciona una dependencia y conserva el cargo actual únicamente
   * cuando ese cargo pertenece a la dependencia seleccionada.
   */
  seleccionarDependencia(id: unknown): void {
    const dependencia = this.datosSedh()?.dependencias.find(
      d => String(d.id) === String(id)
    );

    if (!dependencia) return;

    const cargosDependencia = (this.datosSedh()?.cargos ?? []).filter(
      cargo => Number(cargo.idDependencia) === Number(dependencia.id)
    );

    this.empleadoEdicion.update(e => {
      if (!e) return e;

      const cargoActualPertenece = cargosDependencia.some(
        cargo => Number(cargo.id) === Number(e.idCargo)
      );

      return {
        ...e,
        idDependencia: Number(dependencia.id),
        dependencia: dependencia.nombre,
        ...(!cargoActualPertenece
          ? { idCargo: 0, cargo: '' }
          : {}),
      };
    });
  }

  /** Selecciona jefe inmediato por identidad. */
  seleccionarJefe(identidad: string): void {
    const jefe = this.datosSedh()?.jefesInmediatos.find(
      j => j.identidad === identidad
    );

    if (jefe) {
      this.actualizarCampo('jefeInmediato', {
        identidad: jefe.identidad,
        nombre: jefe.nombre,
      });
    }
  }

  seleccionarAccesoRol(index: number, idRol: unknown): void {
    const rol = this.datosSedh()?.roles.find(
      r => String(r.id) === String(idRol)
    );

    if (!rol) return;

    this.accesosEdicion.update(list =>
      list.map((a, i) =>
        i === index
          ? { ...a, idRol: Number(rol.id), rol: rol.nombre }
          : a
      )
    );
  }

  seleccionarAccesoModulo(index: number, idModulo: unknown): void {
    const mod = this.datosSedh()?.modulos.find(
      m => String(m.id) === String(idModulo)
    );

    if (!mod) return;

    this.accesosEdicion.update(list =>
      list.map((a, i) =>
        i === index
          ? { ...a, idModulo: Number(mod.id), modulo: mod.nombre }
          : a
      )
    );
  }

  agregarAcceso(): void {
    this.accesosEdicion.update(list => [
      ...list,
      { idRol: 0, rol: '', idModulo: 0, modulo: '' },
    ]);
  }

  eliminarAcceso(index: number): void {
    this.accesosEdicion.update(list =>
      list.filter((_, i) => i !== index)
    );
  }

  guardarCambios(): void {
    const edicion = this.empleadoEdicion();
    if (!edicion) return;

    if (!edicion.idCargo || Number(edicion.idCargo) <= 0) {
      this.toastService.mostrar(
        'error',
        'Seleccione un cargo válido para la dependencia seleccionada.'
      );
      return;
    }

    this.guardando.set(true);

    const empleadoOriginal = this.resultado()?.empleado;
    const emailEmpleado = empleadoOriginal?.email ?? '';

    if (!empleadoOriginal) return;

    // La edición laboral conserva los datos personales originales.
    const edicionLaboral: EmpleadoDetalle = {
      ...edicion,
      primerNombre: empleadoOriginal.primerNombre,
      segundoNombre: empleadoOriginal.segundoNombre,
      primerApellido: empleadoOriginal.primerApellido,
      segundoApellido: empleadoOriginal.segundoApellido,
      identidad: empleadoOriginal.identidad,
      idSexo: empleadoOriginal.idSexo,
      idEstadoCivil: empleadoOriginal.idEstadoCivil,
      idMunicipio: empleadoOriginal.idMunicipio,
    };

    this.service
      .actualizarEmpleado(
        emailEmpleado,
        edicionLaboral,
        this.accesosEdicion()
      )
      .subscribe({
        next: (resp) => {
          this.resultado.update(r =>
            r
              ? {
                  ...r,
                  empleado: { ...edicionLaboral },
                  accesosSistema: [...this.accesosEdicion()],
                }
              : r
          );

          this.modoEdicion.set(false);
          this.empleadoEdicion.set(null);
          this.accesosEdicion.set([]);
          this.guardando.set(false);

          this.toastService.mostrar(
            'exito',
            resp.mensaje || 'Empleado actualizado correctamente.'
          );
        },
        error: () => {
          this.guardando.set(false);

          this.toastService.mostrar(
            'error',
            'Ocurrió un error al guardar los cambios. Intente nuevamente.'
          );
        },
      });
  }
  iniciarEdicionPersonal(): void {
  if (!this.puedeEditarDatosPersonales()) return;

  const emp = this.resultado()?.empleado;
  if (!emp) return;

  this.datosPersonalesEdicion.set({
    priNombre: emp.primerNombre ?? '',
    segNombre: emp.segundoNombre ?? '',
    priApellido: emp.primerApellido ?? '',
    segApellido: emp.segundoApellido ?? '',
    numIdentidad: emp.identidad ?? '',
    idSexo: emp.idSexo ?? '',
    idEstadoCivil: emp.idEstadoCivil ?? '',
    idDepartamento: emp.idDepartamento ?? 0,
    idMunicipio: emp.idMunicipio ?? null,
  });

  this.modoEdicionPersonal.set(true);

  if (!this.datosSedh()) {
    this.cargandoDatos.set(true);

    this.service.cargarDatosSedh().subscribe({
      next: data => {
        this.datosSedh.set(data);
        this.cargandoDatos.set(false);
      },
      error: () => {
        this.cargandoDatos.set(false);
        this.toastService.mostrar(
          'error',
          'No se pudieron cargar los catálogos.'
        );
      },
    });
  }
}

actualizarDatoPersonal(
  campo: keyof DatosPersonalesEdicion,
  valor: string | number | null
): void {
  this.datosPersonalesEdicion.update(datos =>
    datos ? { ...datos, [campo]: valor } : datos
  );
}

seleccionarDepartamentoPersonal(id: number): void {
  this.datosPersonalesEdicion.update(datos =>
    datos
      ? { ...datos, idDepartamento: Number(id), idMunicipio: null }
      : datos
  );
}

cancelarEdicionPersonal(): void {
  this.modoEdicionPersonal.set(false);
  this.datosPersonalesEdicion.set(null);
}

guardarDatosPersonales(): void {
  if (!this.puedeEditarDatosPersonales()) {
    this.toastService.mostrar(
      'error',
      'No tiene autorización para modificar los datos personales.'
    );
    return;
  }

  const datos = this.datosPersonalesEdicion();
  const empleado = this.resultado()?.empleado;

  if (!datos || !empleado) return;

  if (
    !datos.priNombre.trim() ||
    !datos.priApellido.trim() ||
    !datos.numIdentidad.trim() ||
    !datos.idSexo ||
    !datos.idEstadoCivil ||
    !datos.idMunicipio
  ) {
    this.toastService.mostrar(
      'error',
      'Complete los campos personales obligatorios.'
    );
    return;
  }

  const municipio = this.datosSedh()?.municipios.find(
    m => Number(m.id) === Number(datos.idMunicipio)
  );

  if (!municipio ||
      Number(municipio.idDepartamento) !== Number(datos.idDepartamento)) {
    this.toastService.mostrar(
      'error',
      'Seleccione un municipio válido para el departamento.'
    );
    return;
  }

  this.guardandoDatosPersonales.set(true);

  this.service.actualizarDatosPersonales(empleado.email, {
    priNombre: datos.priNombre.trim(),
    segNombre: datos.segNombre.trim(),
    priApellido: datos.priApellido.trim(),
    segApellido: datos.segApellido.trim(),
    numIdentidad: datos.numIdentidad.trim(),
    idSexo: datos.idSexo,
    idEstadoCivil: datos.idEstadoCivil,
    idMunicipio: datos.idMunicipio,
  }).subscribe({
    next: resp => {
      this.service.buscarEmpleado(empleado.email).subscribe({
        next: resultado => {
          this.resultado.set(resultado);
          this.guardandoDatosPersonales.set(false);
          this.cancelarEdicionPersonal();

          this.toastService.mostrar(
            'exito',
            resp.mensaje || 'Datos personales actualizados correctamente.'
          );
        },
        error: () => {
          this.guardandoDatosPersonales.set(false);
          this.toastService.mostrar(
            'error',
            'Los datos se guardaron, pero no se pudo actualizar la información en pantalla. Vuelva a buscar al empleado.'
          );
        },
      });
    },
    error: err => {
      this.guardandoDatosPersonales.set(false);

      this.toastService.mostrar(
        'error',
        err.error?.message || 'No se pudieron actualizar los datos personales.'
      );
    },
  });
}
}
