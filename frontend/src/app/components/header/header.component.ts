import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminAreaComponent } from '../admin-area/admin-area.component';

type ModoBusca = 'campo' | 'icone';

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
  @Input() modoBusca: ModoBusca = 'campo';
}
