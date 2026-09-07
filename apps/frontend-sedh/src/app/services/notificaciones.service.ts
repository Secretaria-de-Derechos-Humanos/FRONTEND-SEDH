import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Notificacion {
  idNotificacion: string;
  idUsuario: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  idSolicitud: string | null;
  leida: boolean;
  fechaCreacion: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiBaseUrl}/notificaciones`;

  listar(): Observable<Notificacion[]> {
    return this.http
      .get<ApiResponse<Notificacion[]>>(
        this.apiUrl,
      )
      .pipe(
        map((response) => response.data ?? []),
      );
  }

  listarNoLeidas(): Observable<Notificacion[]> {
    return this.http
      .get<ApiResponse<Notificacion[]>>(
        `${this.apiUrl}/no-leidas`,
      )
      .pipe(
        map((response) => response.data ?? []),
      );
  }

  contador(): Observable<number> {
    return this.http
      .get<ApiResponse<{ cantidad: number }>>(
        `${this.apiUrl}/contador`,
      )
      .pipe(
        map((response) => response.data?.cantidad ?? 0),
      );
  }

  marcarComoLeida(
    idNotificacion: string,
  ): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/${idNotificacion}/leida`,
      {},
    );
  }

  marcarTodasComoLeidas(): Observable<unknown> {
    return this.http.patch(
      `${this.apiUrl}/marcar-todas-leidas`,
      {},
    );
  }
}
