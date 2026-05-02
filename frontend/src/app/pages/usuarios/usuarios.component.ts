import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

import { AuthService } from '../../services/auth.service';

import {
  Usuario,
  UsuariosService,
} from '../../services/usuarios.service';

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
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'email', titulo: 'Email' },
    { chave: 'tipo_usuario', titulo: 'Tipo de Usuario' },
    { chave: 'criado_em', titulo: 'Criado em' },
  ];

  linhas: Usuario[] = [];

  carregando = false;
  isAdmin = false;

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.carregando = true;

    this.usuariosService
      .listar()
      .pipe(
        finalize(() => {
          this.carregando = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.linhas = response.usuarios;
        },
        error: (error: Error) => {
          console.error(error.message);
          window.alert(error.message);
        },
      });
  }

  readonly acaoEditarUsuario = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de usuario
  };

  readonly acaoExcluirUsuario = (linha: TabelaLinha): void => {
    if (!this.isAdmin) {
      window.alert('Apenas administradores podem excluir usuarios.');
      return;
    }

    const usuario = linha as Usuario;

    const senhaAtual = window.prompt(
      'Digite sua senha atual para confirmar a exclusao:'
    );

    if (!senhaAtual || !senhaAtual.trim()) {
      return;
    }

    this.usuariosService
      .excluir(usuario.id, senhaAtual)
      .subscribe({
        next: () => {
          window.alert('Usuario excluido com sucesso.');
          this.carregarUsuarios();
        },
        error: (error: Error) => {
          console.error(error.message);
          window.alert(error.message);
        },
      });
  };
}
