import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard.component';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let component: DashboardPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza componente', () => {
    expect(component).toBeTruthy();
  });

  it('renderiza HeaderComponent', () => {
    const titulo = fixture.nativeElement.querySelector('h1');
    expect(titulo?.textContent).toContain('Confeitaria Organizada');
  });

  it('contem links de navegacao', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Solução Web para Gestão de Pedidos e Estoque');
  });
});
