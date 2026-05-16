import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VitrinePage } from './vitrine.component';
import { ProdutosService } from '../../services/produtos.service';

const produtosServiceMock = {
  listarPublico: vi.fn(),
  obterProdutosPublicosEmCache: vi.fn().mockReturnValue([]),
};

describe('VitrinePage', () => {
  let fixture: ComponentFixture<VitrinePage>;
  let component: VitrinePage;

  beforeEach(async () => {
    vi.clearAllMocks();

    produtosServiceMock.listarPublico.mockReturnValue(
      of({
        total: 2,
        produtos: [
          {
            id: '1',
            nome: 'Bolo de Ninho com Morango',
            categoria: 'Bolos personalizados',
            descricao: 'Massa fofinha com recheio cremoso e decoracao artesanal.',
            preco: '179.90',
            fotos: [],
            ativo: true,
            criado_em: '2024-01-01T10:00:00Z',
          },
          {
            id: '2',
            nome: 'Pote brigadeiro gourmet',
            categoria: 'Doces no pote',
            descricao: 'Camadas cremosas e sabores intensos em versoes individuais.',
            preco: '19.90',
            fotos: [],
            ativo: true,
            criado_em: '2024-01-02T10:00:00Z',
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [VitrinePage],
      providers: [{ provide: ProdutosService, useValue: produtosServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(VitrinePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe titulo da pagina', () => {
    const tituloPrincipal = fixture.nativeElement.querySelector('.hero-title');
    const tituloSecundario = fixture.nativeElement.querySelector('.hero-title2');

    expect(tituloPrincipal?.textContent).toContain('Sabores que viram');
    expect(tituloSecundario?.textContent).toContain('memória afetiva');
  });

  it('carrega produtos publicos da api', () => {
    expect(produtosServiceMock.listarPublico).toHaveBeenCalledTimes(1);
  });

  it('renderiza categorias vindas da api', () => {
    expect(component.categorias().length).toBe(2);
  });

  it('contem todos os titulos de categorias esperados', () => {
    const nomes = component.categorias().map((categoria: { titulo: string }) => categoria.titulo);

    expect(nomes).toContain('Bolos personalizados');
    expect(nomes).toContain('Doces no pote');
  });

  it('renderiza componente de produto-card para cada categoria', () => {
    const cards = fixture.nativeElement.querySelectorAll('app-produto-card');
    expect(cards.length).toBe(2);
  });

  it('cada categoria tem descricao', () => {
    const todasDescricoes = component
      .categorias()
      .map((categoria: { descricao: string }) => categoria.descricao);
    expect(todasDescricoes).not.toContain('');
  });

  it('cada produto tem preco positivo', () => {
    component.categorias().forEach((categoria: { produtos: { preco: number }[] }) => {
      categoria.produtos.forEach((produto) => {
        expect(produto.preco).toBeGreaterThan(0);
      });
    });
  });

  it('cada produto tem minimo 3 fotos', () => {
    component.categorias().forEach((categoria: { produtos: { fotos: string[] }[] }) => {
      categoria.produtos.forEach((produto) => {
        expect(produto.fotos.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  it('todas as fotos sao data URLs SVG', () => {
    component.categorias().forEach((categoria: { produtos: { fotos: string[] }[] }) => {
      categoria.produtos.forEach((produto) => {
        produto.fotos.forEach((foto: string) => {
          expect(foto).toMatch(/^data:image\/svg\+xml/);
        });
      });
    });
  });

  it('renderiza HeaderComponent', () => {
    const hero = fixture.nativeElement.querySelector('.vitrine-hero');
    expect(hero).toBeTruthy();
  });

  it('Bolos personalizados tem preco esperado', () => {
    const bolos = component
      .categorias()
      .find(
        (categoria: { titulo: string; produtos: { preco: number }[] }) =>
          categoria.titulo === 'Bolos personalizados',
      );
    expect(bolos?.produtos[0].preco).toBe(179.9);
  });

  it('Doces no pote tem preco esperado', () => {
    const doces = component
      .categorias()
      .find(
        (categoria: { titulo: string; produtos: { preco: number }[] }) =>
          categoria.titulo === 'Doces no pote',
      );
    expect(doces?.produtos[0].preco).toBe(19.9);
  });
});
