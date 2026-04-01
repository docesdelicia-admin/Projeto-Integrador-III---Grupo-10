import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Produto, ProdutoPayload, ProdutosService } from './produtos.service';

describe('ProdutosService', () => {
  let service: ProdutosService;
  let httpMock: HttpTestingController;

  const chaveCacheLista = 'docesdelicia.produtos.lista';
  const chaveCacheListaPublica = 'docesdelicia.produtos.lista-publica';

  const produtoMock: Produto = {
    id: '1',
    nome: 'Bolo Chocolate',
    categoria: 'Bolos personalizados',
    descricao: 'Bolo delicioso de chocolate',
    preco: '99.90',
    fotos: ['foto1.jpg', 'foto2.jpg'],
    ativo: true,
    criado_em: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    window.localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProdutosService],
    });

    service = TestBed.inject(ProdutosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
  });

  it('lista todos os produtos', () => {
    let resultado: { total: number; produtos: Produto[] } | undefined;
    service.listar().subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/produtos');
    expect(req.request.method).toBe('GET');
    req.flush({ total: 1, produtos: [produtoMock] });

    expect(resultado?.total).toBe(1);
    expect(resultado?.produtos[0].nome).toBe('Bolo Chocolate');
  });

  it('envia credenciais ao listar produtos', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne('/api/produtos');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ total: 0, produtos: [] });
  });

  it('lista produtos publicos sem credenciais', () => {
    service.listarPublico().subscribe();

    const req = httpMock.expectOne('/api/produtos?publico=1');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(false);
    req.flush({ total: 1, produtos: [produtoMock] });
  });

  it('usa cache em memoria para a segunda listagem', () => {
    let primeiraResposta: { total: number; produtos: Produto[] } | undefined;
    let segundaResposta: { total: number; produtos: Produto[] } | undefined;

    service.listar().subscribe((resposta) => {
      primeiraResposta = resposta;
    });

    const req = httpMock.expectOne('/api/produtos');
    req.flush({ total: 1, produtos: [produtoMock] });

    service.listar().subscribe((resposta) => {
      segundaResposta = resposta;
    });

    httpMock.expectNone('/api/produtos');

    expect(primeiraResposta?.total).toBe(1);
    expect(segundaResposta?.produtos[0].nome).toBe('Bolo Chocolate');
  });

  it('persiste cache de produtos no localStorage por uma nova instancia', () => {
    let primeiraResposta: { total: number; produtos: Produto[] } | undefined;

    service.listar().subscribe((resposta) => {
      primeiraResposta = resposta;
    });

    const req = httpMock.expectOne('/api/produtos');
    req.flush({ total: 1, produtos: [produtoMock] });

    expect(window.localStorage.getItem(chaveCacheLista)).not.toBeNull();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProdutosService],
    });

    service = TestBed.inject(ProdutosService);
    httpMock = TestBed.inject(HttpTestingController);

    let segundaResposta: { total: number; produtos: Produto[] } | undefined;
    service.listar().subscribe((resposta) => {
      segundaResposta = resposta;
    });

    httpMock.expectNone('/api/produtos');

    expect(primeiraResposta?.total).toBe(1);
    expect(segundaResposta?.produtos[0].nome).toBe('Bolo Chocolate');
  });

  it('persiste cache publico no localStorage', () => {
    service.listarPublico().subscribe();

    const req = httpMock.expectOne('/api/produtos?publico=1');
    req.flush({ total: 1, produtos: [produtoMock] });

    expect(window.localStorage.getItem(chaveCacheListaPublica)).not.toBeNull();
  });

  it('cria novo produto', () => {
    const novoProduto: ProdutoPayload = {
      nome: 'Novo Bolo',
      categoria: 'Bolos personalizados',
      descricao: 'Um novo bolo',
      preco: 149.9,
      fotos: ['foto1.jpg'],
      ativo: true,
    };

    let resultado: any | undefined;
    service.criar(novoProduto).subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/produtos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(novoProduto);
    req.flush({
      mensagem: 'Produto criado com sucesso.',
      produto: { ...produtoMock, ...novoProduto },
    });

    expect(resultado?.produto.nome).toBe('Novo Bolo');
  });

  it('invalida cache apos criar produto', () => {
    service.listar().subscribe();

    const reqListagem = httpMock.expectOne('/api/produtos');
    reqListagem.flush({ total: 1, produtos: [produtoMock] });

    expect(window.localStorage.getItem(chaveCacheLista)).not.toBeNull();

    service.criar({
      nome: 'Novo Bolo',
      categoria: 'Bolos personalizados',
      descricao: 'Um novo bolo',
      preco: 149.9,
      fotos: ['foto1.jpg'],
      ativo: true,
    }).subscribe();

    const reqCriacao = httpMock.expectOne('/api/produtos');
    reqCriacao.flush({
      mensagem: 'Produto criado com sucesso.',
      produto: { ...produtoMock, nome: 'Novo Bolo' },
    });

    expect(window.localStorage.getItem(chaveCacheLista)).toBeNull();
    expect(window.localStorage.getItem(chaveCacheListaPublica)).toBeNull();

    service.listar().subscribe();
    const reqRecarregamento = httpMock.expectOne('/api/produtos');
    reqRecarregamento.flush({ total: 1, produtos: [produtoMock] });
  });

  it('edita produto existente', () => {
    const atualizacao: ProdutoPayload = {
      nome: 'Bolo atualizado',
      categoria: 'Bolos personalizados',
      descricao: 'Descricao atualizada',
      preco: 199.9,
      fotos: ['foto1.jpg'],
      ativo: true,
    };

    let resultado: any | undefined;
    service.editar('1', atualizacao).subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/produtos?id=1');
    expect(req.request.method).toBe('PUT');
    req.flush({
      mensagem: 'Produto atualizado com sucesso.',
      produto: { ...produtoMock, ...atualizacao },
    });

    expect(resultado?.produto.nome).toBe('Bolo atualizado');
  });

  it('exclui produto existente', () => {
    let resultado: { mensagem: string } | undefined;
    service.excluir('1').subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/produtos?id=1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ mensagem: 'Produto excluído com sucesso.' });

    expect(resultado?.mensagem).toContain('excluído');
  });

  it('lanca erro quando falha ao listar', () => {
    let erro: Error | undefined;
    service.listar().subscribe({
      error: (e: Error) => {
        erro = e;
      },
    });

    const req = httpMock.expectOne('/api/produtos');
    req.flush({ erro: 'Erro ao listar' }, { status: 500, statusText: 'Internal Server Error' });

    expect(erro?.message).toContain('Erro ao listar');
  });

  it('lanca erro quando falha ao criar produto', () => {
    let erro: Error | undefined;
    const novoProduto: ProdutoPayload = {
      nome: '',
      categoria: '',
      descricao: '',
      preco: 0,
      fotos: [],
      ativo: true,
    };

    service.criar(novoProduto).subscribe({
      error: (e: Error) => {
        erro = e;
      },
    });

    const req = httpMock.expectOne('/api/produtos');
    req.flush({ erro: 'Nome eh obrigatorio' }, { status: 400, statusText: 'Bad Request' });

    expect(erro?.message).toContain('Nome eh obrigatorio');
  });

  it('lanca erro quando falha ao atualizar produto', () => {
    let erro: Error | undefined;
    const atualizacao: ProdutoPayload = {
      nome: 'Bolo',
      categoria: '',
      descricao: '',
      preco: 99.9,
      fotos: [],
      ativo: true,
    };

    service.editar('999', atualizacao).subscribe({
      error: (e: Error) => {
        erro = e;
      },
    });

    const req = httpMock.expectOne('/api/produtos?id=999');
    req.flush({ erro: 'Produto nao encontrado' }, { status: 404, statusText: 'Not Found' });

    expect(erro?.message).toContain('nao encontrado');
  });

  it('lanca erro quando falha ao excluir produto', () => {
    let erro: Error | undefined;
    service.excluir('999').subscribe({
      error: (e: Error) => {
        erro = e;
      },
    });

    const req = httpMock.expectOne('/api/produtos?id=999');
    req.flush({ erro: 'Produto nao encontrado' }, { status: 404, statusText: 'Not Found' });

    expect(erro?.message).toContain('nao encontrado');
  });
});
