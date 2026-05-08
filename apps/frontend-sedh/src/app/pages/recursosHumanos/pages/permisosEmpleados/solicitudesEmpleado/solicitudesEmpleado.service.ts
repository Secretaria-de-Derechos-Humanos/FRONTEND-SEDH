import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../services/auth.service';
import {
  EP_RRHH_MIS_SOLICITUDES,
  EP_RRHH_MIS_SOLICITUDES_EMERGENCIA,
  EP_RRHH_DATOS_PERMISO
} from '../../../../../config/api.endpoints';
import { Solicitud } from './solicitudesEmpleado.component';

// ── Modelo público del modal ────────────────────────────────────────────────

export interface DatosPermiso {
  nombre:           string;
  dependencia:      string;
  cargo:            string;
  horasDisponibles: string; // formato HH:MM
}

// ── Tipos de respuesta de la API ────────────────────────────────────────────

interface SolicitudApi {
  tipo: string;
  fecha: string;
  estado: 'EN PROCESO' | 'APROBADO' | 'RECHAZADO';
  emergencia: boolean;
  motRechazo: string | null;
  priAprobacion: string | null;
  segAprobacion: string | null;
}

interface MisSolicitudesResponse {
  success: boolean;
  data: {
    email: string;
    solicitudes: SolicitudApi[];
  };
  message: string;
}

interface MisSolicitudesEmergenciaResponse {
  success: boolean;
  data: {
    email: string;
    emergencias: SolicitudApi[];
  };
  message: string;
}

interface DatosPermisoApi {
  prinombre:         string;
  segnombre:         string | null;
  priapellido:       string;
  segapellido:       string | null;
  dependencia:       string;
  cargo:             string;
  horas_disponibles: string;
}

interface DatosPermisoResponse {
  success:   boolean;
  data:      DatosPermisoApi;
  message:   string;
  timestamp: string;
}

// ── Mapper API → modelo interno ─────────────────────────────────────────────

function mapSolicitud(s: SolicitudApi): Solicitud {
  return {
    fec_solicitud:      s.fecha,
    nom_tipo_solicitud: s.tipo,
    nom_estado:         s.estado,
    pri_aporbacion:     s.priAprobacion,
    seg_aprobacion:     s.segAprobacion,
    mot_rechazo:        s.motRechazo,
  };
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SolicitudesEmpleadoService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = environment.apiBaseUrl;

  private get emailBody(): { email: string } {
    return { email: this.authService.currentUser()?.email ?? '' };
  }

  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http
      .post<MisSolicitudesResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES}`,
        this.emailBody
      )
      .pipe(map(r => r.data.solicitudes.map(mapSolicitud)));
  }

  getMisSolicitudesEmergencia(): Observable<Solicitud[]> {
    return this.http
      .post<MisSolicitudesEmergenciaResponse>(
        `${this.base}${EP_RRHH_MIS_SOLICITUDES_EMERGENCIA}`,
        this.emailBody
      )
      .pipe(map(r => r.data.emergencias.map(mapSolicitud)));
  }

  getDatosPermiso(): Observable<DatosPermiso> {
    return this.http
      .post<DatosPermisoResponse>(
        `${this.base}${EP_RRHH_DATOS_PERMISO}`,
        this.emailBody
      )
      .pipe(
        map(r => ({
          nombre: [
            r.data.prinombre,
            r.data.segnombre  ?? '',
            r.data.priapellido,
            r.data.segapellido ?? ''
          ].filter(Boolean).join(' '),
          dependencia:      r.data.dependencia,
          cargo:            r.data.cargo,
          horasDisponibles: r.data.horas_disponibles.substring(0, 5),
        }))
      );
  }
}
