import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarLeftComponent } from '../../components/sidebar/sidebarLeft.component';
import { NavbarTopComponent } from '../../components/navbar/navbarTop.component';

@Component({
  selector: 'sedh-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarLeftComponent, NavbarTopComponent],
  templateUrl: './mainLayout.component.html',
  styleUrl: './mainLayout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {}
