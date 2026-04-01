import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import {
  ProdutoCardComponent,
  ProdutoVitrine,
} from '../../components/produto-card/produto-card.component';
import { Produto, ProdutosService } from '../../services/produtos.service';
import { criarSlidesPadrao } from '../../utils/produto-slides';

interface CategoriaVitrine {
  titulo: string;
  descricao: string;
  produto: ProdutoVitrine;
}

@Component({
  selector: 'app-vitrine',
  standalone: true,
  imports: [HeaderComponent, ProdutoCardComponent],
  templateUrl: './vitrine.component.html',
  styleUrl: './vitrine.component.scss',
})
export class VitrinePage implements OnInit {
  readonly titulo = 'Doces Delicia No Pote: Conheca nossos produtos';

  categorias: CategoriaVitrine[] = [];
  carregando = true;
  erroCarregamento = '';

  constructor(private readonly produtosService: ProdutosService) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  private carregarCategorias(): void {
    this.carregando = true;
    this.erroCarregamento = '';

    this.produtosService.listarPublico().subscribe({
      next: (resposta) => {
        this.categorias = this.agruparProdutosPorCategoria(resposta.produtos ?? []);
        this.carregando = false;
      },
      error: (error: Error) => {
        this.erroCarregamento = error.message;
        this.categorias = [];
        this.carregando = false;
      },
    });
  }

  private agruparProdutosPorCategoria(produtos: Produto[]): CategoriaVitrine[] {
    const grupos = new Map<string, Produto[]>();

    for (const produto of produtos.filter((item) => item.ativo)) {
      const categoria = (produto.categoria ?? 'Sem categoria').trim() || 'Sem categoria';
      const lista = grupos.get(categoria) ?? [];
      lista.push(produto);
      grupos.set(categoria, lista);
    }

    return Array.from(grupos.entries()).map(([categoria, listaProdutos]) => {
      const produtoPrincipal = listaProdutos[0];

      return {
        titulo: categoria,
        descricao: produtoPrincipal.descricao ?? 'Selecao de produtos organizada por categoria.',
        produto: this.converterProdutoParaVitrine(produtoPrincipal),
      };
    });
  }

  private converterProdutoParaVitrine(produto: Produto): ProdutoVitrine {
    return {
      nome: produto.nome,
      descricao: produto.descricao ?? 'Descricao nao informada.',
      preco: Number(produto.preco),
      fotos:
        produto.fotos.length > 0
          ? produto.fotos
          : criarSlidesPadrao(produto.nome, produto.categoria ?? ''),
    };
  }
}
