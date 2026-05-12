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
  searchQuery  = signal('');
  resultado    = signal<ResultadoBusquedaEmpleado | null>(null);
  isLoading    = signal(false);
  errorMessage = signal('');
  tabAbierta   = signal<TabId>('personales');

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
}
