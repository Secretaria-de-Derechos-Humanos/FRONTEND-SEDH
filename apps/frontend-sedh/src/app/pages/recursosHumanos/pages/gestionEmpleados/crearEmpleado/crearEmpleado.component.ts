import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  EmpleadosApiService,
  OpcionCatalogo,
} from '../../../../../core/services/empleados-api';

interface VincularUsuarioEmpleadoPayload {
  idUsuario: string;
  empleado: {
    fecIngLaboral: string;
    actLaboralmente: boolean;
    numIdentidad: string;
    numTelefono: string | null;
    idTipoContratacion: string;
    idCargo: number;
    idSupInmediato: string | null;
    idSexo: string;
    idEstadoCivil: string;
    idMunicipio: number | null;
  };
}

@Component({
  selector: 'app-crear-empleado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './crearEmpleado.component.html',
  styleUrls: ['./crearEmpleado.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearEmpleadoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly empleadosApi = inject(EmpleadosApiService);

  readonly idUsuario = signal('');
  readonly idRolUsuario = signal<number | null>(null);

  readonly cargandoCatalogos = signal(false);
  readonly guardando = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly cargos = signal<OpcionCatalogo[]>([]);
  readonly tiposContratacion = signal<OpcionCatalogo[]>([]);
  readonly sexos = signal<OpcionCatalogo[]>([]);
  readonly estadosCiviles = signal<OpcionCatalogo[]>([]);
  readonly municipios = signal<OpcionCatalogo[]>([]);

  readonly fechaMaxima =
    new Date().toISOString().slice(0, 10);

  readonly formulario = this.fb.nonNullable.group({
    priNombre: [
      '',
      [
        Validators.required,
        Validators.maxLength(50),
      ],
    ],
    segNombre: [
      '',
      Validators.maxLength(50),
    ],
    priApellido: [
      '',
      [
        Validators.required,
        Validators.maxLength(50),
      ],
    ],
    segApellido: [
      '',
      Validators.maxLength(50),
    ],
    numIdentidad: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{13}$/),
      ],
    ],
    numTelefono: [
      '',
      Validators.pattern(/^\d{8,9}$/),
    ],
    emailInstitucional: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(50),
      ],
    ],
    fecIngLaboral: [
      '',
      Validators.required,
    ],
    idCargo: [
      '',
      Validators.required,
    ],
    idTipoContratacion: [
      '',
      Validators.required,
    ],
    idSexo: [
      '',
      Validators.required,
    ],
    idEstadoCivil: [
      '',
      Validators.required,
    ],
    idMunicipio: [''],
    idSupInmediato: [''],
    actLaboralmente: [true],
  });

  ngOnInit(): void {
    this.cargarDatosUsuarioRecibido();
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.errorMessage.set('');

    this.empleadosApi
      .obtenerDatosSedh()
      .subscribe({
        next: (respuesta: { data?: unknown } | unknown) => {
          const respuestaTipada = respuesta as {
            data?: Record<string, unknown>;
          };

          const datos =
            respuestaTipada?.data ??
            (respuesta as Record<string, unknown>) ??
            {};

          this.cargos.set(
            this.normalizarCatalogo(
              (datos['cargos'] ??
                datos['listaCargos'] ??
                []) as unknown[],
              [
                'idCargo',
                'idcargo',
                'id',
              ],
              [
                'nomCargo',
                'nomcargo',
                'nombre',
                'descripcion',
              ],
            ),
          );

          this.tiposContratacion.set(
            this.normalizarCatalogo(
              (datos['tiposContratacion'] ??
                datos['tiposContrataciones'] ??
                datos['tipoContratacion'] ??
                []) as unknown[],
              [
                'idTipoContratacion',
                'idtipocontratacion',
                'id',
              ],
              [
                'nomTipoContratacion',
                'nomtipocontratacion',
                'nombre',
                'descripcion',
              ],
            ),
          );

          this.sexos.set(
            this.normalizarCatalogo(
              (datos['sexos'] ?? []) as unknown[],
              [
                'idSexo',
                'idsexo',
                'id',
              ],
              [
                'nomSexo',
                'nomsexo',
                'nombre',
                'descripcion',
              ],
            ),
          );

          this.estadosCiviles.set(
            this.normalizarCatalogo(
              (datos['estadosCiviles'] ??
                datos['estadoCivil'] ??
                []) as unknown[],
              [
                'idEstadoCivil',
                'idestadocivil',
                'id',
              ],
              [
                'nomEstadoCivil',
                'nomestadocivil',
                'nombre',
                'descripcion',
              ],
            ),
          );

          this.municipios.set(
            this.normalizarCatalogo(
              (datos['municipios'] ?? []) as unknown[],
              [
                'idMunicipio',
                'idmunicipio',
                'id',
              ],
              [
                'nomMunicipio',
                'nommunicipio',
                'nombre',
                'descripcion',
              ],
            ),
          );

          this.cargandoCatalogos.set(false);
        },
        error: (error: unknown) => {
          console.error(
            'Error al cargar catálogos:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudieron cargar los catálogos.',
            ),
          );

          this.cargandoCatalogos.set(false);
        },
      });
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

    const idUsuario = this.idUsuario();

    if (!idUsuario) {
      this.errorMessage.set(
        'No se recibió el usuario que se vinculará con el empleado. Cree primero el usuario desde Gestión de Usuarios.',
      );
      return;
    }

    const valores = this.formulario.getRawValue();

    const payload: VincularUsuarioEmpleadoPayload = {
      idUsuario,
      empleado: {
        fecIngLaboral:
          valores.fecIngLaboral,
        actLaboralmente:
          valores.actLaboralmente,
        numIdentidad:
          valores.numIdentidad.trim(),
        numTelefono:
          valores.numTelefono.trim() || null,
        idTipoContratacion:
          valores.idTipoContratacion,
        idCargo:
          Number(valores.idCargo),
        idSupInmediato:
          valores.idSupInmediato.trim() || null,
        idSexo:
          valores.idSexo,
        idEstadoCivil:
          valores.idEstadoCivil,
        idMunicipio:
          valores.idMunicipio
            ? Number(valores.idMunicipio)
            : null,
      },
    };

    console.log(
      'Payload para vincular empleado:',
      payload,
    );

    this.guardando.set(true);

    this.empleadosApi
      .vincularUsuarioEmpleado(payload)
      .subscribe({
        next: (respuesta: unknown) => {
          console.log(
            'Empleado vinculado:',
            respuesta,
          );

          const respuestaTipada = respuesta as {
            data?: {
              status?: string;
              success?: boolean;
              mensaje?: string;
              message?: string;
            };
            status?: string;
            success?: boolean;
            mensaje?: string;
            message?: string;
          };

          const datos =
            respuestaTipada.data ??
            respuestaTipada;

          if (
            datos?.status === 'ERROR' ||
            datos?.success === false
          ) {
            this.errorMessage.set(
              datos?.mensaje ??
                datos?.message ??
                'No se pudo vincular el empleado.',
            );
            this.guardando.set(false);
            return;
          }

          this.successMessage.set(
            datos?.mensaje ??
              datos?.message ??
              'Empleado vinculado correctamente.',
          );

          this.guardando.set(false);

          setTimeout(() => {
            this.router.navigate([
              '/rrhh/gestion-empleados',
            ]);
          }, 1200);
        },
        error: (error: unknown) => {
          console.error(
            'Error al vincular empleado:',
            error,
          );

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No se pudo vincular el empleado.',
            ),
          );

          this.guardando.set(false);
        },
      });
  }

  cancelar(): void {
    this.router.navigate([
      '/rrhh/gestion-empleados',
    ]);
  }

  private cargarDatosUsuarioRecibido(): void {
    const parametros =
      this.route.snapshot.queryParamMap;

    const idUsuario =
      parametros.get('idUsuario') ?? '';

    const email =
      parametros.get('email') ?? '';

    const priNombre =
      parametros.get('priNombre') ?? '';

    const segNombre =
      parametros.get('segNombre') ?? '';

    const priApellido =
      parametros.get('priApellido') ?? '';

    const segApellido =
      parametros.get('segApellido') ?? '';

    const idRol = Number(
      parametros.get('idRol') ?? 0,
    );

    this.idUsuario.set(idUsuario);
    this.idRolUsuario.set(
      idRol > 0 ? idRol : null,
    );

    this.formulario.patchValue({
      priNombre,
      segNombre,
      priApellido,
      segApellido,
      emailInstitucional: email,
    });

    if (idUsuario && email) {
      this.formulario.controls.priNombre.disable();
      this.formulario.controls.segNombre.disable();
      this.formulario.controls.priApellido.disable();
      this.formulario.controls.segApellido.disable();
      this.formulario.controls.emailInstitucional.disable();
    }
  }

  private normalizarCatalogo(
    elementos: unknown[],
    posiblesIds: string[],
    posiblesNombres: string[],
  ): OpcionCatalogo[] {
    if (!Array.isArray(elementos)) {
      return [];
    }

    return elementos
      .map((elemento) => {
        const registro = elemento as Record<string, unknown>;

        const id = posiblesIds
          .map((campo) => registro?.[campo])
          .find(
            (valor) =>
              valor !== undefined &&
              valor !== null,
          );

        const nombre = posiblesNombres
          .map((campo) => registro?.[campo])
          .find(
            (valor) =>
              valor !== undefined &&
              valor !== null,
          );

        return {
          id: id as string | number,
          nombre: String(
            nombre ?? id ?? '',
          ),
        };
      })
      .filter(
        (elemento) =>
          elemento.id !== undefined &&
          Boolean(elemento.nombre),
      );
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    const respuesta = error as {
      error?: {
        error?: {
          message?: string;
        };
        message?: string;
        mensaje?: string;
      };
      message?: string;
    };

    return (
      respuesta?.error?.error?.message ??
      respuesta?.error?.mensaje ??
      respuesta?.error?.message ??
      respuesta?.message ??
      mensajePredeterminado
    );
  }
}
