import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import {
  TabelaColuna,
  TabelaLinha,
  TabelaComponent,
} from '../../components/tabela/tabela.component';
import { AuthService } from '../../services/auth.service';
import { Produto, ProdutoPayload, ProdutosService } from '../../services/produtos.service';

@Component({
  selector: 'app-produtos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, SidebarComponent, TabelaComponent],
  templateUrl: './produtos-admin.component.html',
  styleUrl: './produtos-admin.component.scss',
})
export class ProdutosAdminPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly produtosService = inject(ProdutosService);
  private readonly authService = inject(AuthService);

  readonly formProduto = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    categoria: [''],
    descricao: [''],
    preco: [0, [Validators.required, Validators.min(0)]],
    ativo: [true],
  });

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'categoria', titulo: 'Categoria' },
    {
      chave: 'descricao',
      titulo: 'Descricao',
      formatador: (valor) => this.formatarDescricao(valor),
    },
    { chave: 'preco', titulo: 'Preco', formatador: (valor) => this.formatarPreco(valor) },
    { chave: 'fotos', titulo: 'Fotos', formatador: (valor) => this.formatarFotos(valor) },
    { chave: 'ativo', titulo: 'Ativo', formatador: (valor) => (valor ? 'Sim' : 'Nao') },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (valor) => this.formatarData(valor) },
  ];

  readonly acaoEditarProduto = (linha: TabelaLinha): void => {
    this.abrirModalEdicao(linha);
  };

  readonly acaoExcluirProduto = (linha: TabelaLinha): void => {
    this.excluirProduto(linha);
  };

  readonly excluirDesabilitado = (): boolean => !this.ehAdmin;

  produtos: Produto[] = [];
  carregandoTabela = false;
  carregandoFormulario = false;
  modalAberto = false;
  modoEdicao = false;
  ehAdmin = false;
  idProdutoEdicao: string | null = null;
  mensagemSucesso = '';
  mensagemErro = '';
  arquivosSelecionados: File[] = [];
  fotosExistentesEdicao: string[] = [];
  dropzoneAtiva = false;

  get linhasTabela(): TabelaLinha[] {
    return this.produtos.map((produto) => ({ ...produto }) as TabelaLinha);
  }

  ngOnInit(): void {
    this.authService.validarSessao().subscribe((autenticado) => {
      this.ehAdmin = autenticado && this.authService.ehAdmin();
    });

    this.carregarProdutos();
  }

  abrirModalCadastro(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.modoEdicao = false;
    this.idProdutoEdicao = null;
    this.formProduto.reset({
      nome: '',
      categoria: '',
      descricao: '',
      preco: 0,
      ativo: true,
    });
    this.arquivosSelecionados = [];
    this.fotosExistentesEdicao = [];
    this.dropzoneAtiva = false;
    this.modalAberto = true;
  }

  fecharModal(): void {
    if (this.carregandoFormulario) {
      return;
    }

    this.modalAberto = false;
  }

  async salvarProduto(): Promise<void> {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (this.formProduto.invalid) {
      this.formProduto.markAllAsTouched();
      return;
    }

    const valores = this.formProduto.getRawValue();
    let fotos: string[];

    try {
      fotos = await this.prepararFotosParaPayload();
    } catch (error) {
      this.mensagemErro =
        error instanceof Error ? error.message : 'Falha ao processar os arquivos selecionados.';
      return;
    }

    const payload: ProdutoPayload = {
      nome: valores.nome.trim(),
      categoria: valores.categoria.trim(),
      descricao: valores.descricao.trim(),
      preco: Number(valores.preco),
      fotos,
      ativo: valores.ativo,
    };

    this.carregandoFormulario = true;

    const requisicao =
      this.modoEdicao && this.idProdutoEdicao
        ? this.produtosService.editar(this.idProdutoEdicao, payload)
        : this.produtosService.criar(payload);

    requisicao.pipe(finalize(() => (this.carregandoFormulario = false))).subscribe({
      next: () => {
        this.modalAberto = false;
        this.mensagemSucesso = this.modoEdicao
          ? 'Produto atualizado com sucesso.'
          : 'Produto cadastrado com sucesso.';
        this.carregarProdutos();
      },
      error: (error: Error) => {
        this.mensagemErro = error.message;
      },
    });
  }

  private carregarProdutos(): void {
    this.carregandoTabela = true;
    this.produtosService
      .listar()
      .pipe(finalize(() => (this.carregandoTabela = false)))
      .subscribe({
        next: (resposta) => {
          this.produtos = resposta.produtos;
        },
        error: (error: Error) => {
          this.mensagemErro = error.message;
        },
      });
  }

  private abrirModalEdicao(linha: TabelaLinha): void {
    const produto = this.mapearLinhaParaProduto(linha);
    if (!produto) {
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.modoEdicao = true;
    this.idProdutoEdicao = produto.id;
    this.formProduto.reset({
      nome: produto.nome,
      categoria: produto.categoria ?? '',
      descricao: produto.descricao ?? '',
      preco: Number(produto.preco),
      ativo: produto.ativo,
    });
    this.arquivosSelecionados = [];
    this.fotosExistentesEdicao = [...produto.fotos];
    this.dropzoneAtiva = false;
    this.modalAberto = true;
  }

  abrirSeletorArquivos(inputArquivos: HTMLInputElement): void {
    inputArquivos.click();
  }

  onArquivosSelecionados(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.definirArquivosSelecionados(target.files);
  }

  onArrastarSobreDropzone(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva = true;
  }

  onSairDropzone(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva = false;
  }

  onSoltarArquivos(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva = false;
    this.definirArquivosSelecionados(event.dataTransfer?.files ?? null);
  }

  limparArquivosSelecionados(): void {
    this.arquivosSelecionados = [];
  }

  private excluirProduto(linha: TabelaLinha): void {
    if (!this.ehAdmin) {
      this.mensagemErro = 'Apenas administradores podem deletar dados.';
      return;
    }

    const produto = this.mapearLinhaParaProduto(linha);
    if (!produto) {
      return;
    }

    const confirmou = window.confirm(`Deseja realmente excluir o produto ${produto.nome}?`);
    if (!confirmou) {
      return;
    }

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.produtosService.excluir(produto.id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Produto excluido com sucesso.';
        this.carregarProdutos();
      },
      error: (error: Error) => {
        this.mensagemErro = error.message;
      },
    });
  }

  private mapearLinhaParaProduto(linha: TabelaLinha): Produto | null {
    const id = linha['id'];

    if (typeof id !== 'string') {
      this.mensagemErro = 'Nao foi possivel identificar o produto selecionado.';
      return null;
    }

    const produto = this.produtos.find((item) => item.id === id);

    if (!produto) {
      this.mensagemErro = 'Produto nao encontrado na lista atual.';
      return null;
    }

    return produto;
  }

  private definirArquivosSelecionados(files: FileList | null): void {
    if (!files) {
      return;
    }

    this.arquivosSelecionados = Array.from(files);
  }

  private async prepararFotosParaPayload(): Promise<string[]> {
    if (this.arquivosSelecionados.length === 0) {
      return [...this.fotosExistentesEdicao];
    }

    const fotos = await Promise.all(
      this.arquivosSelecionados.map((arquivo) => this.converterArquivoParaDataUrl(arquivo)),
    );
    return fotos;
  }

  private converterArquivoParaDataUrl(arquivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => {
        const resultado = leitor.result;

        if (typeof resultado !== 'string' || !resultado.trim()) {
          reject(new Error('Falha ao processar os arquivos selecionados.'));
          return;
        }

        resolve(resultado);
      };

      leitor.onerror = () => {
        reject(new Error('Falha ao processar os arquivos selecionados.'));
      };

      leitor.readAsDataURL(arquivo);
    });
  }

  private formatarDescricao(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    return valor;
  }

  private formatarFotos(valor: unknown): string {
    if (!Array.isArray(valor) || valor.length === 0) {
      return 'Sem fotos';
    }

    return `${valor.length} arquivo(s)`;
  }

  private formatarPreco(valor: unknown): string {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      return '-';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numero);
  }

  private formatarData(valor: unknown): string {
    if (typeof valor !== 'string') {
      return '-';
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(data);
  }
}
