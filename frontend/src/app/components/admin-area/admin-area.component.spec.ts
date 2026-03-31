import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminAreaComponent } from './admin-area.component';

describe('AdminAreaComponent', () => {
  let fixture: ComponentFixture<AdminAreaComponent>;
  let component: AdminAreaComponent;
  let AuthServiceSpy: {
    validarSessao: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    removerToken: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    AuthServiceSpy = {
      validarSessao: vi.fn(),
      logout: vi.fn(),
      removerToken: vi.fn(),
    };
    routerSpy = {
      navigateByUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminAreaComponent],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
  });

  it('mostra botao de login quando nao ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(botao.textContent?.trim()).toBe('Login');
  });

  it('navega para login ao clicar no botao de login', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    botao.click();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('executa logout e redireciona para home quando ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    AuthServiceSpy.logout.mockReturnValue(of({ mensagem: 'Logout realizado com sucesso.' }));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    botao.click();

    expect(AuthServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
