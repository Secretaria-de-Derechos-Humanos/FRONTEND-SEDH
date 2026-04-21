import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarTopComponent } from '../components/navbar/navbarTop.component';
import { SidebarLeftComponent } from '../components/sidebar/sidebarLeft.component';

@Component({
  selector: 'sedh-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarTopComponent, SidebarLeftComponent],
  templateUrl: './mainLayout.component.html',
  styleUrl: './mainLayout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
