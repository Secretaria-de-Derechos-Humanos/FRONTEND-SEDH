import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Dependencia {
  idDependencia: number;
  nomDependencia: string;
}

export interface Cargo {
  idCargo: number;
  nomCargo: string | null;
  idDependencia: number;
  dependencia?: Dependencia;
  creadoEn?: string;
  creadoPor?: string | null;
  actualizadoEn?: string | null;
  actualizadoPor?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CrearCargoRequest {
  nomCargo: string;
  idDependencia: number;
}

export interface ActualizarCargoRequest {
  nomCargo?: string;
  idDependencia?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogosService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/recursos-humanos/catalogos`;


  // ============================================================
  // DEPENDENCIAS
  // ============================================================

  listarDependencias(): Observable<Dependencia[]> {

    return this.http
      .get<ApiResponse<Dependencia[]>>(
        `${this.apiUrl}/dependencias`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // ============================================================
  // CARGOS
  // ============================================================

  listarCargos(): Observable<Cargo[]> {

    return this.http
      .get<ApiResponse<Cargo[]>>(
        `${this.apiUrl}/cargos`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  listarCargosPorDependencia(
    idDependencia: number,
  ): Observable<Cargo[]> {

    return this.http
      .get<ApiResponse<Cargo[]>>(
        `${this.apiUrl}/cargos/dependencia/${idDependencia}`,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data ?? [],
        ),
      );
  }


  // ============================================================
  // CREAR
  // ============================================================

  crearCargo(
    datos: CrearCargoRequest,
  ): Observable<Cargo> {

    return this.http
      .post<ApiResponse<Cargo>>(
        `${this.apiUrl}/cargos`,
        datos,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // ============================================================
  // ACTUALIZAR
  // ============================================================

  actualizarCargo(
    idCargo: number,
    datos: ActualizarCargoRequest,
  ): Observable<Cargo> {

    return this.http
      .patch<ApiResponse<Cargo>>(
        `${this.apiUrl}/cargos/${idCargo}`,
        datos,
      )
      .pipe(
        map((respuesta) =>
          respuesta.data,
        ),
      );
  }


  // ============================================================
  // ELIMINAR
  // ============================================================

  eliminarCargo(
    idCargo: number,
  ): Observable<unknown> {

    return this.http.delete(
      `${this.apiUrl}/cargos/${idCargo}`,
    );
  }
}
