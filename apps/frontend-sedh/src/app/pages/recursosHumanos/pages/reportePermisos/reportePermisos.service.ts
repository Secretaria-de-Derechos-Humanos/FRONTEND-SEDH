import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../services/auth.service';
import { EP_RRHH_REPORTES_PERMISOS_POR_MES } from '../../../../config/api.endpoints';

// ── Modelos públicos ─────────────────────────────────────────────────────────

export interface RegistroPermiso {
  dependencia:      string;
  empleado:         string;
  fecha:            string;
  tipo:             string;
  horaSalida:       string;
  horaRetorno:      string;
  horasPermiso:     string;
  horasDisponibles: string;
}

export interface DepGroup {
  dependencia:    string;
  totalEmpleados: number;
  totalPermisos:  number;
  registros:      RegistroPermiso[];
}

// ── Tipos internos de respuesta API ─────────────────────────────────────────

interface ReportePermisosData {
  status:           string;
  reportePermisos:  RegistroPermiso[];
}

interface ApiResponse<T> {
  success:   boolean;
  data:      T;
  message:   string;
  timestamp: string;
  path:      string;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ReportePermisosService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base        = environment.apiBaseUrl;

  getReportePorMes(mes: number, anio: number): Observable<DepGroup[]> {
    const user = this.authService.currentUser();
    const rol  = user?.roles[0];

    const body = {
      mes,
      anio,
      email:    user?.email ?? '',
      rol:      rol?.r ?? 5,
      idmodulo: typeof rol?.m === 'number' ? rol.m : (Array.isArray(rol?.m) ? rol.m[0] : 1),
    };

    return this.http
      .post<ApiResponse<ReportePermisosData>>(
        `${this.base}${EP_RRHH_REPORTES_PERMISOS_POR_MES}`,
        body
      )
      .pipe(map(r => agruparPorDependencia(r.data?.reportePermisos ?? [])));
  }
}

// ── Función de agrupamiento ──────────────────────────────────────────────────

function agruparPorDependencia(registros: RegistroPermiso[]): DepGroup[] {
  const mapa = new Map<string, DepGroup>();

  for (const reg of registros) {
    const dep = reg.dependencia;
    if (!mapa.has(dep)) {
      mapa.set(dep, { dependencia: dep, totalEmpleados: 0, totalPermisos: 0, registros: [] });
    }
    const grupo = mapa.get(dep)!;
    grupo.registros.push(reg);
    grupo.totalPermisos++;
  }

  // Contar empleados únicos por dependencia
  for (const grupo of mapa.values()) {
    grupo.totalEmpleados = new Set(grupo.registros.map(r => r.empleado)).size;
  }

  return Array.from(mapa.values());
}
