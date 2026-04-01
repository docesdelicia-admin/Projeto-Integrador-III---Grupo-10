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
  selector: 'app-insumos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.scss',
})
export class InsumosPage implements OnInit {
  private readonly authService = inject(AuthService);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'descricao', titulo: 'Descricao' },
    { chave: 'unidade_medida', titulo: 'Unidade de Medida' },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (valor) => this.formatarData(valor) },
  ];

  linhas: any[] = [];
  carregando = false;
  ehAdmin = false;

  ngOnInit(): void {
    this.ehAdmin = this.authService.ehAdmin();
    this.carregarInsumos();
  }

  private carregarInsumos(): void {
    this.carregando = true;
    // TODO: Implementar carregamento de insumos
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

  readonly acaoEditarInsumo = (_linha: TabelaLinha): void => {
    // TODO: Implementar edicao de insumo
  };

  readonly acaoExcluirInsumo = (_linha: TabelaLinha): void => {
    // TODO: Implementar exclusao de insumo
  };
}
