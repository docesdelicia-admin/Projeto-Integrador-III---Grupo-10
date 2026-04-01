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
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export class PedidosPage implements OnInit {
  private readonly authService = inject(AuthService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'cliente', titulo: 'Cliente' },
    { chave: 'data_pedido', titulo: 'Data do Pedido', formatador: (valor) => this.formatarData(valor) },
    { chave: 'data_entrega', titulo: 'Data de Entrega', formatador: (valor) => this.formatarData(valor) },
    { chave: 'status', titulo: 'Status' },
  ];

  linhas: any[] = [];
  carregando = false;
  ehAdmin = false;

  ngOnInit(): void {
    this.ehAdmin = this.authService.ehAdmin();
    this.carregarPedidos();
  }

  private carregarPedidos(): void {
    this.carregando = true;
    // TODO: Implementar carregamento de pedidos
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

  readonly acaoEditarPedido = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de pedido
  };

  readonly acaoExcluirPedido = (_linha: TabelaLinha): void => {
    // TODO: Implementar exclusao de pedido
  };
}
