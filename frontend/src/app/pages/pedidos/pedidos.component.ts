import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { Pedido, PedidosService } from '../../services/pedidos.service';
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
  private readonly pedidosService = inject(PedidosService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'cliente', titulo: 'Cliente' },
    {
      chave: 'data_pedido',
      titulo: 'Data do Pedido',
      formatador: (valor) => this.formatarData(valor),
    },
    {
      chave: 'data_entrega',
      titulo: 'Data de Entrega',
      formatador: (valor) => this.formatarData(valor),
    },
    { chave: 'status', titulo: 'Status' },
  ];

  readonly linhas = signal<TabelaLinha[]>([]);
  readonly carregando = signal(false);
  readonly isAdmin = signal(false);
  readonly mensagemErro = signal('');

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.carregarPedidos();
  }

  private carregarPedidos(): void {
    const pedidosEmCache = this.pedidosService.obterPedidosEmCache();
    this.linhas.set(
      pedidosEmCache.map((pedido: Pedido) => ({
        ...pedido,
        cliente: pedido.cliente_id,
      })) as TabelaLinha[],
    );

    this.carregando.set(this.linhas().length === 0);
    this.mensagemErro.set('');

    this.pedidosService.listar().subscribe({
      next: (resposta) => {
        this.linhas.set(
          (resposta.pedidos ?? []).map((pedido: Pedido) => ({
            ...pedido,
            cliente: pedido.cliente_id,
          })) as TabelaLinha[],
        );
        this.carregando.set(false);
      },
      error: (error: Error) => {
        this.mensagemErro.set(error.message);
        this.linhas.set([]);
        this.carregando.set(false);
      },
    });
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
