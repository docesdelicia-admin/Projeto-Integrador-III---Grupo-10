import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { SidebarService } from '../../services/sidebar.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let sidebarServiceMock: Pick<SidebarService, 'toggle'>;

  beforeEach(async () => {
    sidebarServiceMock = {
      toggle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [{ provide: SidebarService, useValue: sidebarServiceMock }],
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

  it('chama toggle no servico ao alternar sidebar', () => {
    component.toggleSidebar();

    expect(sidebarServiceMock.toggle).toHaveBeenCalledTimes(1);
  });

  it('renderiza componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
