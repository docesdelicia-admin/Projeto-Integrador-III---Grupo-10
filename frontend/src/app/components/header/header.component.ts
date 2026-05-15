import { Component, Input } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { RouterLink } from '@angular/router';
import { AdminAreaComponent } from '../admin-area/admin-area.component';

type ModoBusca = 'campo' | 'icone';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() titulo = 'Doces Delicia';
  constructor(private readonly sidebarService: SidebarService) {}

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }
}
