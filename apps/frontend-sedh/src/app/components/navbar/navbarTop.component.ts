import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'sedh-navbar-top',
  standalone: true,
  imports: [],
  templateUrl: './navbarTop.component.html',
  styleUrl: './navbarTop.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarTopComponent {
  protected readonly themeService = inject(ThemeService);

  sidebarCollapsed = input<boolean>(false);
  toggleSidebar = output<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
