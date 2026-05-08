import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../services/auth.service';
import { Solicitud } from './solicitudesEmpleado.component';

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
        `${this.base}/rrhh/solicitudes-empleados/mis-solicitudes`,
        this.emailBody
      )
      .pipe(map(r => r.data.solicitudes.map(mapSolicitud)));
  }

  getMisSolicitudesEmergencia(): Observable<Solicitud[]> {
    return this.http
      .post<MisSolicitudesEmergenciaResponse>(
        `${this.base}/rrhh/solicitudes-empleados/mis-solicitudes-emergencia`,
        this.emailBody
      )
      .pipe(map(r => r.data.emergencias.map(mapSolicitud)));
  }
}
