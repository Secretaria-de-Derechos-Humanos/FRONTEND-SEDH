import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GestionEmpleadosService,
  DatosSedh,
  AccesoSistema,
  NuevoEmpleadoPayload,
} from '../../pages/recursosHumanos/pages/gestionEmpleados/gestionEmpleados.service';
import { ToastService } from '../../services/toast.service';

type TabId = 'personales' | 'laboral' | 'accesos';

interface Tab { id: TabId; titulo: string; }

const TABS: Tab[] = [
  { id: 'personales', titulo: 'Datos personales'   },
  { id: 'laboral',    titulo: 'Información laboral' },
  { id: 'accesos',    titulo: 'Accesos al sistema'  },
];

const EMPLEADO_VACIO: NuevoEmpleadoPayload = {
  email:              '',
  primerNombre:       '',
  segundoNombre:      '',
  primerApellido:     '',
  segundoApellido:    '',
  fechaIngreso:       '',
  activo:             true,
  identidad:          '',
  telefono:           '',
  idTipoContratacion: '',
  idCargo:            0,
  idSexo:             '',
  idEstadoCivil:      '',
  idMunicipio:        0,
  jefeInmediato:      { identidad: '' },
};

@Component({
  selector: 'app-modal-agregar-empleado',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modalAgregarEmpleado.component.html',
  styleUrls: ['./modalAgregarEmpleado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalAgregarEmpleadoComponent {
  private readonly service      = inject(GestionEmpleadosService);
  private readonly toastService = inject(ToastService);

  visible = input.required<boolean>();
  cerrar  = output<void>();
  creado  = output<void>();

  readonly tabs = TABS;

  tabAbierta    = signal<TabId>('personales');
  empleado      = signal<NuevoEmpleadoPayload>({ ...EMPLEADO_VACIO });
  accesos       = signal<AccesoSistema[]>([{ idRol: 0, rol: '', idModulo: 0, modulo: '' }]);
  contrasena    = signal('');
  datosSedh     = signal<DatosSedh | null>(null);
  cargandoDatos = signal(false);
  guardando     = signal(false);

  municipiosFiltrados = computed(() => {
    const depSelec = this._idDepartamentoSeleccionado();
    const todos = this.datosSedh()?.municipios ?? [];
    return depSelec ? todos.filter(m => m.idDepartamento === depSelec) : todos;
  });

  formularioValido = computed(() => {
    const e = this.empleado();
    const tieneAccesos =
      this.accesos().length > 0 &&
      this.accesos().every(a => a.idRol > 0 && a.idModulo > 0);

    return (
      e.email.trim()            !== '' &&
      e.primerNombre.trim()     !== '' &&
      e.segundoNombre.trim()    !== '' &&
      e.primerApellido.trim()   !== '' &&
      e.segundoApellido.trim()  !== '' &&
      e.identidad.trim()        !== '' &&
      e.telefono.trim()         !== '' &&
      e.fechaIngreso            !== '' &&
      e.idTipoContratacion      !== '' &&
      e.idCargo                  > 0   &&
      e.idSexo                  !== '' &&
      e.idEstadoCivil           !== '' &&
      e.idMunicipio              > 0   &&
      e.jefeInmediato.identidad.trim() !== '' &&
      this.contrasena().trim()  !== '' &&
      tieneAccesos
    );
  });

  // Departamento seleccionado (lo mantenemos por separado pues no está en NuevoEmpleadoPayload)
  private _idDepartamentoSeleccionado = signal<number>(0);
  idDepartamentoSeleccionado = this._idDepartamentoSeleccionado.asReadonly();

  // ── Ciclo de apertura ──────────────────────────────────────────────────────
  ngOnChanges(): void {
    if (this.visible()) {
      this.resetear();
      if (!this.datosSedh()) {
        this.cargandoDatos.set(true);
        this.service.cargarDatosSedh().subscribe({
          next:  d => { this.datosSedh.set(d); this.cargandoDatos.set(false); },
          error: () => this.cargandoDatos.set(false),
        });
      }
    }
  }

  private resetear(): void {
    this.tabAbierta.set('personales');
    this.empleado.set({ ...EMPLEADO_VACIO });
    this.accesos.set([{ idRol: 0, rol: '', idModulo: 0, modulo: '' }]);
    this.contrasena.set('');
    this._idDepartamentoSeleccionado.set(0);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  abrirTab(id: TabId): void { this.tabAbierta.set(id); }
  estaAbierta(id: TabId): boolean { return this.tabAbierta() === id; }

  // ── Catálogos ──────────────────────────────────────────────────────────────
  actualizarCampo(campo: keyof NuevoEmpleadoPayload, valor: unknown): void {
    this.empleado.update(e => ({ ...e, [campo]: valor }));
  }

  seleccionarCatalogo(
    id: unknown,
    campoId: keyof NuevoEmpleadoPayload,
    lista: Array<{ id: unknown; nombre: string }>
  ): void {
    const item = lista.find(i => String(i.id) === String(id));
    if (!item) return;
    this.empleado.update(e => ({ ...e, [campoId]: item.id }));
  }

  seleccionarDepartamento(idDep: unknown): void {
    this._idDepartamentoSeleccionado.set(Number(idDep));
    this.empleado.update(e => ({ ...e, idMunicipio: 0 }));
  }

  seleccionarJefe(identidad: string): void {
    this.empleado.update(e => ({ ...e, jefeInmediato: { identidad } }));
  }

  // ── Accesos ────────────────────────────────────────────────────────────────
  agregarAcceso(): void {
    this.accesos.update(list => [...list, { idRol: 0, rol: '', idModulo: 0, modulo: '' }]);
  }

  eliminarAcceso(index: number): void {
    this.accesos.update(list => list.filter((_, i) => i !== index));
  }

  seleccionarAccesoRol(index: number, idRol: unknown): void {
    const rol = this.datosSedh()?.roles.find(r => String(r.id) === String(idRol));
    if (!rol) return;
    this.accesos.update(list =>
      list.map((a, i) => i === index ? { ...a, idRol: Number(rol.id), rol: rol.nombre } : a)
    );
  }

  seleccionarAccesoModulo(index: number, idModulo: unknown): void {
    const mod = this.datosSedh()?.modulos.find(m => String(m.id) === String(idModulo));
    if (!mod) return;
    this.accesos.update(list =>
      list.map((a, i) => i === index ? { ...a, idModulo: Number(mod.id), modulo: mod.nombre } : a)
    );
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  guardar(): void {
    this.guardando.set(true);
    const accesosPayload = this.accesos().map(a => ({ idRol: a.idRol, idModulo: a.idModulo }));

    this.service.crearEmpleado(this.empleado(), accesosPayload, this.contrasena()).subscribe({
      next: (resp) => {
        this.guardando.set(false);
        this.toastService.mostrar('exito', resp.mensaje || 'Empleado creado correctamente.');
        this.creado.emit();
        this.cerrar.emit();
      },
      error: () => {
        this.guardando.set(false);
        this.toastService.mostrar('error', 'Ocurrió un error al crear el empleado. Intente nuevamente.');
      },
    });
  }

  onCerrar(): void {
    if (!this.guardando()) this.cerrar.emit();
  }
}
