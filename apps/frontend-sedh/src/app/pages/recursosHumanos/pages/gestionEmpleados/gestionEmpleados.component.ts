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
} from './gestionEmpleados.service';

// ── Definición de tabs ────────────────────────────────────────────────────────

type TabId = 'personales' | 'laboral' | 'accesos' | 'historial';

interface Tab {
  id:     TabId;
  titulo: string;
}

const TABS: Tab[] = [
  { id: 'personales', titulo: 'Datos personales'   },
  { id: 'laboral',    titulo: 'Información laboral' },
  { id: 'accesos',    titulo: 'Accesos al sistema'  },
  { id: 'historial',  titulo: 'Historial de cargos' },
];

@Component({
  selector: 'app-gestion-empleados',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './gestionEmpleados.component.html',
  styleUrls: ['./gestionEmpleados.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionEmpleadosComponent {
  private readonly service = inject(GestionEmpleadosService);

  // ── Estado ──────────────────────────────────────────────────────────────────
  searchQuery     = signal('');
  resultado       = signal<ResultadoBusquedaEmpleado | null>(null);
  isLoading       = signal(false);
  errorMessage    = signal('');
  tabAbierta      = signal<TabId>('personales');
  modoEdicion     = signal(false);
  empleadoEdicion = signal<EmpleadoDetalle | null>(null);
  accesosEdicion  = signal<AccesoSistema[]>([]);
  guardando       = signal(false);
  mensajeEdicion  = signal('');
  errorEdicion    = signal(false);

  readonly tabs = TABS;

  // ── Computados ──────────────────────────────────────────────────────────────
  nombreCompleto = computed(() => {
    const emp = this.resultado()?.empleado;
    if (!emp) return '';
    return [emp.primerNombre, emp.segundoNombre, emp.primerApellido, emp.segundoApellido]
      .filter(Boolean)
      .join(' ');
  });

  // ── Acciones ────────────────────────────────────────────────────────────────
  buscarEmpleado(): void {
    const query = this.searchQuery().trim();
    if (!query) {
      this.errorMessage.set('Ingrese un nombre, correo institucional o número de identidad para buscar.');
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
      error: () => {
        this.errorMessage.set('No se encontró ningún empleado con ese criterio de búsqueda.');
        this.isLoading.set(false);
      },
    });
  }

  abrirTab(id: TabId): void {
    this.tabAbierta.set(this.tabAbierta() === id ? ('' as TabId) : id);
  }

  estaAbierta(id: TabId): boolean {
    return this.tabAbierta() === id;
  }

  iniciarEdicion(): void {
    const emp = this.resultado()?.empleado;
    if (!emp) return;
    this.empleadoEdicion.set({ ...emp });
    this.accesosEdicion.set(this.resultado()!.accesosSistema.map(a => ({ ...a })));
    this.mensajeEdicion.set('');
    this.errorEdicion.set(false);
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.empleadoEdicion.set(null);
    this.accesosEdicion.set([]);
    this.mensajeEdicion.set('');
    this.errorEdicion.set(false);
  }

  actualizarCampo(campo: keyof EmpleadoDetalle, valor: unknown): void {
    this.empleadoEdicion.update(e => e ? { ...e, [campo]: valor } : e);
  }

  guardarCambios(): void {
    const edicion = this.empleadoEdicion();
    if (!edicion) return;
    this.guardando.set(true);
    this.mensajeEdicion.set('');

    // TODO: integrar con endpoint de actualización de empleado
    setTimeout(() => {
      this.resultado.update(r =>
        r ? { ...r, empleado: { ...edicion }, accesosSistema: [...this.accesosEdicion()] } : r
      );
      this.modoEdicion.set(false);
      this.empleadoEdicion.set(null);
      this.accesosEdicion.set([]);
      this.guardando.set(false);
      this.mensajeEdicion.set('Cambios guardados correctamente.');
      this.errorEdicion.set(false);
      setTimeout(() => this.mensajeEdicion.set(''), 3500);
    }, 800);
  }

  agregarAcceso(): void {
    this.accesosEdicion.update(list => [...list, { rol: '', modulo: '' }]);
  }

  eliminarAcceso(index: number): void {
    this.accesosEdicion.update(list => list.filter((_, i) => i !== index));
  }

  actualizarAcceso(index: number, campo: keyof AccesoSistema, valor: string): void {
    this.accesosEdicion.update(list =>
      list.map((a, i) => i === index ? { ...a, [campo]: valor } : a)
    );
  }
}
