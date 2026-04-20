import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { Insumo, InsumosService } from '../../services/insumos.service';
import {
  TabelaColuna,
  TabelaLinha,
  TabelaComponent,
} from '../../components/tabela/tabela.component';

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.scss',
})
export class InsumosPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly insumosService = inject(InsumosService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'descricao', titulo: 'Descricao' },
    { chave: 'unidade_medida', titulo: 'Unidade de Medida' },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (valor) => this.formatarData(valor) },
  ];

  readonly linhas = signal<TabelaLinha[]>([]);
  readonly carregando = signal(false);
  readonly isAdmin = signal(false);
  readonly mensagemErro = signal('');

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.carregarInsumos();
  }

  private carregarInsumos(): void {
    const insumosEmCache = this.insumosService.obterInsumosEmCache();
    this.linhas.set(insumosEmCache.map((insumo: Insumo) => ({ ...insumo }) as TabelaLinha));

    this.carregando.set(this.linhas().length === 0);
    this.mensagemErro.set('');

    this.insumosService.listar().subscribe({
      next: (resposta) => {
        this.linhas.set(
          (resposta.insumos ?? []).map((insumo: Insumo) => ({ ...insumo }) as TabelaLinha),
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

  readonly acaoEditarInsumo = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de insumo
  };

  readonly acaoExcluirInsumo = (_linha: TabelaLinha): void => {
    // TODO: Implementar exclusao de insumo
  };
}
