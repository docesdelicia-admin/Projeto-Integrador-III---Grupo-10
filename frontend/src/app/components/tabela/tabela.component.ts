import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type TabelaValor = string | number | boolean | null | undefined | string[];

export interface TabelaLinha {
  [chave: string]: TabelaValor;
}

export interface TabelaColuna {
  chave: string;
  titulo: string;
  tipo?: 'texto' | 'html' | 'imagem' | 'lista-imagens' | 'descricao';
  formatador?: (valor: unknown, linha: TabelaLinha) => string;
}

@Component({
  selector: 'app-tabela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabela.component.html',
  styleUrl: './tabela.component.scss',
})
export class TabelaComponent {
  // Inputs
  @Input({ required: true }) colunas: TabelaColuna[] = [];
  @Input({ required: true }) linhas: TabelaLinha[] = [];
  @Input() mensagemSemDados = 'Nenhum registro encontrado.';
  @Input() acaoEditar: (linha: TabelaLinha) => void = () => undefined;
  @Input() acaoExcluir: (linha: TabelaLinha) => void = () => undefined;
  @Input() excluirDesabilitado: (linha: TabelaLinha) => boolean = () => false;

  modalDescricaoAberto = false;
  textoDescricaoModal = '';

  private indiceFotoAtual: Record<string | number, number> = {};

  rastrearLinha(index: number, linha: TabelaLinha): string | number {
    const id = linha['id'];
    return typeof id === 'string' || typeof id === 'number' ? id : index;
  }

  // AÇÕES

  editar(linha: TabelaLinha): void {
    this.acaoEditar(linha);
  }

  excluir(linha: TabelaLinha): void {
    if (this.excluirDesabilitado(linha)) return;
    this.acaoExcluir(linha);
  }

  private obterDescricao(linha: TabelaLinha, coluna: TabelaColuna): string {
    const valor = linha[coluna.chave];

    return typeof valor === 'string' && valor.trim() ? valor.trim() : 'Descrição não informada.';
  }

  abrirModalDescricao(linha: TabelaLinha, coluna: TabelaColuna): void {
    this.textoDescricaoModal = this.obterDescricao(linha, coluna);
    this.modalDescricaoAberto = true;
  }

  fecharModalDescricao(): void {
    this.modalDescricaoAberto = false;
    this.textoDescricaoModal = '';
  }

  // IMAGENS

  getListaImagens(valor: unknown): string[] {
    return Array.isArray(valor) ? (valor as string[]) : [];
  }

  private getIndiceAtual(linhaId: string | number): number {
    return this.indiceFotoAtual[linhaId] ?? 0;
  }

  getFotoAtual(linhaId: string | number, fotos: string[]): string {
    if (!fotos.length) return '';
    return fotos[this.getIndiceAtual(linhaId)];
  }

  proximaFoto(linhaId: string | number, total: number): void {
    const atual = this.getIndiceAtual(linhaId);
    this.indiceFotoAtual[linhaId] = (atual + 1) % total;
  }

  fotoAnterior(linhaId: string | number, total: number): void {
    const atual = this.getIndiceAtual(linhaId);
    this.indiceFotoAtual[linhaId] = (atual - 1 + total) % total;
  }
}
