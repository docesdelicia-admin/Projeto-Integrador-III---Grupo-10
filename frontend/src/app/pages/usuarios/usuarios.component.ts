import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import {
  TabelaColuna,
  TabelaLinha,
  TabelaComponent,
} from '../../components/tabela/tabela.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosPage implements OnInit {
  private readonly authService = inject(AuthService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'email', titulo: 'Email' },
    { chave: 'tipo_usuario', titulo: 'Tipo de Usuario' },
    { chave: 'ativo', titulo: 'Ativo', formatador: (valor) => (valor ? 'Sim' : 'Nao') },
  ];

  linhas: any[] = [];
  carregando = false;
  ehAdmin = false;

  ngOnInit(): void {
    this.ehAdmin = this.authService.ehAdmin();
    this.carregarUsuarios();
  }

  private carregarUsuarios(): void {
    this.carregando = true;
    // TODO: Implementar carregamento de usuarios
    this.carregando = false;
  }

  readonly acaoEditarUsuario = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de usuario
  };

  readonly acaoExcluirUsuario = (_linha: TabelaLinha): void => {
    // TODO: Implementar exclusao de usuario
  };
}
