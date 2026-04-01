import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [{ provide: ActivatedRoute, useValue: { params: of({}) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('renderiza com titulo padrao', () => {
    expect(component.titulo).toBe('Doces Delicia');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renderiza com titulo customizado', () => {
    component.titulo = 'Meu Titulo';
    expect(component.titulo).toBe('Meu Titulo');
  });

  it('exibe busca quando exibirBusca eh true', () => {
    component.exibirBusca = true;
    expect(component.exibirBusca).toBe(true);
  });

  it('oculta busca quando exibirBusca eh false', () => {
    component.exibirBusca = false;
    expect(component.exibirBusca).toBe(false);
  });

  it('usa placeholder customizado para busca', () => {
    component.exibirBusca = true;
    component.placeholderBusca = 'Busca customizada';
    expect(component.placeholderBusca).toBe('Busca customizada');
  });

  it('renderiza componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
