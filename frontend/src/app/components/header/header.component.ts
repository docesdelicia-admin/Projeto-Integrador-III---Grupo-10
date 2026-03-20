import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminAreaComponent } from '../admin-area/admin-area.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, AdminAreaComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() titulo = 'Doces Delicia';
  @Input() exibirBusca = true;
  @Input() placeholderBusca = 'Pesquisar produtos';
}
