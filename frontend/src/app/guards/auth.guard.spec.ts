import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthApiService } from '../services/auth-api.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let authApiServiceSpy: {
    possuiToken: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authApiServiceSpy = {
      possuiToken: vi.fn(),
    };
    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: authApiServiceSpy as unknown as AuthApiService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    });
  });

  it('permite acesso quando ha sessao ativa', () => {
    authApiServiceSpy.possuiToken.mockReturnValue(true);

    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(resultado).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redireciona para login quando nao ha sessao', () => {
    const arvoreLogin = {} as UrlTree;
    authApiServiceSpy.possuiToken.mockReturnValue(false);
    routerSpy.createUrlTree.mockReturnValue(arvoreLogin);

    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    expect(resultado).toBe(arvoreLogin);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
