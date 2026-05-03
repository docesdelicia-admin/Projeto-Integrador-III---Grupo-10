import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabelaComponent, TabelaColuna, TabelaLinha } from './tabela.component';

describe('TabelaComponent', () => {
  let fixture: ComponentFixture<TabelaComponent>;
  let component: TabelaComponent;

  const colunasTesteMock: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'idade', titulo: 'Idade' },
    { chave: 'ativo', titulo: 'Ativo' },
  ];

  const linhasTesteMock: TabelaLinha[] = [
    { id: 1, nome: 'João', idade: 30, ativo: true },
    { id: 2, nome: 'Maria', idade: 25, ativo: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabelaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TabelaComponent);
    component = fixture.componentInstance;
    component.colunas = colunasTesteMock;
    component.linhas = linhasTesteMock;
    fixture.detectChanges();
  });

  it('renderiza titulo das colunas', () => {
    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0].textContent).toContain('Nome');
  });

  it('renderiza linhas da tabela', () => {
    const linhas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(linhas.length).toBe(2);
  });

  it('exibe mensagem quando nao ha dados', () => {
    component.linhas = [];
    component.mensagemSemDados = 'Nenhum registro encontrado.';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const mensagem = fixture.nativeElement.textContent;
    expect(mensagem).toContain('Nenhum registro encontrado.');
  });

  it('formata valores booleanos como Sim/Nao', () => {
    const valor = component.obterValorCelula(linhasTesteMock[0], colunasTesteMock[2]);
    expect(valor).toBe('Sim');

    const valor2 = component.obterValorCelula(linhasTesteMock[1], colunasTesteMock[2]);
    expect(valor2).toBe('Nao');
  });

  it('formata arrays como string separada por virgula', () => {
    const colunaArray: TabelaColuna = { chave: 'tags', titulo: 'Tags' };
    const linhaArray: TabelaLinha = { id: 1, tags: ['tag1', 'tag2', 'tag3'] };

    const valor = component.obterValorCelula(linhaArray, colunaArray);
    expect(valor).toBe('tag1, tag2, tag3');
  });

  it('usa formatador customizado quando definido', () => {
    const colunaFormatada: TabelaColuna = {
      chave: 'idade',
      titulo: 'Idade',
      formatador: (valor) => `${valor} anos`,
    };

    const valor = component.obterValorCelula(linhasTesteMock[0], colunaFormatada);
    expect(valor).toBe('30 anos');
  });

  it('retorna traco quando valor énull ou undefined', () => {
    const colunaSimples: TabelaColuna = { chave: 'nome', titulo: 'Nome' };
    const linhaVazia: TabelaLinha = { id: 1, nome: null };

    const valor = component.obterValorCelula(linhaVazia, colunaSimples);
    expect(valor).toBe('-');
  });

  it('usa ID como rastreador quando disponivel', () => {
    const rastreador = component.rastrearLinha(0, linhasTesteMock[0]);
    expect(rastreador).toBe(1);
  });

  it('usa index como rastreador quando ID nao esta disponivel', () => {
    const linhaAlterar: TabelaLinha = { nome: 'Pedro' };
    const rastreador = component.rastrearLinha(5, linhaAlterar);
    expect(rastreador).toBe(5);
  });

  it('chama acaoEditar quando editar éacionado', () => {
    let chamado = false;
    component.acaoEditar = () => {
      chamado = true;
    };

    component.editar(linhasTesteMock[0]);

    expect(chamado).toBe(true);
  });

  it('chama acaoExcluir quando excluir éacionado', () => {
    let chamado = false;
    component.acaoExcluir = () => {
      chamado = true;
    };
    component.excluirDesabilitado = () => false;

    component.excluir(linhasTesteMock[0]);

    expect(chamado).toBe(true);
  });

  it('nao chama acaoExcluir quando exclusao esta desabilitada', () => {
    let chamado = false;
    component.acaoExcluir = () => {
      chamado = true;
    };
    component.excluirDesabilitado = () => true;

    component.excluir(linhasTesteMock[0]);

    expect(chamado).toBe(false);
  });
});
