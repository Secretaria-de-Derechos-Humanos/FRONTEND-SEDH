import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Constancia,
  ConstanciasApiService,
  FinalidadConstancia,
  ModalidadSalarioConstancia,
} from '../../../core/services/constancias-api.service';

@Component({
  selector: 'app-solicitar-constancia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
  ],
  templateUrl: './solicitar-constancia.component.html',
  styleUrl: './solicitar-constancia.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarConstanciaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly constanciasApi =
    inject(ConstanciasApiService);

  // =========================================================
  // DATOS
  // =========================================================

  readonly solicitudes =
    signal<Constancia[]>([]);

  readonly cargandoSolicitudes =
    signal(false);

  readonly guardando =
    signal(false);

  readonly descargando =
    signal<string | null>(null);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  // =========================================================
  // FORMULARIO
  // =========================================================

  readonly formulario =
    this.fb.nonNullable.group({
      finalidades: this.fb.nonNullable.control<
        FinalidadConstancia[]
      >(
        [],
        [
          Validators.required,
        ],
      ),

      modalidadSalario:
        this.fb.nonNullable.control<
          ModalidadSalarioConstancia | ''
        >(
          '',
          [
            Validators.required,
          ],
        ),

      observaciones:
        this.fb.nonNullable.control(
          '',
          [
            Validators.maxLength(500),
          ],
        ),
    });

  // =========================================================
  // OPCIONES
  // =========================================================

  readonly finalidadesDisponibles:
    {
      valor: FinalidadConstancia;
      nombre: string;
    }[] = [
      {
        valor: 'PERSONAL',
        nombre: 'Constancia personal',
      },
      {
        valor: 'INJUPEM',
        nombre:
          'Instituto Nacional de Jubilaciones y Pensiones de los Empleados y Funcionarios del Poder Ejecutivo (INJUPEM)',
      },
      {
        valor: 'SIAFI',
        nombre:
          'Sistema de Administración Financiera Integrada (SIAFI)',
      },
    ];

  readonly modalidadesSalario:
    {
      valor: ModalidadSalarioConstancia;
      nombre: string;
    }[] = [
      {
        valor: 'CON_DEDUCCIONES',
        nombre: 'Con deducciones',
      },
      {
        valor: 'SIN_DEDUCCIONES',
        nombre: 'Sin deducciones',
      },
    ];

  // =========================================================
  // COMPUTADOS
  // =========================================================

  readonly formularioValido = computed(() => {
    return this.formulario.valid;
  });

  readonly tieneSolicitudes = computed(() => {
    return this.solicitudes().length > 0;
  });

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // =========================================================
  // FINALIDADES
  // =========================================================

  seleccionarFinalidad(
    finalidad: FinalidadConstancia,
  ): void {
    const actuales =
      this.formulario.controls.finalidades.value;

    if (actuales.includes(finalidad)) {
      this.formulario.controls.finalidades.setValue(
        actuales.filter(
          (item) => item !== finalidad,
        ),
      );
    } else {
      this.formulario.controls.finalidades.setValue([
        ...actuales,
        finalidad,
      ]);
    }

    this.formulario.controls.finalidades.markAsTouched();

    this.errorMessage.set('');
  }

  estaSeleccionada(
    finalidad: FinalidadConstancia,
  ): boolean {
    return this.formulario.controls.finalidades.value.includes(
      finalidad,
    );
  }

  // =========================================================
  // CARGAR SOLICITUDES
  // =========================================================

  cargarSolicitudes(): void {
    this.cargandoSolicitudes.set(true);

    this.constanciasApi
      .obtenerMisSolicitudes()
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes.set(
            solicitudes ?? [],
          );

          this.cargandoSolicitudes.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.cargandoSolicitudes.set(false);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar sus solicitudes de constancia.',
            ),
          );
        },
      });
  }

  // =========================================================
  // ENVIAR SOLICITUD
  // =========================================================

  enviarSolicitud(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();

      this.errorMessage.set(
        'Debe completar los campos obligatorios antes de enviar la solicitud.',
      );

      return;
    }

    const valores =
      this.formulario.getRawValue();

    if (
      !valores.finalidades ||
      valores.finalidades.length === 0
    ) {
      this.errorMessage.set(
        'Debe seleccionar al menos una finalidad.',
      );

      return;
    }

    if (!valores.modalidadSalario) {
      this.errorMessage.set(
        'Debe seleccionar la modalidad de salario.',
      );

      return;
    }

    this.guardando.set(true);

    this.constanciasApi
      .crearSolicitud({
        finalidades: valores.finalidades,
        modalidadSalario:
          valores.modalidadSalario,
        observaciones:
          valores.observaciones.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);

          this.successMessage.set(
            'La solicitud de constancia fue registrada correctamente.',
          );

          this.formulario.reset({
            finalidades: [],
            modalidadSalario: '',
            observaciones: '',
          });

          this.cargarSolicitudes();
        },

        error: (error: HttpErrorResponse) => {
          this.guardando.set(false);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No fue posible registrar la solicitud de constancia.',
            ),
          );
        },
      });
  }

  // =========================================================
  // DESCARGAR CONSTANCIA
  // =========================================================

  descargarConstancia(
    solicitud: Constancia,
  ): void {
    if (!solicitud.idConstancia) {
      return;
    }

    this.errorMessage.set('');
    this.descargando.set(
      solicitud.idConstancia,
    );

    this.constanciasApi
      .descargarConstancia(
        solicitud.idConstancia,
      )
      .subscribe({
        next: (respuesta) => {
          const blob = respuesta.body;

          if (!blob) {
            this.descargando.set(null);

            this.errorMessage.set(
              'No se recibió el archivo de la constancia.',
            );

            return;
          }

          const nombreArchivo =
            this.obtenerNombreArchivo(
              respuesta.headers.get(
                'content-disposition',
              ),
              solicitud.nombreArchivo ??
                'constancia-trabajo',
            );

          const url =
            window.URL.createObjectURL(blob);

          const enlace =
            document.createElement('a');

          enlace.href = url;
          enlace.download = nombreArchivo;

          document.body.appendChild(enlace);
          enlace.click();
          enlace.remove();

          window.URL.revokeObjectURL(url);

          this.descargando.set(null);
        },

        error: (error: HttpErrorResponse) => {
          this.descargando.set(null);

          this.errorMessage.set(
            this.obtenerMensajeError(
              error,
              'No fue posible descargar la constancia.',
            ),
          );
        },
      });
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  obtenerNombreEstado(
    solicitud: Constancia,
  ): string {
    return (
      solicitud.estadoSolicitud?.nomEstado ??
      solicitud.estadoSolicitud?.nomestado ??
      'EN PROCESO'
    );
  }

  esEnProceso(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(solicitud)
        .toUpperCase() === 'EN PROCESO'
    );
  }

  esAprobada(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(solicitud)
        .toUpperCase() === 'APROBADO'
    );
  }

  esRechazada(
    solicitud: Constancia,
  ): boolean {
    return (
      this.obtenerNombreEstado(solicitud)
        .toUpperCase() === 'RECHAZADO'
    );
  }

  // =========================================================
  // INFORMACIÓN DE FINALIDADES
  // =========================================================

  obtenerNombreFinalidad(
    finalidad: string,
  ): string {
    const encontrada =
      this.finalidadesDisponibles.find(
        (item) => item.valor === finalidad,
      );

    return (
      encontrada?.nombre ??
      finalidad
    );
  }

  obtenerFinalidadesTexto(
    solicitud: Constancia,
  ): string {
    if (
      !solicitud.finalidades ||
      solicitud.finalidades.length === 0
    ) {
      return 'No especificada';
    }

    return solicitud.finalidades
      .map((item) =>
        this.obtenerNombreFinalidad(
          item.finalidad,
        ),
      )
      .join(', ');
  }

  // =========================================================
  // MODALIDAD DE SALARIO
  // =========================================================

  obtenerNombreModalidadSalario(
    modalidad: string,
  ): string {
    if (
      modalidad === 'CON_DEDUCCIONES'
    ) {
      return 'Con deducciones';
    }

    if (
      modalidad === 'SIN_DEDUCCIONES'
    ) {
      return 'Sin deducciones';
    }

    return modalidad;
  }

  // =========================================================
  // FECHA ESTIMADA
  // =========================================================

  calcularFechaEntrega(
    fechaSolicitud: string | Date,
  ): Date {
    const fecha =
      new Date(fechaSolicitud);

    let diasHabiles = 0;

    while (diasHabiles < 3) {
      fecha.setDate(
        fecha.getDate() + 1,
      );

      const dia =
        fecha.getDay();

      if (
        dia !== 0 &&
        dia !== 6
      ) {
        diasHabiles++;
      }
    }

    return fecha;
  }

  // =========================================================
  // LIMPIAR MENSAJES
  // =========================================================

  limpiarMensajes(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // =========================================================
  // VALIDACIONES DEL FORMULARIO
  // =========================================================

  get finalidadesInvalidas(): boolean {
    const control =
      this.formulario.controls.finalidades;

    return (
      control.invalid &&
      (control.touched ||
        control.dirty)
    );
  }

  get modalidadSalarioInvalida(): boolean {
    const control =
      this.formulario.controls.modalidadSalario;

    return (
      control.invalid &&
      (control.touched ||
        control.dirty)
    );
  }

  get observacionesInvalidas(): boolean {
    const control =
      this.formulario.controls.observaciones;

    return (
      control.invalid &&
      (control.touched ||
        control.dirty)
    );
  }

  // =========================================================
  // UTILIDADES
  // =========================================================

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajeDefecto: string,
  ): string {
    if (
      error.error?.message
    ) {
      if (
        Array.isArray(
          error.error.message,
        )
      ) {
        return error.error.message.join(
          ', ',
        );
      }

      return String(
        error.error.message,
      );
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    return mensajeDefecto;
  }

  private obtenerNombreArchivo(
    contentDisposition:
      | string
      | null,
    nombreDefecto: string,
  ): string {
    if (!contentDisposition) {
      return nombreDefecto;
    }

    const coincidencia =
      contentDisposition.match(
        /filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i,
      );

    if (!coincidencia?.[1]) {
      return nombreDefecto;
    }

    try {
      return decodeURIComponent(
        coincidencia[1],
      );
    } catch {
      return coincidencia[1];
    }
  }
}
