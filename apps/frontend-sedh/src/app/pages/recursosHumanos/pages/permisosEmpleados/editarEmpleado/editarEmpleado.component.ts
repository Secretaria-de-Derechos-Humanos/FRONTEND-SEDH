import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  AccesoSistema,
  DatosSedh,
  EmpleadoDetalle,
  GestionEmpleadosService,
  ResultadoBusquedaEmpleado,
} from '../../gestionEmpleados/gestionEmpleados.service';

@Component({
  selector: 'app-editar-empleado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './editarEmpleado.component.html',
  styleUrls: ['./editarEmpleado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarEmpleadoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly empleadosApi =
    inject(GestionEmpleadosService);

  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly emailEmpleado = signal('');

  readonly catalogos = signal<DatosSedh | null>(null);
  readonly empleadoActual = signal<EmpleadoDetalle | null>(null);

  /**
   * Módulos seleccionados para el rol escogido.
   */
  readonly modulosSeleccionados = signal<number[]>([]);

  readonly cargos = computed(
    () => this.catalogos()?.cargos ?? [],
  );

  readonly tiposContratacion = computed(
    () => this.catalogos()?.tiposContratacion ?? [],
  );

  readonly sexos = computed(
    () => this.catalogos()?.sexos ?? [],
  );

  readonly estadosCiviles = computed(
    () => this.catalogos()?.estadosCiviles ?? [],
  );

  readonly municipios = computed(
    () => this.catalogos()?.municipios ?? [],
  );

  readonly roles = computed(
    () => this.catalogos()?.roles ?? [],
  );

  readonly modulos = computed(
    () => this.catalogos()?.modulos ?? [],
  );

  readonly jefesInmediatos = computed(
    () => this.catalogos()?.jefesInmediatos ?? [],
  );

  readonly formulario = this.fb.nonNullable.group({
    primerNombre: [{ value: '', disabled: true }],
    segundoNombre: [{ value: '', disabled: true }],
    primerApellido: [{ value: '', disabled: true }],
    segundoApellido: [{ value: '', disabled: true }],
    identidad: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],

    telefono: [
      '',
      [
        Validators.maxLength(20),
      ],
    ],

    fechaIngreso: [
      '',
      Validators.required,
    ],

    idTipoContratacion: [
      '',
      Validators.required,
    ],

    idCargo: [
      0,
      [
        Validators.required,
        Validators.min(1),
      ],
    ],

    idSexo: [
      '',
      Validators.required,
    ],

    idEstadoCivil: [
      '',
      Validators.required,
    ],

    idMunicipio: [
      0,
      [
        Validators.required,
        Validators.min(1),
      ],
    ],

    jefeInmediatoIdentidad: [
      '',
      Validators.required,
    ],

    idRol: [
      0,
      [
        Validators.required,
        Validators.min(1),
      ],
    ],

    activo: [true],
  });

  ngOnInit(): void {
    const email =
      this.route.snapshot.queryParamMap.get('email');

    if (!email) {
      this.errorMessage.set(
        'No se recibió el correo del empleado.',
      );
      return;
    }

    this.emailEmpleado.set(email);
    this.cargarInformacion(email);
  }

  private cargarInformacion(
    email: string,
  ): void {
    this.cargando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    forkJoin({
      resultado:
        this.empleadosApi.buscarEmpleado(email),

      catalogos:
        this.empleadosApi.cargarDatosSedh(),
    }).subscribe({
      next: ({ resultado, catalogos }) => {
        this.catalogos.set(catalogos);
        this.cargarResultado(resultado);
        this.cargando.set(false);
      },

      error: (error: unknown) => {
        console.error(
          'Error cargando empleado:',
          error,
        );

        this.errorMessage.set(
          this.obtenerMensajeError(
            error,
            'No se pudo cargar la información del empleado.',
          ),
        );

        this.cargando.set(false);
      },
    });
  }

  private cargarResultado(
    resultado: ResultadoBusquedaEmpleado,
  ): void {
    const empleado = resultado.empleado;
    const accesos = resultado.accesosSistema ?? [];

    this.empleadoActual.set(empleado);

    const primerAcceso =
      accesos.length > 0
        ? accesos[0]
        : null;

    const idsModulos = [
      ...new Set(
        accesos
          .map((acceso) => Number(acceso.idModulo))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ];

    this.modulosSeleccionados.set(idsModulos);

    this.formulario.patchValue({
      primerNombre:
        empleado.primerNombre ?? '',

      segundoNombre:
        empleado.segundoNombre ?? '',

      primerApellido:
        empleado.primerApellido ?? '',

      segundoApellido:
        empleado.segundoApellido ?? '',

      identidad:
        empleado.identidad ?? '',

      email:
        empleado.email ?? '',

      telefono:
        empleado.telefono ?? '',

      fechaIngreso:
        empleado.fechaIngreso
          ? String(empleado.fechaIngreso).slice(0, 10)
          : '',

      idTipoContratacion:
        empleado.idTipoContratacion ?? '',

      idCargo:
        Number(empleado.idCargo) || 0,

      idSexo:
        empleado.idSexo ?? '',

      idEstadoCivil:
        empleado.idEstadoCivil ?? '',

      idMunicipio:
        Number(empleado.idMunicipio) || 0,

      jefeInmediatoIdentidad:
        empleado.jefeInmediato?.identidad ?? '',

      idRol:
        Number(primerAcceso?.idRol) || 0,

      activo:
        empleado.activo ?? true,
    });
  }

  moduloEstaSeleccionado(
    idModulo: number,
  ): boolean {
    return this.modulosSeleccionados()
      .includes(Number(idModulo));
  }

  cambiarModulo(
    idModulo: number,
    seleccionado: boolean,
  ): void {
    const modulo = Number(idModulo);

    this.modulosSeleccionados.update(
      (modulosActuales) => {
        if (seleccionado) {
          return [
            ...new Set([
              ...modulosActuales,
              modulo,
            ]),
          ];
        }

        return modulosActuales.filter(
          (id) => id !== modulo,
        );
      },
    );
  }

  guardar(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.errorMessage.set(
        'Complete correctamente los campos obligatorios.',
      );
      return;
    }

    const idRol =
      Number(this.formulario.controls.idRol.value);

    if (
      !idRol ||
      this.modulosSeleccionados().length === 0
    ) {
      this.errorMessage.set(
        'Debe seleccionar un rol y al menos un módulo.',
      );
      return;
    }

    const empleadoActual =
      this.empleadoActual();

    if (!empleadoActual) {
      this.errorMessage.set(
        'No se encontró la información original del empleado.',
      );
      return;
    }

    const valores =
      this.formulario.getRawValue();
console.log('VALORES DEL FORMULARIO:', valores);
console.log('ACTIVO:', valores.activo);
console.log('TIPO ACTIVO:', typeof valores.activo);
    const empleadoEditado: EmpleadoDetalle = {
      ...empleadoActual,

      fechaIngreso:
        valores.fechaIngreso,

      activo:
        valores.activo,

      telefono:
        valores.telefono.trim(),

      idTipoContratacion:
        valores.idTipoContratacion,

      idCargo:
        Number(valores.idCargo),

      idSexo:
        valores.idSexo,

      idEstadoCivil:
        valores.idEstadoCivil,

      idMunicipio:
        Number(valores.idMunicipio),

      jefeInmediato: {
        identidad:
          valores.jefeInmediatoIdentidad,
        nombre:
          this.obtenerNombreJefe(
            valores.jefeInmediatoIdentidad,
          ),
      },
    };

    const accesos: AccesoSistema[] =
      this.modulosSeleccionados().map(
        (idModulo) => ({
          idRol,
          idModulo,

          rol:
            this.obtenerNombreRol(idRol),

          modulo:
            this.obtenerNombreModulo(idModulo),
        }),
      );

    this.guardando.set(true);

    this.empleadosApi
      .actualizarEmpleado(
        this.emailEmpleado(),
        empleadoEditado,
        accesos,
      )
      .subscribe({
        next: (respuesta) => {
          this.successMessage.set(
            respuesta?.mensaje ??
              'Empleado actualizado correctamente. El usuario debe cerrar sesión y volver a ingresar para aplicar el nuevo rol.',
          );

          this.guardando.set(false);

          this.cargarInformacion(
            this.emailEmpleado(),
          );
        },

        error: (error: unknown) => {
          console.error(
            'Error actualizando empleado:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo actualizar el empleado.',
            ),
          );

          this.guardando.set(false);
        },
      });
  }

  regresar(): void {
    this.router.navigate([
      '/rrhh/gestion-empleados',
    ]);
  }

  private obtenerNombreRol(
    idRol: number,
  ): string {
    return (
      this.roles().find(
        (rol) =>
          Number(rol.id) === Number(idRol),
      )?.nombre ?? ''
    );
  }

  private obtenerNombreModulo(
    idModulo: number,
  ): string {
    return (
      this.modulos().find(
        (modulo) =>
          Number(modulo.id) === Number(idModulo),
      )?.nombre ?? ''
    );
  }

  private obtenerNombreJefe(
    identidad: string,
  ): string {
    return (
      this.jefesInmediatos().find(
        (jefe) =>
          jefe.identidad === identidad,
      )?.nombre ?? ''
    );
  }

  private obtenerMensajeError(
    error: unknown,
    predeterminado: string,
  ): string {
    const respuesta = error as {
      error?: {
        message?: string;
        mensaje?: string;
        error?: {
          message?: string;
          details?: string[];
        };
        data?: {
          message?: string;
          mensaje?: string;
        };
      };
      message?: string;
    };

    const detalles =
      respuesta.error?.error?.details;

    if (
      Array.isArray(detalles) &&
      detalles.length > 0
    ) {
      return detalles.join(', ');
    }

    return (
      respuesta.error?.error?.message ??
      respuesta.error?.data?.mensaje ??
      respuesta.error?.data?.message ??
      respuesta.error?.mensaje ??
      respuesta.error?.message ??
      respuesta.message ??
      predeterminado
    );
  }
}
