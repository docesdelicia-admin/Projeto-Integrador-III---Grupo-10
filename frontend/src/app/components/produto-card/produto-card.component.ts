import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ProdutoVitrine {
  nome: string;
  descricao: string;
  preco: number;
  fotos: string[];
}

@Component({
  selector: 'app-produto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produto-card.component.html',
  styleUrl: './produto-card.component.scss',
})
export class ProdutoCardComponent {
  @Input({ required: true }) produto!: ProdutoVitrine;

  modalAberto = false;
  indiceFoto = 0;

  abrirModal(): void {
    this.indiceFoto = 0;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  proximaFoto(): void {
    if (!this.produto?.fotos?.length) {
      return;
    }

    this.indiceFoto = (this.indiceFoto + 1) % this.produto.fotos.length;
  }

  fotoAnterior(): void {
    if (!this.produto?.fotos?.length) {
      return;
    }

    this.indiceFoto = (this.indiceFoto - 1 + this.produto.fotos.length) % this.produto.fotos.length;
  }

  irParaFoto(indice: number): void {
    this.indiceFoto = indice;
  }

  get fotoAtual(): string {
    if (!this.produto?.fotos?.length) {
      return '';
    }

    return this.produto.fotos[this.indiceFoto];
  }

  get precoFormatado(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.produto.preco);
  }
}
