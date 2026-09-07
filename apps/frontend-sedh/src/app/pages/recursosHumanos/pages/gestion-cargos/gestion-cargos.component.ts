import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Cargo,
  CatalogosService,
  Dependencia,
} from '../../../../services/catalogos.service';

@Component({
  selector: 'app-gestion-cargos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './gestion-cargos.component.html',
  styleUrl: './gestion-cargos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionCargosComponent implements OnInit {

  private readonly catalogosService =
    inject(CatalogosService);

  // ============================================================
  // DATOS
  // ============================================================

  protected readonly dependencias =
    signal<Dependencia[]>([]);

  protected readonly cargos =
    signal<Cargo[]>([]);

  protected readonly cargandoDependencias =
    signal(false);

  protected readonly cargandoCargos =
    signal(false);

  protected readonly guardando =
    signal(false);

  protected readonly mensaje =
    signal('');

  protected readonly error =
    signal('');

  // ============================================================
  // FORMULARIO
  // ============================================================

  protected dependenciaSeleccionada =
    signal<number | null>(null);

  protected nombreCargo =
    signal('');

  protected cargoEditando =
    signal<number | null>(null);

  // ============================================================
  // INICIO
  // ============================================================

  ngOnInit(): void {
    this.cargarDependencias();
  }

  // ============================================================
  // DEPENDENCIAS
  // ============================================================

  private cargarDependencias(): void {

    this.cargandoDependencias.set(true);
    this.error.set('');

    this.catalogosService
      .listarDependencias()
      .subscribe({
        next: (dependencias) => {

          this.dependencias.set(
            dependencias,
          );

          this.cargandoDependencias.set(
            false,
          );
        },

        error: (error) => {

          console.error(
            'Error cargando dependencias:',
            error,
          );

          this.error.set(
            'No se pudieron cargar las dependencias.',
          );

          this.cargandoDependencias.set(
            false,
          );
        },
      });
  }

  // ============================================================
  // SELECCIONAR DEPENDENCIA
  // ============================================================

  protected cambiarDependencia(
    event: Event,
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const id =
      Number(select.value);

    if (!id) {

      this.dependenciaSeleccionada.set(
        null,
      );

      this.cargos.set([]);

      return;
    }

    this.dependenciaSeleccionada.set(
      id,
    );

    this.cargarCargos(id);
  }

  // ============================================================
  // CARGAR CARGOS
  // ============================================================

  private cargarCargos(
    idDependencia: number,
  ): void {

    this.cargandoCargos.set(true);
    this.error.set('');

    this.catalogosService
      .listarCargosPorDependencia(
        idDependencia,
      )
      .subscribe({
        next: (cargos) => {

          this.cargos.set(
            cargos,
          );

          this.cargandoCargos.set(
            false,
          );
        },

        error: (error) => {

          console.error(
            'Error cargando cargos:',
            error,
          );

          this.error.set(
            'No se pudieron cargar los cargos.',
          );

          this.cargandoCargos.set(
            false,
          );
        },
      });
  }

  // ============================================================
  // NUEVO CARGO
  // ============================================================

  protected nuevoCargo(): void {

    this.cargoEditando.set(null);

    this.nombreCargo.set('');

    this.mensaje.set('');
    this.error.set('');
  }

  // ============================================================
  // EDITAR CARGO
  // ============================================================

  protected editarCargo(
    cargo: Cargo,
  ): void {

    this.cargoEditando.set(
      cargo.idCargo,
    );

    this.nombreCargo.set(
      cargo.nomCargo ?? '',
    );

    this.mensaje.set('');
    this.error.set('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ============================================================
  // CANCELAR EDICIÓN
  // ============================================================

  protected cancelarEdicion(): void {

    this.cargoEditando.set(null);

    this.nombreCargo.set('');

    this.mensaje.set('');
    this.error.set('');
  }

  // ============================================================
  // GUARDAR
  // ============================================================

  protected guardarCargo(): void {

    const nombre =
      this.nombreCargo().trim();

    const idDependencia =
      this.dependenciaSeleccionada();

    this.mensaje.set('');
    this.error.set('');

    if (!idDependencia) {

      this.error.set(
        'Debe seleccionar una dependencia.',
      );

      return;
    }

    if (!nombre) {

      this.error.set(
        'Debe ingresar el nombre del cargo.',
      );

      return;
    }

    if (nombre.length > 100) {

      this.error.set(
        'El nombre del cargo no puede superar los 100 caracteres.',
      );

      return;
    }

    this.guardando.set(true);

    const idEditando =
      this.cargoEditando();

    // ========================================================
    // CREAR
    // ========================================================

    if (idEditando === null) {

      this.catalogosService
        .crearCargo({
          nomCargo: nombre,
          idDependencia,
        })
        .subscribe({

          next: () => {

            this.mensaje.set(
              'Cargo creado correctamente.',
            );

            this.nombreCargo.set('');

            this.guardando.set(false);

            this.cargarCargos(
              idDependencia,
            );
          },

          error: (error) => {

            console.error(
              'Error creando cargo:',
              error,
            );

            this.error.set(
              error?.error?.message ??
              'No se pudo crear el cargo.',
            );

            this.guardando.set(false);
          },
        });

      return;
    }

    // ========================================================
    // ACTUALIZAR
    // ========================================================

    this.catalogosService
      .actualizarCargo(
        idEditando,
        {
          nomCargo: nombre,
          idDependencia,
        },
      )
      .subscribe({

        next: () => {

          this.mensaje.set(
            'Cargo actualizado correctamente.',
          );

          this.cargoEditando.set(
            null,
          );

          this.nombreCargo.set('');

          this.guardando.set(false);

          this.cargarCargos(
            idDependencia,
          );
        },

        error: (error) => {

          console.error(
            'Error actualizando cargo:',
            error,
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo actualizar el cargo.',
          );

          this.guardando.set(false);
        },
      });
  }

  // ============================================================
  // ELIMINAR
  // ============================================================

  protected eliminarCargo(
    cargo: Cargo,
  ): void {

    const confirmado =
      window.confirm(
        `¿Está seguro de eliminar el cargo "${cargo.nomCargo}"?`,
      );

    if (!confirmado) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    this.catalogosService
      .eliminarCargo(
        cargo.idCargo,
      )
      .subscribe({

        next: () => {

          this.mensaje.set(
            'Cargo eliminado correctamente.',
          );

          const idDependencia =
            this.dependenciaSeleccionada();

          if (idDependencia) {
            this.cargarCargos(
              idDependencia,
            );
          }
        },

        error: (error) => {

          console.error(
            'Error eliminando cargo:',
            error,
          );

          this.error.set(
            error?.error?.message ??
            'No se pudo eliminar el cargo.',
          );
        },
      });
  }
}
