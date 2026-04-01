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
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss',
})
export class ClientesPage implements OnInit {
  private readonly authService = inject(AuthService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'telefone', titulo: 'Telefone' },
    { chave: 'observacoes', titulo: 'Observacoes' },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (valor) => this.formatarData(valor) },
  ];

  linhas: any[] = [];
  carregando = false;
  ehAdmin = false;

  ngOnInit(): void {
    this.ehAdmin = this.authService.ehAdmin();
    this.carregarClientes();
  }

  private carregarClientes(): void {
    this.carregando = true;
    // TODO: Implementar carregamento de clientes
    this.carregando = false;
  }

  private formatarData(valor: any): string {
    if (!valor) return '';
    try {
      return new Date(valor).toLocaleDateString('pt-BR');
    } catch {
      return valor;
    }
  }

  readonly acaoEditarCliente = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de cliente
  };

  readonly acaoExcluirCliente = (_linha: TabelaLinha): void => {
    // TODO: Implementar exclusao de cliente
  };
}
