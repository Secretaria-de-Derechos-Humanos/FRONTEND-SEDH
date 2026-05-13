import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActionButtonComponent } from '../../components/actionButton/actionButton.component';
import { EncabezadosPaginaComponent } from '../../components/encabezadosPagina/encabezadosPagina.component';
import { ModalAprobarPermisosRRHHComponent, SolicitudPermiso, RechazarPayload } from '../../components/modalAprobarPermisosRRHH/modalAprobarPermisosRRHH.component';
import { ModalAgentePermisosRRHHComponent, SolicitudAgentePermiso, HoraSalidaPayload, HoraRetornoPayload } from '../../components/modalAgentePermisosRRHH/modalAgentePermisosRRHH.component';
import { PendientesService, PendienteJefeInmediatoApi, SolicitudAgenteApi, RegistrarHoraSalidaParams, RegistrarHoraRetornoParams } from './pendientes.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

interface SolicitudPendiente {
  idPermiso: string;
  fechaSolicitud: Date;
  empleado: string;
  estado: string;
  dependencia: string;
  detalle: SolicitudPermiso;
}

@Component({
  selector: 'app-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ActionButtonComponent, EncabezadosPaginaComponent, ModalAprobarPermisosRRHHComponent, ModalAgentePermisosRRHHComponent],
  templateUrl: './pendientes.component.html',
  styleUrls: ['./pendientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PendientesComponent implements OnInit {
  private readonly pendientesService = inject(PendientesService);
  private readonly toastService       = inject(ToastService);
  private readonly authService        = inject(AuthService);
  private readonly platformId         = inject(PLATFORM_ID);

  solicitudesOriginales = signal<SolicitudPendiente[]>([]);

  // Filtros
  filtroFecha = signal<string>('');
  filtroEmpleado = signal<string>('');
  filtroEstado = signal<string>('');
  filtroDependencia = signal<string>('');

  // Solicitudes filtradas
  solicitudes = computed(() => {
    const originales = this.solicitudesOriginales();
    const fecha = this.filtroFecha().toLowerCase().trim();
    const empleado = this.filtroEmpleado().toLowerCase().trim();
    const estado = this.filtroEstado().toLowerCase().trim();
    const dependencia = this.filtroDependencia().toLowerCase().trim();

    return originales.filter(solicitud => {
      const fechaFormateada = this.formatearFecha(solicitud.fechaSolicitud).toLowerCase();
      const nombreEmpleado = solicitud.empleado.toLowerCase();
      const estadoSolicitud = solicitud.estado.toLowerCase();
      const nombreDependencia = solicitud.dependencia.toLowerCase();

      return (
        fechaFormateada.includes(fecha) &&
        nombreEmpleado.includes(empleado) &&
        estadoSolicitud.includes(estado) &&
        nombreDependencia.includes(dependencia)
      );
    });
  });

  cargando    = signal<boolean>(false);
  procesando  = signal<boolean>(false);

  modalPermisoVisible = signal<boolean>(false);
  solicitudSeleccionada = signal<SolicitudPermiso | null>(null);

  modalAgenteVisible = signal<boolean>(false);
  solicitudAgenteSeleccionada = signal<SolicitudAgentePermiso | null>(null);

  ngOnInit(): void {
    // Solo carga en el browser: evita mismatch de hidratación SSR
    if (isPlatformBrowser(this.platformId)) {
      this.cargarPendientes();
    }
  }

  abrirModalPermiso(solicitud: SolicitudPermiso): void {
    this.solicitudSeleccionada.set(solicitud);
    this.modalPermisoVisible.set(true);
  }

  cerrarModalPermiso(): void {
    this.modalPermisoVisible.set(false);
    this.solicitudSeleccionada.set(null);
  }

  cerrarModalAgente(): void {
    this.modalAgenteVisible.set(false);
    this.solicitudAgenteSeleccionada.set(null);
  }

  onRegistrarSalida(payload: HoraSalidaPayload): void {
    const solicitud = this.solicitudesOriginales().find(s => s.idPermiso === payload.id);
    if (!solicitud || this.procesando()) return;

    this.procesando.set(true);
    const tipo = solicitud.detalle.nom_tipo_solicitud ?? `PERMISO ${solicitud.detalle.tipoSolicitud}`;

    const params: RegistrarHoraSalidaParams = {
      idpermiso:  payload.id,
      tipo,
      horaSalida: payload.horaSalida
    };

    this.pendientesService.registrarHoraSalida(params).subscribe({
      next: mensaje => {
        this.toastService.mostrar('exito', mensaje);
        this.cerrarModalAgente();
        this.cargarPendientes();
        this.procesando.set(false);
      },
      error: err => {
        const msg = (err?.error?.error?.message as string | undefined)
          ?? 'No fue posible registrar la hora de salida. Intente de nuevo.';
        this.toastService.mostrar('error', msg);
        this.procesando.set(false);
      }
    });
  }

  onRegistrarRetorno(payload: HoraRetornoPayload): void {
    const solicitud = this.solicitudesOriginales().find(s => s.idPermiso === payload.id);
    if (!solicitud || this.procesando()) return;

    this.procesando.set(true);
    const tipo = solicitud.detalle.nom_tipo_solicitud ?? `PERMISO ${solicitud.detalle.tipoSolicitud}`;

    const params: RegistrarHoraRetornoParams = {
      idpermiso:   payload.id,
      tipo,
      horaRetorno: payload.horaRetorno
    };

    this.pendientesService.registrarHoraRetorno(params).subscribe({
      next: mensaje => {
        this.toastService.mostrar('exito', mensaje);
        this.cerrarModalAgente();
        this.cargarPendientes();
        this.procesando.set(false);
      },
      error: err => {
        const msg = (err?.error?.error?.message as string | undefined)
          ?? 'No fue posible registrar la hora de retorno. Intente de nuevo.';
        this.toastService.mostrar('error', msg);
        this.procesando.set(false);
      }
    });
  }

  aprobarSolicitud(id: string): void {
    const solicitud = this.solicitudesOriginales().find(s => s.idPermiso === id);
    if (!solicitud || this.procesando()) return;

    this.procesando.set(true);
    const tipo = solicitud.detalle.nom_tipo_solicitud ?? `PERMISO ${solicitud.detalle.tipoSolicitud}`;
    const rol  = this.authService.currentUser()?.roles[0]?.r;

    // Al aprobar, no se envían horas ni motRechazo
    const params = { idpermiso: id, tipo, motRechazo: null };

    const peticion$ = rol === 3
      ? this.pendientesService.responderPermisoSubgerente(params)
      : this.pendientesService.responderPermiso(params);

    peticion$.subscribe({
      next: resultado => {
        this.toastService.mostrar('exito', resultado);
        this.cerrarModalPermiso();
        this.cargarPendientes();
        this.procesando.set(false);
      },
      error: err => {
        const msg = (err?.error?.error?.message as string | undefined)
          ?? 'No fue posible procesar la solicitud. Intente de nuevo.';
        this.toastService.mostrar('error', msg);
        this.procesando.set(false);
      }
    });
  }

  rechazarSolicitud(payload: RechazarPayload): void {
    const solicitud = this.solicitudesOriginales().find(s => s.idPermiso === payload.id);
    if (!solicitud || this.procesando()) return;

    this.procesando.set(true);
    const tipo       = solicitud.detalle.nom_tipo_solicitud ?? `PERMISO ${solicitud.detalle.tipoSolicitud}`;
    const esPersonal = solicitud.detalle.tipoSolicitud === 'PERSONAL';
    const rol        = this.authService.currentUser()?.roles[0]?.r;

    // Solo enviar 'horas' si es PERMISO PERSONAL (rechazado)
    const params: any = { idpermiso: payload.id, tipo, motRechazo: payload.motRechazo };
    if (esPersonal) {
      params.horas = this.normalizarHoras(solicitud.detalle.hor_solicitadas);
    }

    const peticion$ = rol === 3
      ? this.pendientesService.responderPermisoSubgerente(params)
      : this.pendientesService.responderPermiso(params);

    peticion$.subscribe({
      next: resultado => {
        this.toastService.mostrar('exito', resultado);
        this.cerrarModalPermiso();
        this.cargarPendientes();
        this.procesando.set(false);
      },
      error: err => {
        const msg = (err?.error?.error?.message as string | undefined)
          ?? 'No fue posible procesar la solicitud. Intente de nuevo.';
        this.toastService.mostrar('error', msg);
        this.procesando.set(false);
      }
    });
  }

  verDetalles(id: string): void {
    const solicitud = this.solicitudesOriginales().find(s => s.idPermiso === id);
    if (!solicitud) return;

    const rol = this.authService.currentUser()?.roles[0]?.r;
    if (rol === 4) {
      this.solicitudAgenteSeleccionada.set(solicitud.detalle as SolicitudAgentePermiso);
      this.modalAgenteVisible.set(true);
    } else {
      this.abrirModalPermiso(solicitud.detalle);
    }
  }

  /**
   * Maneja la acción seleccionada del speed dial
   * @param action - ID de la acción seleccionada
   * @param solicitudId - ID de la solicitud
   */
  handleAction(action: string, solicitudId: string): void {
    const rol = this.authService.currentUser()?.roles[0]?.r;
    switch (action) {
      case 'view':
        this.verDetalles(solicitudId);
        break;
      case 'edit':
        if (rol === 4) {
          this.verDetalles(solicitudId);
        } else {
          this.aprobarSolicitud(solicitudId);
        }
        break;
      case 'delete':
        this.verDetalles(solicitudId);
        break;
    }
  }

  cargarPendientes(): void {
    this.cargando.set(true);

    const rol = this.authService.currentUser()?.roles[0]?.r;

    if (rol === 4) {
      this.pendientesService.getSolicitudesAgente().subscribe({
        next: items => {
          this.solicitudesOriginales.set(this.mapSolicitudesAgenteToTable(items));
          this.cargando.set(false);
        },
        error: () => {
          this.solicitudesOriginales.set([]);
          this.cargando.set(false);
        }
      });
      return;
    }

    const peticion$ = rol === 3
      ? this.pendientesService.getPendientesSubgerente()
      : this.pendientesService.getPendientesJefeInmediato();

    peticion$.subscribe({
      next: pendientes => {
        this.solicitudesOriginales.set(this.mapPendientesApiToTable(pendientes));
        this.cargando.set(false);
      },
      error: () => {
        this.solicitudesOriginales.set([]);
        this.cargando.set(false);
      }
    });
  }

  private mapPendientesApiToTable(pendientes: PendienteJefeInmediatoApi[]): SolicitudPendiente[] {
    return pendientes
      .map(pendiente => {
        const empleado = this.construirNombreCompleto(pendiente);
        const fechaSolicitud = new Date(`${pendiente.fecha}T00:00:00`);
        const detalle: SolicitudPermiso = {
          id: pendiente.idpermiso,
          id_permiso: pendiente.idpermiso,
          empleado,
          pri_nombre: pendiente.empleado.nombre,
          seg_nombre: pendiente.empleado.segundoNombre,
          pri_apellido: pendiente.empleado.apellido,
          seg_apellido: pendiente.empleado.segundoApellido,
          tipoSolicitud: pendiente.tipoPermiso,
          nom_tipo_solicitud: pendiente.tipo,
          dependencia: pendiente.dependencia,
          nom_dependencia: pendiente.dependencia,
          fechaSolicitud,
          fec_solicitud: fechaSolicitud,
          nom_cargo: pendiente.cargo,
          hor_solicitadas: pendiente.horasSolicitadas ?? null,
          motivo: pendiente.motivo,
          cat_emergencia: pendiente.emergencia ?? null,
          nom_estado: pendiente.estado,
          mot_rechazo: pendiente.motRechazo
        };

        return {
          idPermiso: pendiente.idpermiso,
          fechaSolicitud,
          empleado,
          estado: pendiente.estado,
          dependencia: pendiente.dependencia,
          detalle
        };
      })
      .sort((a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime());
  }

  private mapSolicitudesAgenteToTable(solicitudes: SolicitudAgenteApi[]): SolicitudPendiente[] {
    return solicitudes
      .map(item => {
        const empleado = [
          item.empleado.nombre,
          item.empleado.segundoNombre,
          item.empleado.apellido,
          item.empleado.segundoApellido
        ].filter(Boolean).join(' ');
        const fechaSolicitud = new Date(`${item.fecha}T00:00:00`);
        const detalle: SolicitudAgentePermiso = {
          id:                item.idpermiso,
          id_permiso:        item.idpermiso,
          empleado,
          pri_nombre:        item.empleado.nombre,
          seg_nombre:        item.empleado.segundoNombre,
          pri_apellido:      item.empleado.apellido,
          seg_apellido:      item.empleado.segundoApellido,
          tipoSolicitud:     item.tipoPermiso,
          nom_tipo_solicitud: item.tipo,
          dependencia:       item.dependencia,
          nom_dependencia:   item.dependencia,
          fechaSolicitud,
          fec_solicitud:     fechaSolicitud,
          nom_cargo:         item.cargo,
          hor_solicitadas:   item.horasSolicitadas,
          motivo:            item.motivo,
          cat_emergencia:    null,
          nom_estado:        item.estado,
          mot_rechazo:       null,
          hor_salida:        item.horaSalida,
          hor_retorno:       item.horaRetorno
        };
        return {
          idPermiso: item.idpermiso,
          fechaSolicitud,
          empleado,
          estado: item.estado,
          dependencia: item.dependencia,
          detalle
        };
      })
      .sort((a, b) => b.fechaSolicitud.getTime() - a.fechaSolicitud.getTime());
  }

  private construirNombreCompleto(pendiente: PendienteJefeInmediatoApi): string {
    return [
      pendiente.empleado.nombre,
      pendiente.empleado.segundoNombre,
      pendiente.empleado.apellido,
      pendiente.empleado.segundoApellido
    ]
      .filter(Boolean)
      .join(' ');
  }

  private normalizarHoras(horas: string | null | undefined): string | null {
    if (!horas) return null;

    const valor = horas.trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(valor)) {
      return valor;
    }

    if (/^\d{2}:\d{2}$/.test(valor)) {
      return `${valor}:00`;
    }

    const [hh = '00', mm = '00', ss = '00'] = valor.split(':');
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
