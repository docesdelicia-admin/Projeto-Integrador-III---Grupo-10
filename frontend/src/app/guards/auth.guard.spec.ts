import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let AuthServiceSpy: {
    validarSessao: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    AuthServiceSpy = {
      validarSessao: vi.fn(),
    };
    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    });
  });

  it('permite acesso quando ha sessao ativa', async () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));

    const resultado = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redireciona para login quando nao ha sessao', async () => {
    const arvoreLogin = {} as UrlTree;
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));
    routerSpy.createUrlTree.mockReturnValue(arvoreLogin);

    const resultado = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreLogin);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
