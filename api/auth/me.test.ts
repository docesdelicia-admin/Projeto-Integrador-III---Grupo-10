import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedAutenticarRequisicao = vi.hoisted(() => vi.fn());

vi.mock('../_lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth')>('../_lib/auth');

  return {
    ...actual,
    autenticarRequisicao: mockedAutenticarRequisicao,
  };
});

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e GET', async () => {
    const { default: handler } = await import('./me');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
  });

  it('retorna dados do usuario quando token e valido', async () => {
    const { default: handler } = await import('./me');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      usuario: {
        sub: '1',
        id: 1,
        nome: 'Administrador',
        email: 'admin@teste.com',
        tipo_usuario: 'admin',
      },
    });
  });

  it('retorna status de erro de autenticacao', async () => {
    const { AuthError } = await import('../_lib/auth');
    const { default: handler } = await import('./me');

    mockedAutenticarRequisicao.mockImplementation(() => {
      throw new AuthError('Token nao enviado.', 401);
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ erro: 'Token nao enviado.' });
  });
});
