import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProdutoCardComponent, ProdutoVitrine } from './produto-card.component';

describe('ProdutoCardComponent', () => {
  let fixture: ComponentFixture<ProdutoCardComponent>;
  let component: ProdutoCardComponent;

  const produtoMock: ProdutoVitrine = {
    nome: 'Bolo Chocolate',
    descricao: 'Bolo delicioso de chocolate',
    preco: 99.9,
    fotos: ['foto1.jpg', 'foto2.jpg', 'foto3.jpg'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProdutoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProdutoCardComponent);
    component = fixture.componentInstance;
    component.produto = produtoMock;
    fixture.detectChanges();
  });

  it('renderiza nome e descricao do produto', () => {
    const nome = fixture.nativeElement.textContent;
    expect(nome).toContain('Bolo Chocolate');
    expect(nome).toContain('Bolo delicioso de chocolate');
  });

  it('formata preco em reais', () => {
    const preco = component.precoFormatado;
    // Intl.NumberFormat pode usar espaço non-breaking ou normal dependendo da locale
    expect(preco).toMatch(/R\$\s99,90/);
  });

  it('abre modal ao chamar abrirModal', () => {
    component.abrirModal();

    expect(component.modalAberto).toBe(true);
    expect(component.indiceFoto).toBe(0);
  });

  it('fecha modal ao chamar fecharModal', () => {
    component.modalAberto = true;

    component.fecharModal();

    expect(component.modalAberto).toBe(false);
  });

  it('navega para proxima foto no carousel', () => {
    component.indiceFoto = 0;

    component.proximaFoto();

    expect(component.indiceFoto).toBe(1);
  });

  it('volta para primeira foto quando chega no final do carousel', () => {
    component.indiceFoto = 2;

    component.proximaFoto();

    expect(component.indiceFoto).toBe(0);
  });

  it('navega para foto anterior no carousel', () => {
    component.indiceFoto = 2;

    component.fotoAnterior();

    expect(component.indiceFoto).toBe(1);
  });

  it('volta para ultima foto quando esta na primeira foto', () => {
    component.indiceFoto = 0;

    component.fotoAnterior();

    expect(component.indiceFoto).toBe(2);
  });

  it('vai para foto especifica ao chamar irParaFoto', () => {
    component.irParaFoto(1);

    expect(component.indiceFoto).toBe(1);
  });

  it('retorna foto atual corretamente', () => {
    component.indiceFoto = 1;

    expect(component.fotoAtual).toBe('foto2.jpg');
  });

  it('retorna string vazia quando nao ha fotos', () => {
    component.produto.fotos = [];

    expect(component.fotoAtual).toBe('');
  });

  it('nao navega quando produto nao tem fotos', () => {
    component.produto.fotos = [];
    component.indiceFoto = 0;

    component.proximaFoto();

    expect(component.indiceFoto).toBe(0);
  });

  it('renderiza modal quando modalAberto eh true', () => {
    component.modalAberto = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeTruthy();
  });

  it('nao renderiza modal quando modalAberto eh false', () => {
    component.modalAberto = false;
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal');
    expect(modal).toBeFalsy();
  });
});
