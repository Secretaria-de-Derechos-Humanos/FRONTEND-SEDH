import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { EP_RRHH_REPORTES_PERMISOS_POR_MES } from '../../../../config/api.endpoints';

// ── Modelos públicos ─────────────────────────────────────────────────────────

export interface RegistroPermiso {
  dependencia: string;
  empleado: string;
  fecha: string;
  tipo: string;
  horaSalida: string;
  horaRetorno: string;
  horasPermiso: string;
  horasDisponibles: string;
}

export interface DepGroup {
  dependencia: string;
  totalEmpleados: number;
  totalPermisos: number;
  registros: RegistroPermiso[];
}

// ── Solicitud enviada al backend ─────────────────────────────────────────────

interface ReportePermisosMesRequest {
  mes: number;
  anio: number;
  idmodulo: number;
}

// ── Respuesta del backend ────────────────────────────────────────────────────

interface ReportePermisosData {
  status: string;
  reportePermisos: RegistroPermiso[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  path?: string;
}

// ── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class ReportePermisosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getReportePorMes(
    mes: number,
    anio: number,
    idmodulo: number,
  ): Observable<DepGroup[]> {
    const body: ReportePermisosMesRequest = {
      mes: Number(mes),
      anio: Number(anio),
      idmodulo: Number(idmodulo),
    };

    console.log('BODY REPORTE:', body);

    return this.http
      .post<ApiResponse<ReportePermisosData>>(
        `${this.base}${EP_RRHH_REPORTES_PERMISOS_POR_MES}`,
        body,
      )
      .pipe(
        map((respuesta) => {
          const registros =
            respuesta?.data?.reportePermisos ?? [];

          return agruparPorDependencia(registros);
        }),
      );
  }
}

// ── Función de agrupamiento ──────────────────────────────────────────────────

function agruparPorDependencia(
  registros: RegistroPermiso[],
): DepGroup[] {
  const mapa = new Map<string, DepGroup>();

  for (const registro of registros) {
    const dependencia =
      registro.dependencia?.trim() || 'SIN DEPENDENCIA';

    let grupo = mapa.get(dependencia);

    if (!grupo) {
      grupo = {
        dependencia,
        totalEmpleados: 0,
        totalPermisos: 0,
        registros: [],
      };

      mapa.set(dependencia, grupo);
    }

    grupo.registros.push(registro);
    grupo.totalPermisos += 1;
  }

  for (const grupo of mapa.values()) {
    grupo.totalEmpleados = new Set(
      grupo.registros.map((registro) => registro.empleado),
    ).size;
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.dependencia.localeCompare(b.dependencia),
  );
}
