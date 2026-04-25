import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { PasswordConfirmModalComponent } from '../../components/password-confirm-modal/password-confirm-modal.component';
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    SidebarComponent,
    TabelaComponent,
    PasswordConfirmModalComponent,
  ],
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
      titulo: 'Descrição',
      tipo: 'descricao',
    },
    { chave: 'preco', titulo: 'Preco', formatador: (valor) => this.formatarPreco(valor) },
    {
      chave: 'fotos',
      titulo: 'Fotos',
      tipo: 'lista-imagens',
    },
    { chave: 'ativo', titulo: 'Ativo', formatador: (valor) => (valor ? 'Sim' : 'Nao') },
    { chave: 'criado_em', titulo: 'Criado em', formatador: (valor) => this.formatarData(valor) },
  ];

  readonly acaoEditarProduto = (linha: TabelaLinha): void => {
    this.abrirModalEdicao(linha);
  };

  readonly acaoExcluirProduto = (linha: TabelaLinha): void => {
    this.excluirProduto(linha);
  };

  readonly excluirDesabilitado = (): boolean => !this.isAdmin();

  readonly produtos = signal<Produto[]>([]);
  readonly carregandoTabela = signal(false);
  readonly carregandoFormulario = signal(false);
  readonly modalAberto = signal(false);
  readonly modoEdicao = signal(false);
  readonly isAdmin = signal(false);
  readonly idProdutoEdicao = signal<string | null>(null);
  readonly mensagemSucesso = signal('');
  readonly mensagemErro = signal('');
  readonly arquivosSelecionados = signal<File[]>([]);
  readonly fotosExistentesEdicao = signal<string[]>([]);
  readonly previewsNovos = signal<string[]>([]);
  readonly dropzoneAtiva = signal(false);
  readonly modalConfirmacaoExclusaoAberto = signal(false);
  readonly produtoPendenteExclusao = signal<Produto | null>(null);
  readonly carregandoExclusao = signal(false);

  get linhasTabela(): TabelaLinha[] {
    return this.produtos().map((produto) => ({ ...produto }) as TabelaLinha);
  }

  ngOnInit(): void {
    this.authService.validarSessao().subscribe((autenticado) => {
      this.isAdmin.set(autenticado && this.authService.isAdmin());
    });

    this.carregarProdutos();
  }

  abrirModalCadastro(): void {
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.modoEdicao.set(false);
    this.idProdutoEdicao.set(null);
    this.formProduto.reset({
      nome: '',
      categoria: '',
      descricao: '',
      preco: 0,
      ativo: true,
    });
    this.arquivosSelecionados.set([]);
    this.fotosExistentesEdicao.set([]);
    this.previewsNovos.set([]);
    this.dropzoneAtiva.set(false);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    if (this.carregandoFormulario()) {
      return;
    }

    this.modalAberto.set(false);
  }

  async salvarProduto(): Promise<void> {
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    if (this.formProduto.invalid) {
      this.formProduto.markAllAsTouched();
      return;
    }

    const valores = this.formProduto.getRawValue();
    let fotos: string[];

    try {
      fotos = await this.prepararFotosParaPayload();
    } catch (error) {
      this.mensagemErro.set(
        error instanceof Error ? error.message : 'Falha ao processar os arquivos selecionados.',
      );
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

    this.carregandoFormulario.set(true);

    const requisicao =
      this.modoEdicao() && this.idProdutoEdicao()
        ? this.produtosService.editar(this.idProdutoEdicao() as string, payload)
        : this.produtosService.criar(payload);

    requisicao.pipe(finalize(() => this.carregandoFormulario.set(false))).subscribe({
      next: () => {
        const mensagem = this.modoEdicao()
          ? 'Produto atualizado com sucesso.'
          : 'Produto cadastrado com sucesso.';
        this.modalAberto.set(false);
        this.mensagemSucesso.set(mensagem);
        this.carregarProdutos();
      },
      error: (error: Error) => {
        this.mensagemErro.set(error.message);
      },
    });
  }

  private carregarProdutos(): void {
    this.carregandoTabela.set(true);
    this.produtosService
      .listar()
      .pipe(finalize(() => this.carregandoTabela.set(false)))
      .subscribe({
        next: (resposta) => {
          this.produtos.set(resposta.produtos);
        },
        error: (error: Error) => {
          this.mensagemErro.set(error.message);
        },
      });
  }

  private abrirModalEdicao(linha: TabelaLinha): void {
    const produto = this.mapearLinhaParaProduto(linha);
    if (!produto) {
      return;
    }

    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.modoEdicao.set(true);
    this.idProdutoEdicao.set(produto.id);
    this.formProduto.reset({
      nome: produto.nome,
      categoria: produto.categoria ?? '',
      descricao: produto.descricao ?? '',
      preco: Number(produto.preco),
      ativo: produto.ativo,
    });
    this.arquivosSelecionados.set([]);
    this.fotosExistentesEdicao.set([...produto.fotos]);
    this.previewsNovos.set([]);
    this.dropzoneAtiva.set(false);
    this.modalAberto.set(true);
  }

  abrirSeletorArquivos(inputArquivos: HTMLInputElement): void {
    inputArquivos.click();
  }

  onArquivosSelecionados(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.adicionarArquivos(target.files);
    target.value = '';
  }

  onArrastarSobreDropzone(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva.set(true);
  }

  onSairDropzone(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva.set(false);
  }

  onSoltarArquivos(event: DragEvent): void {
    event.preventDefault();
    this.dropzoneAtiva.set(false);
    this.adicionarArquivos(event.dataTransfer?.files ?? null);
  }

  limparArquivosSelecionados(): void {
    this.arquivosSelecionados.set([]);
    this.previewsNovos.set([]);
  }

  removerNovaFoto(index: number): void {
    const arquivos = [...this.arquivosSelecionados()];
    const previews = [...this.previewsNovos()];
    arquivos.splice(index, 1);
    previews.splice(index, 1);
    this.arquivosSelecionados.set(arquivos);
    this.previewsNovos.set(previews);
  }

  removerFotoExistente(index: number): void {
    const fotos = [...this.fotosExistentesEdicao()];
    fotos.splice(index, 1);
    this.fotosExistentesEdicao.set(fotos);
  }

  private excluirProduto(linha: TabelaLinha): void {
    if (!this.isAdmin()) {
      this.mensagemErro.set('Apenas administradores podem deletar dados.');
      return;
    }

    const produto = this.mapearLinhaParaProduto(linha);
    if (!produto) {
      return;
    }

    this.produtoPendenteExclusao.set(produto);
    this.modalConfirmacaoExclusaoAberto.set(true);
  }

  cancelarConfirmacaoExclusao(): void {
    if (this.carregandoExclusao()) {
      return;
    }

    this.modalConfirmacaoExclusaoAberto.set(false);
    this.produtoPendenteExclusao.set(null);
  }

  confirmarExclusaoComSenha(senhaAtual: string): void {
    const produto = this.produtoPendenteExclusao();
    const senhaAtualLimpa = senhaAtual.trim();

    if (!produto || !senhaAtualLimpa) {
      return;
    }

    this.mensagemErro.set('');
    this.mensagemSucesso.set('');
    this.carregandoExclusao.set(true);

    this.produtosService
      .excluir(produto.id, senhaAtualLimpa)
      .pipe(finalize(() => this.carregandoExclusao.set(false)))
      .subscribe({
        next: () => {
          this.modalConfirmacaoExclusaoAberto.set(false);
          this.produtoPendenteExclusao.set(null);
          this.mensagemSucesso.set('Produto excluido com sucesso.');
          this.carregarProdutos();
        },
        error: (error: Error) => {
          this.mensagemErro.set(error.message);
        },
      });
  }

  private mapearLinhaParaProduto(linha: TabelaLinha): Produto | null {
    const id = linha['id'];

    if (typeof id !== 'string') {
      this.mensagemErro.set('Nao foi possivel identificar o produto selecionado.');
      return null;
    }

    const produto = this.produtos().find((item) => item.id === id);

    if (!produto) {
      this.mensagemErro.set('Produto nao encontrado na lista atual.');
      return null;
    }

    return produto;
  }

  private adicionarArquivos(files: FileList | null): void {
    if (!files || files.length === 0) {
      return;
    }

    const novosArquivos = Array.from(files);
    const arquivosAtuais = this.arquivosSelecionados();

    const arquivosFiltrados = novosArquivos.filter(
      (novo) =>
        !arquivosAtuais.some((atual) => atual.name === novo.name && atual.size === novo.size),
    );

    if (arquivosFiltrados.length === 0) {
      return;
    }

    this.arquivosSelecionados.set([...arquivosAtuais, ...arquivosFiltrados]);

    Promise.all(arquivosFiltrados.map((arquivo) => this.converterArquivoParaDataUrl(arquivo))).then(
      (novasUrls) => {
        this.previewsNovos.set([...this.previewsNovos(), ...novasUrls]);
      },
    );
  }

  private async prepararFotosParaPayload(): Promise<string[]> {
    return [...this.fotosExistentesEdicao(), ...this.previewsNovos()];
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
