import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed,  inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Empleado, EmpleadosApiService } from '../../../../../core/services/empleados-api';

@Component({
  selector:
    'app-buscar-editar-empleados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl:
    './buscarEditarEmpleados.component.html',
  styleUrls: [
    './buscarEditarEmpleados.component.css',
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BuscarEditarEmpleadosComponent
  implements OnInit, OnDestroy {
  private readonly empleadosApi =
    inject(EmpleadosApiService);
  private readonly router =
    inject(Router);
  private readonly destruir$ =
    new Subject<void>();
  readonly empleados =
    signal<Empleado[]>([]);
  readonly totalEmpleados =
    signal<number>(0);
  readonly cargando =
    signal<boolean>(false);
  readonly errorMessage =
    signal<string>('');
  readonly buscador =
    new FormControl('', {
      nonNullable: true,
    });
  readonly tieneResultados =
    computed(
      () => this.empleados().length > 0,
    );
  ngOnInit(): void {
  this.cargarEmpleados();
  this.buscador.valueChanges
    .pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destruir$),
    )
    .subscribe((termino) => {
      this.cargarEmpleados(termino);
    });
}
  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }
  agregarEmpleado(): void {
  this.router.navigate([
    '/rrhh/empleados/crear',
  ]);
}
  cargarEmpleados(
  termino = '',
): void {
  this.cargando.set(true);
  this.errorMessage.set('');

  this.empleadosApi
    .listar(termino)
    .subscribe({
      next: (empleados: Empleado[]) => {
        console.log(
          'Empleados recibidos:',
          empleados,
        );
        this.empleados.set(empleados);
        this.totalEmpleados.set(
          empleados.length,
        );
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error(
          'Error al consultar empleados:',
          error,
        );
        this.empleados.set([]);
        this.totalEmpleados.set(0);
        this.errorMessage.set(
          error?.error?.error?.message ??
          error?.error?.message ??
          error?.message ??
          'No se pudieron consultar los empleados.',
        );
        this.cargando.set(false);
      },
    });
}
  limpiarBusqueda(): void {
    this.buscador.setValue('');
  }
  nombreEmpleado(
    empleado: Empleado,
  ): string {
    if (empleado.nombreCompleto) {
      return empleado.nombreCompleto;
    }
    return [
      empleado.priNombre,
      empleado.segNombre,
      empleado.priApellido,
      empleado.segApellido,
    ]
      .filter(Boolean)
      .join(' ');
  }
  nombreCargo(
    empleado: Empleado,
  ): string {
    return (
      empleado.cargo?.nomCargo ??
      empleado.cargo?.nomcargo ??
      empleado.cargo?.nombre ??
      'Sin cargo'
    );
  }
  nombreTipoContratacion(
  empleado: Empleado,
): string {
  return (
    empleado.tipoContratacion?.nombre ??
    'Sin tipo de contratación'
  );
}
  editarEmpleado(
    empleado: Empleado,
  ): void {
    this.router.navigate(
      [
        '/rrhh/empleados/editar',
      ],
      {
        queryParams: {
          email:
            empleado.emailInstitucional,
        },
      },
    );
  }

}
