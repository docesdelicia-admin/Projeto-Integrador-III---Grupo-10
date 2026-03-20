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

describe('GET /api/clientes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e GET', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'POST' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET');
  });

  it('retorna mensagem com usuario autenticado', async () => {
    const { default: handler } = await import('./index');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '2',
      id: 2,
      nome: 'Operador',
      email: 'operador@teste.com',
      tipo_usuario: 'operador',
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      mensagem: 'API de clientes em construcao',
      usuarioLogado: {
        sub: '2',
        id: 2,
        nome: 'Operador',
        email: 'operador@teste.com',
        tipo_usuario: 'operador',
      },
    });
  });

  it('retorna erro de autenticacao quando token invalido', async () => {
    const { AuthError } = await import('../_lib/auth');
    const { default: handler } = await import('./index');

    mockedAutenticarRequisicao.mockImplementation(() => {
      throw new AuthError('Token invalido ou expirado.', 401);
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(401);
    expect(state.jsonBody).toEqual({ erro: 'Token invalido ou expirado.' });
  });
});
