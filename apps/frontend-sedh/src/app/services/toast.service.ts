import {
  Injectable,
  signal,
} from '@angular/core';

export type ToastTipo =
  'exito' |
  'error';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private contador = 0;

  readonly toasts =
    signal<Toast[]>([]);

  mostrar(
    tipo: ToastTipo,
    mensaje: string,
    duracion = 4000,
  ): void {
    const id =
      ++this.contador;
    this.toasts.update(
      (lista) => [
        ...lista,
        {
          id,
          tipo,
          mensaje,
        },
      ],
    );
    setTimeout(
      () => this.cerrar(id),
      duracion,
    );
  }
  cerrar(
    id: number,
  ): void {
    this.toasts.update(
      (lista) =>
        lista.filter(
          (toast) =>
            toast.id !== id,
        ),
    );
  }
}
