import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [],
  templateUrl: './sessionTimeoutModal.component.html',
  styleUrl: './sessionTimeoutModal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionTimeoutModalComponent {
  protected readonly sessionService = inject(SessionService);

  protected get progressPct(): number {
    // El countdown inicial varía según el modo (60s normal, 30s expirado forzoso)
    const initial = this.sessionService.sessionExpiredForced() ? 30 : 60;
    return (this.sessionService.countdown() / initial) * 100;
  }
}
