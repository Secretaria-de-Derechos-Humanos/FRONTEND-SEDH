import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Empleado {
  emailInstitucional: string;
  nombre: string;
  fechaIngreso: string;
  dni: string;
  telefono: string;
  tipoContrato: string;
  idTipoContrato: number | null;
  cargo: string;
  idCargo: number | null;
  dependencia: string;
  idDependencia: number | null;
  jefeInmediato: string;
  sexo: string;
  estadoCivil: string;
  idEstadoCivil: number | null;
  actLaboral: number;
  horasDisponibles: string;
}

interface CatalogoItem {
  id: number;
  descripcion: string;
  idDependencia?: number;
}

@Component({
  selector: 'app-gestion-empleados',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gestionEmpleados.component.html',
  styleUrls: ['./gestionEmpleados.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionEmpleadosComponent {

  searchQuery    = signal('');
  empleado       = signal<Empleado | null>(null);
  modoEdicion    = signal(false);
  errorMessage   = signal('');
  isLoading      = signal(false);
  guardandoCambios = signal(false);
  mensajeEdicion = signal('');
  errorEdicion   = signal(false);

  dependencias       = signal<CatalogoItem[]>([]);
  cargos             = signal<CatalogoItem[]>([]);
  tiposContrataciones = signal<CatalogoItem[]>([]);
  estadosCiviles     = signal<CatalogoItem[]>([]);

  filteredCargosEdicion = computed(() => {
    const emp = this.empleado();
    if (!emp?.idDependencia) return [];
    return this.cargos().filter(c => c.idDependencia === Number(emp.idDependencia));
  });

  mostrarModal    = signal(false);
  nuevasHoras     = signal('');
  mensajeHoras    = signal('');
  errorHoras      = signal(false);
  actualizandoHoras = signal(false);

  private readonly mockEmpleado: Empleado = {
    emailInstitucional: 'juan.perez@sedh.gob.hn',
    nombre: 'Juan Carlos Pérez López',
    fechaIngreso: '2020-03-15',
    dni: '0801199500123',
    telefono: '98765432',
    tipoContrato: 'Contrato por tiempo definido',
    idTipoContrato: null,
    cargo: 'Analista de sistemas',
    idCargo: null,
    dependencia: 'Dirección de tecnología',
    idDependencia: null,
    jefeInmediato: 'María González',
    sexo: 'M',
    estadoCivil: 'Soltero(a)',
    idEstadoCivil: null,
    actLaboral: 1,
    horasDisponibles: '08:00:00'
  };

  actualizarCampo(campo: keyof Empleado, valor: unknown): void {
    this.empleado.update(e => e ? { ...e, [campo]: valor } : e);
  }

  buscarEmpleado(): void {
    if (!this.searchQuery().trim()) {
      this.errorMessage.set('Ingrese un correo institucional para buscar.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.empleado.set(null);
    this.modoEdicion.set(false);

    // TODO: reemplazar con llamada HTTP
    setTimeout(() => {
      const query = this.searchQuery().toLowerCase().trim();
      if (query.includes('@sedh.gob.hn')) {
        this.empleado.set({ ...this.mockEmpleado, emailInstitucional: this.searchQuery().trim() });
      } else {
        this.errorMessage.set('No se encontró ningún empleado con ese correo institucional.');
      }
      this.isLoading.set(false);
    }, 600);
  }

  toggleEdicion(): void {
    if (this.modoEdicion()) {
      this.guardarCambios();
    } else {
      this.mensajeEdicion.set('');
      this.modoEdicion.set(true);
      this.cargarDatosEdicion();
    }
  }

  cargarDatosEdicion(): void {
    if (this.dependencias().length > 0) {
      this.preSeleccionarCatalogos();
      return;
    }
    // TODO: reemplazar con llamada HTTP GET a /datos-sedh
    const mockData = {
      dependencias: [
        { id: 1, descripcion: 'Dirección de tecnología' },
        { id: 2, descripcion: 'Recursos humanos' }
      ],
      cargos: [
        { id: 1, descripcion: 'Analista de sistemas',  idDependencia: 1 },
        { id: 2, descripcion: 'Desarrollador',          idDependencia: 1 },
        { id: 3, descripcion: 'Gestor de RRHH',         idDependencia: 2 }
      ],
      tipos_contrataciones: [
        { id: 1, descripcion: 'Contrato por tiempo definido' },
        { id: 2, descripcion: 'Contrato permanente' }
      ],
      estados_civiles: [
        { id: 1, descripcion: 'Soltero(a)' },
        { id: 2, descripcion: 'Casado(a)' }
      ]
    };
    this.dependencias.set(mockData.dependencias);
    this.cargos.set(mockData.cargos);
    this.tiposContrataciones.set(mockData.tipos_contrataciones);
    this.estadosCiviles.set(mockData.estados_civiles);
    this.preSeleccionarCatalogos();
  }

  preSeleccionarCatalogos(): void {
    const emp = this.empleado();
    if (!emp) return;
    const dep    = this.dependencias().find(d => d.descripcion === emp.dependencia);
    const cargo  = this.cargos().find(c => c.descripcion === emp.cargo);
    const tipo   = this.tiposContrataciones().find(t => t.descripcion === emp.tipoContrato);
    const estado = this.estadosCiviles().find(e => e.descripcion === emp.estadoCivil);
    this.empleado.update(e => e ? {
      ...e,
      idDependencia:  dep?.id    ?? null,
      idCargo:        cargo?.id  ?? null,
      idTipoContrato: tipo?.id   ?? null,
      idEstadoCivil:  estado?.id ?? null
    } : e);
  }

  onSelectDependencia(idDependencia: number): void {
    this.empleado.update(e => e ? { ...e, idDependencia, idCargo: null } : e);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.mensajeEdicion.set('');
    this.buscarEmpleado();
  }

  guardarCambios(): void {
    const emp = this.empleado();
    if (!emp) return;
    this.guardandoCambios.set(true);
    this.mensajeEdicion.set('');

    // TODO: reemplazar con llamada HTTP PUT a /empleados/actualizar
    setTimeout(() => {
      this.guardandoCambios.set(false);
      this.modoEdicion.set(false);
      this.mensajeEdicion.set('Cambios guardados correctamente.');
      this.errorEdicion.set(false);

      const dep    = this.dependencias().find(d => d.id === Number(emp.idDependencia));
      const cargo  = this.cargos().find(c => c.id === Number(emp.idCargo));
      const tipo   = this.tiposContrataciones().find(t => t.id === Number(emp.idTipoContrato));
      const estado = this.estadosCiviles().find(e => e.id === Number(emp.idEstadoCivil));

      this.empleado.update(e => e ? {
        ...e,
        dependencia:   dep?.descripcion    ?? e.dependencia,
        cargo:         cargo?.descripcion  ?? e.cargo,
        tipoContrato:  tipo?.descripcion   ?? e.tipoContrato,
        estadoCivil:   estado?.descripcion ?? e.estadoCivil
      } : e);

      setTimeout(() => this.mensajeEdicion.set(''), 3000);
    }, 800);
  }

  abrirModalHoras(): void {
    const emp = this.empleado();
    if (!emp) return;
    this.nuevasHoras.set(emp.horasDisponibles);
    this.mensajeHoras.set('');
    this.mostrarModal.set(true);
    document.body.classList.add('modal-open');
  }

  cerrarModalHoras(): void {
    this.mostrarModal.set(false);
    document.body.classList.remove('modal-open');
  }

  actualizarHoras(): void {
    if (!this.nuevasHoras().trim()) {
      this.mensajeHoras.set('Ingrese un valor para las horas disponibles.');
      this.errorHoras.set(true);
      return;
    }
    this.actualizandoHoras.set(true);
    this.mensajeHoras.set('');

    // TODO: reemplazar con llamada HTTP PUT a /actualizarHorasDisponibles/
    setTimeout(() => {
      const horas = /^\d{2}:\d{2}$/.test(this.nuevasHoras())
        ? `${this.nuevasHoras()}:00`
        : this.nuevasHoras();
      this.empleado.update(e => e ? { ...e, horasDisponibles: horas } : e);
      this.actualizandoHoras.set(false);
      this.mensajeHoras.set('Horas disponibles actualizadas correctamente.');
      this.errorHoras.set(false);
      setTimeout(() => this.cerrarModalHoras(), 1500);
    }, 800);
  }
}
