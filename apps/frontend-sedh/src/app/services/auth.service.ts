import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface User {
  id: number;
  emailInstitucional: string;
  nombre: string;
  apellido: string;
  rol: number;
}

interface LoginResponse {
  users: Array<User & { password: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly STORAGE_KEY = 'sedh_user';
  public readonly currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {
    // Verificar si hay usuario en sessionStorage al iniciar (solo en navegador)
    this.currentUser.set(this.getUserFromStorage());
  }

  /**
   * Obtiene el usuario almacenado en sessionStorage
   */
  private getUserFromStorage(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const userJson = sessionStorage.getItem(this.STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error al obtener usuario de sessionStorage:', error);
      return null;
    }
  }

  /**
   * Guarda el usuario en sessionStorage
   */
  private saveUserToStorage(user: User): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error al guardar usuario en sessionStorage:', error);
    }
  }

  /**
   * Elimina el usuario de sessionStorage
   */
  private removeUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error al eliminar usuario de sessionStorage:', error);
    }
  }

  /**
   * Realiza el login validando contra el archivo JSON
   */
  login(email: string, password: string): Observable<User> {
    return this.http.get<LoginResponse>('/data/users.json').pipe(
      map(response => {
        // Buscar usuario que coincida con email y password
        const user = response.users.find(
          u => u.emailInstitucional === email && u.password === password
        );

        if (!user) {
          throw new Error('Credenciales incorrectas');
        }

        // Crear objeto de usuario sin la contraseña
        const { password: _, ...userWithoutPassword } = user;

        // Guardar en sessionStorage
        this.saveUserToStorage(userWithoutPassword);
        this.currentUser.set(userWithoutPassword);

        return userWithoutPassword;
      }),
      catchError(error => {
        if (error.message === 'Credenciales incorrectas') {
          return throwError(() => error);
        }
        return throwError(() => new Error('Error al conectar con el servidor'));
      })
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.removeUserFromStorage();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }
}
