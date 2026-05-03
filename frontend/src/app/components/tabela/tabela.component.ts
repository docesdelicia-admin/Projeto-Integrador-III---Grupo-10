import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type TabelaValor = string | number | boolean | null | undefined | string[];

export interface TabelaLinha {
  [chave: string]: TabelaValor;
}

export interface TabelaColuna {
  chave: string;
  titulo: string;
  tipo?: 'texto' | 'imagem' | 'lista-imagens' | 'descricao';
  formatador?: (valor: TabelaValor, linha: TabelaLinha) => string;
}

@Component({
  selector: 'app-tabela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabela.component.html',
  styleUrl: './tabela.component.scss',
})
export class TabelaComponent {
  // INPUTS
  @Input({ required: true }) colunas: TabelaColuna[] = [];
  @Input({ required: true }) linhas: TabelaLinha[] = [];

  @Input() carregando = false;
  @Input() mensagemCarregando = 'Carregando registros...';
  @Input() mensagemSemDados = 'Nenhum registro encontrado.';

  @Input() rotuloEditar = 'Editar';
  @Input() rotuloExcluir = 'Excluir';

  @Input() mostrarColunaEditar = true;
  @Input() mostrarColunaExcluir = true;

  @Input() acaoEditar: (linha: TabelaLinha) => void = () => undefined;
  @Input() acaoExcluir: (linha: TabelaLinha) => void = () => undefined;
  @Input() excluirDesabilitado: (linha: TabelaLinha) => boolean = () => false;

  // ESTADO INTERNO
  modalDescricaoAberto = false;
  textoDescricaoModal = '';

  private indiceFotoAtual: Record<string | number, number> = {};

  rastrearLinha(index: number, linha: TabelaLinha): string | number {
    const id = linha['id'];
    return typeof id === 'string' || typeof id === 'number' ? id : index;
  }

  // CELULA
  obterValorCelula(linha: TabelaLinha, coluna: TabelaColuna): string {
    const valor = linha[coluna.chave];

    if (coluna.formatador) {
      return coluna.formatador(valor, linha);
    }

    if (Array.isArray(valor)) {
      return valor.join(', ');
    }

    if (typeof valor === 'boolean') {
      return valor ? 'Sim' : 'Não';
    }

    return valor == null ? '-' : String(valor);
  }

  // AÇÕES
  editar(linha: TabelaLinha): void {
    this.acaoEditar(linha);
  }

  excluir(linha: TabelaLinha): void {
    if (this.excluirDesabilitado(linha)) return;
    this.acaoExcluir(linha);
  }

  // DESCRIÇÃO
  possuiDescricao(linha: TabelaLinha, coluna: TabelaColuna): boolean {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.trim().length > 0;
  }

  deveMostrarLerMais(linha: TabelaLinha, coluna: TabelaColuna): boolean {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.length > 20;
  }

  obterDescricaoCurta(linha: TabelaLinha, coluna: TabelaColuna): string {
    const valor = linha[coluna.chave];
    return typeof valor === 'string' && valor.trim() ? valor.slice(0, 20) + '...' : '-';
  }

  abrirModalDescricao(linha: TabelaLinha, coluna: TabelaColuna): void {
    const valor = linha[coluna.chave];
    this.textoDescricaoModal =
      typeof valor === 'string' && valor.trim() ? valor : 'Descrição não informada.';
    this.modalDescricaoAberto = true;
  }

  fecharModalDescricao(): void {
    this.modalDescricaoAberto = false;
    this.textoDescricaoModal = '';
  }

  // IMAGENS
  getListaImagens(valor: TabelaValor): string[] {
    return Array.isArray(valor) ? valor : [];
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

  get totalColunasRenderizadas(): number {
    return (
      this.colunas.length + (this.mostrarColunaEditar ? 1 : 0) + (this.mostrarColunaExcluir ? 1 : 0)
    );
  }
}
