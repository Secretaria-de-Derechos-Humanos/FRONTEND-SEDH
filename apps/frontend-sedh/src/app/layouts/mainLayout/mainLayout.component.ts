import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarLeftComponent } from '../../components/sidebar/sidebarLeft.component';
import { NavbarTopComponent } from '../../components/navbar/navbarTop.component';
import { SessionTimeoutModalComponent } from '../../components/sessionTimeoutModal/sessionTimeoutModal.component';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarLeftComponent, NavbarTopComponent, SessionTimeoutModalComponent],
  templateUrl: './mainLayout.component.html',
  styleUrl: './mainLayout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly sessionService = inject(SessionService);

  ngOnInit(): void {
    this.sessionService.initSession();
  }

  ngOnDestroy(): void {
    this.sessionService.destroySession();
  }
}
