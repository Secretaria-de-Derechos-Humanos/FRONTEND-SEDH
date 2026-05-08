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
    return (this.sessionService.countdown() / this.sessionService.COUNTDOWN_SECONDS) * 100;
  }
}
