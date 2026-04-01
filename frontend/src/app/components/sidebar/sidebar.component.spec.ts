import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  function criarComponente(ehAdmin: boolean): {
    fixture: ComponentFixture<SidebarComponent>;
    component: SidebarComponent;
  } {
    const AuthServiceSpy = {
      validarSessao: vi.fn().mockReturnValue(of(true)),
      ehAdmin: vi.fn().mockReturnValue(ehAdmin),
      obterSessaoAutenticada: vi.fn().mockReturnValue({
        nome: 'Teste',
        tipo_usuario: ehAdmin ? 'admin' : 'operador',
      }),
    };

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    });

    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    return { fixture, component };
  }

  it('oculta item de usuarios para operador', () => {
    const { fixture } = criarComponente(false);

    const elementos = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const links = Array.from(elementos).map((element) => element.textContent?.trim());

    expect(links).not.toContain('Usuarios');
  });

  it('exibe item de usuarios para admin', () => {
    const { fixture } = criarComponente(true);

    const elementos = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const links = Array.from(elementos).map((element) => element.textContent?.trim());

    expect(links).toContain('Usuarios');
  });
});
