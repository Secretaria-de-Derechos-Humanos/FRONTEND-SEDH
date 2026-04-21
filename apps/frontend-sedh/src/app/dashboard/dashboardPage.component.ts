import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sedh-dashboard-page',
  standalone: true,
  imports: [],
  templateUrl: './dashboardPage.component.html',
  styleUrl: './dashboardPage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {}
