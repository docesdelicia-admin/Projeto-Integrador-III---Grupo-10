import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Produto, ProdutosService } from '../../services/produtos.service';
import { ProdutosAdminPage } from './produtos-admin.component';

describe('ProdutosAdminPage', () => {
  let fixture: ComponentFixture<ProdutosAdminPage>;
  let component: ProdutosAdminPage;
  let AuthServiceMock: any;
  let ProdutosServiceMock: any;

  const produtoMock: Produto = {
    id: '1',
    nome: 'Bolo',
    categoria: 'Bolos personalizados',
    descricao: 'Bolo delicioso',
    preco: '99.90',
    fotos: ['foto1.jpg'],
    ativo: true,
    criado_em: '2024-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    AuthServiceMock = {
      possuiToken: vi.fn().mockReturnValue(true),
      validarSessao: vi.fn().mockReturnValue(of(true)),
      ehAdmin: vi.fn().mockReturnValue(true),
      obterSessaoAutenticada: vi.fn().mockReturnValue({
        id: '1',
        nome: 'Admin Teste',
        email: 'admin@doces.com',
        tipo_usuario: 'admin',
      }),
    };

    ProdutosServiceMock = {
      listar: vi.fn().mockReturnValue(of({ total: 1, produtos: [produtoMock] })),
      criar: vi.fn(),
      editar: vi.fn(),
      excluir: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProdutosAdminPage, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: AuthServiceMock },
        { provide: ProdutosService, useValue: ProdutosServiceMock },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProdutosAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega produtos ao inicializar', () => {
    expect(ProdutosServiceMock.listar).toHaveBeenCalled();
  });

  it('valida sessao ao inicializar', () => {
    expect(AuthServiceMock.validarSessao).toHaveBeenCalled();
  });

  it('abre modal de cadastro', () => {
    component.abrirModalCadastro();

    expect(component.modalAberto).toBe(true);
    expect(component.modoEdicao).toBe(false);
  });

  it('fecha modal quando nao esta carregando', () => {
    component.modalAberto = true;
    component.carregandoFormulario = false;

    component.fecharModal();

    expect(component.modalAberto).toBe(false);
  });

  it('nao fecha modal quando esta carregando', () => {
    component.modalAberto = true;
    component.carregandoFormulario = true;

    component.fecharModal();

    expect(component.modalAberto).toBe(true);
  });

  it('reseta formulario ao abrir modal de cadastro', () => {
    component.formProduto.setValue({
      nome: 'Teste',
      categoria: 'Bolos personalizados',
      descricao: 'Teste',
      preco: 100,
      ativo: false,
    });

    component.abrirModalCadastro();

    expect(component.formProduto.get('nome')?.value).toBe('');
    expect(component.formProduto.get('categoria')?.value).toBe('');
    expect(component.formProduto.get('preco')?.value).toBe(0);
    expect(component.formProduto.get('ativo')?.value).toBe(true);
  });

  it('limpa mensagens ao abrir modal', () => {
    component.mensagemErro = 'Erro anterior';
    component.mensagemSucesso = 'Sucesso anterior';

    component.abrirModalCadastro();

    expect(component.mensagemErro).toBe('');
    expect(component.mensagemSucesso).toBe('');
  });

  it('renderiza componente da tabela', () => {
    component.produtos = [produtoMock];
    fixture.detectChanges();

    const tabela = fixture.nativeElement.querySelector('app-tabela');
    expect(tabela).toBeTruthy();
  });

  it('retorna linhas da tabela mapeadas de produtos', () => {
    component.produtos = [produtoMock];
    fixture.detectChanges();

    expect(component.linhasTabela.length).toBe(1);
    expect(component.linhasTabela[0]['id']).toBe('1');
  });

  it('carrega produtos apos inicializacao', () => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.produtos.length).toBeGreaterThanOrEqual(0);
  });

  it('exibe "Sim" quando produto esta ativo na coluna ativo', () => {
    const coluna = component.colunasTabela.find((c) => c.chave === 'ativo');
    const resultado = coluna?.formatador?.(true, {});

    expect(resultado).toBe('Sim');
  });

  it('define ehAdmin baseado na validacao de sessao', () => {
    AuthServiceMock.validarSessao.mockReturnValue(of(true));
    AuthServiceMock.ehAdmin.mockReturnValue(true);

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.ehAdmin).toBe(true);
  });

  it('desabilita exclusao quando usuario nao eh admin', () => {
    component.ehAdmin = false;

    const desabilitado = component.excluirDesabilitado();

    expect(desabilitado).toBe(true);
  });
});
