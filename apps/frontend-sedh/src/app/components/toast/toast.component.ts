import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  ToastService,
} from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  templateUrl:
    './toast.component.html',
  styleUrls: [
    './toast.component.css',
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly toastService =
    inject(ToastService);

  readonly toasts =
    this.toastService.toasts;

  cerrar(
    id: number,
  ): void {
    this.toastService.cerrar(id);
  }
}
