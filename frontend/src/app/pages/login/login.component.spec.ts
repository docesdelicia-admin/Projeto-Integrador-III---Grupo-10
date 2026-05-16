import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService, LoginResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoginPage } from './login.component';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let AuthServiceSpy: {
    login: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };
  let toastServiceSpy: {
    erro: ReturnType<typeof vi.fn>;
    sucesso: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    AuthServiceSpy = {
      login: vi.fn(),
    };
    routerSpy = {
      navigateByUrl: vi.fn(),
    };
    toastServiceSpy = {
      erro: vi.fn(),
      sucesso: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
        { provide: ToastService, useValue: toastServiceSpy as unknown as ToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
  });

  it('nao envia login com formulario invalido', () => {
    component.loginForm.setValue({ email: '', senha: '' });

    component.enviarLogin();

    expect(AuthServiceSpy.login).not.toHaveBeenCalled();
  });

  it('alterna visibilidade da senha ao clicar no olho', () => {
    expect(component.mostrarSenha).toBe(false);

    component.alternarVisibilidadeSenha();
    expect(component.mostrarSenha).toBe(true);

    component.alternarVisibilidadeSenha();
    expect(component.mostrarSenha).toBe(false);
  });

  it('envia login e redireciona para dashboard quando autenticado', () => {
    const resposta: LoginResponse = {
      expira_em: '8h',
      usuario: {
        id: 1,
        nome: 'Admin',
        email: 'admin@doces.com',
        tipo_usuario: 'admin',
      },
    };

    AuthServiceSpy.login.mockReturnValue(of(resposta));
    component.loginForm.setValue({ email: 'admin@doces.com', senha: '123456' });

    component.enviarLogin();

    expect(AuthServiceSpy.login).toHaveBeenCalledWith('admin@doces.com', '123456');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('exibe mensagem de erro quando login falha', () => {
    AuthServiceSpy.login.mockReturnValue(throwError(() => new Error('Credenciais invalidas.')));
    component.loginForm.setValue({ email: 'admin@doces.com', senha: 'errada' });

    component.enviarLogin();

    expect(toastServiceSpy.erro).toHaveBeenCalledWith('Credenciais invalidas.');
  });
});
