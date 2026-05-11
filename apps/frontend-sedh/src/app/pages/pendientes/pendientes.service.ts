import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { EP_RRHH_JEFE_INMEDIATO_PENDIENTES } from '../../config/api.endpoints';

interface EmpleadoPendienteApi {
  nombre: string;
  apellido: string;
  segundoNombre: string;
  segundoApellido: string;
}

export interface PendienteJefeInmediatoApi {
  tipo: string;
  cargo: string;
  fecha: string;
  estado: string;
  motivo: string;
  empleado: EmpleadoPendienteApi;
  idpermiso: string;
  emergencia: boolean;
  motRechazo: string | null;
  dependencia: string;
  tipoPermiso: string;
  horasSolicitadas: string;
}

interface PendientesJefeInmediatoResponse {
  success: boolean;
  data: {
    jefe: string;
    pendientes: PendienteJefeInmediatoApi[];
  };
  message: string;
  timestamp: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class PendientesService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = environment.apiBaseUrl;

  private get hasRoleTwoInModuleOne(): boolean {
    const rawRoles = this.authService.currentUser()?.roles;
    if (!Array.isArray(rawRoles)) {
      return false;
    }

    return rawRoles.some(role => this.matchesRoleAndModule(role));
  }

  private matchesRoleAndModule(role: unknown): boolean {
    if (typeof role !== 'object' || role === null) {
      return false;
    }

    const record = role as Record<string, unknown>;
    const roleId = this.toNumber(record['r'] ?? record['rol'] ?? record['role']);
    const modulesRaw = record['m'] ?? record['modulos'] ?? record['modulo'] ?? record['modules'];
    const modules = this.normalizeModules(modulesRaw);

    return roleId === 2 && modules.includes(1);
  }

  private normalizeModules(value: unknown): number[] {
    if (Array.isArray(value)) {
      return value
        .map(item => this.toNumber(item))
        .filter((item): item is number => item !== null);
    }

    const single = this.toNumber(value);
    return single === null ? [] : [single];
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  getPendientesJefeInmediato(): Observable<PendienteJefeInmediatoApi[]> {
    // No bloquea la llamada al backend: la autorización final la decide la API.
    // Esta validación local se conserva para diagnóstico.
    if (!this.hasRoleTwoInModuleOne) {
      console.warn('PendientesService: el token no coincide con rol 2 y modulo 1 segun validacion local.');
    }

    return this.http
      .post<PendientesJefeInmediatoResponse>(
        `${this.base}${EP_RRHH_JEFE_INMEDIATO_PENDIENTES}`,
        {}
      )
      .pipe(map(response => response.data?.pendientes ?? []));
  }
}
