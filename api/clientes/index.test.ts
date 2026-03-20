import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockReq, createMockRes } from '../tests/http-mocks';

const mockedAutenticarRequisicao = vi.hoisted(() => vi.fn());
const mockedPoolQuery = vi.hoisted(() => vi.fn());

vi.mock('../_lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth')>('../_lib/auth');

  return {
    ...actual,
    autenticarRequisicao: mockedAutenticarRequisicao,
  };
});

vi.mock('../_lib/db', () => ({
  default: {
    query: mockedPoolQuery,
  },
}));

describe('GET /api/clientes', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e GET', async () => {
    const { default: handler } = await import('./index');
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
  });

  it('retorna lista de clientes quando autenticado', async () => {
    const { default: handler } = await import('./index');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    mockedPoolQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'uuid-1',
          nome: 'Cliente 1',
          telefone: '1234567890',
          observacoes: 'Cliente importante',
          criado_em: '2024-03-20T10:00:00Z',
        },
      ],
      rowCount: 1,
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      total: 1,
      clientes: [
        {
          id: 'uuid-1',
          nome: 'Cliente 1',
          telefone: '1234567890',
          observacoes: 'Cliente importante',
          criado_em: '2024-03-20T10:00:00Z',
        },
      ],
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
