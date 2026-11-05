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

    const emailEmpleado = this.resultado()?.empleado.email ?? '';

    this.service
      .actualizarEmpleado(
        emailEmpleado,
        edicion,
        this.accesosEdicion()
      )
      .subscribe({
        next: (resp) => {
          this.resultado.update(r =>
            r
              ? {
                  ...r,
                  empleado: { ...edicion },
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
}
