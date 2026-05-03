import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockReq, createMockRes } from '../tests/http-mocks.js';

const mockedAutenticarRequisicao = vi.hoisted(() => vi.fn());
const mockedPoolQuery = vi.hoisted(() => vi.fn());

vi.mock('../_lib/auth.js', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth.js')>('../_lib/auth.js');

  return {
    ...actual,
    autenticarRequisicao: mockedAutenticarRequisicao,
  };
});

vi.mock('../_lib/db.js', () => ({
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
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
  });

  it('retorna lista de clientes quando autenticado', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

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

  it('filtra clientes por intervalo de datas', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    mockedPoolQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: {
        data_inicio: '2024-03-01',
        data_fim: '2024-03-31',
      },
    });

    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(mockedPoolQuery).toHaveBeenCalledTimes(1);

    const [sql, valores] = mockedPoolQuery.mock.calls[0];
    expect(sql).toContain('FROM clientes WHERE criado_em >= $1 AND criado_em <= $2');
    expect(valores).toEqual(['2024-03-01', '2024-03-31']);
  });

  it('retorna erro quando data_inicio e maior que data_fim', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'GET',
      query: {
        data_inicio: '2024-04-10',
        data_fim: '2024-04-01',
      },
    });

    await handler(req, res);

    expect(state.statusCode).toBe(400);
    expect(state.jsonBody).toEqual({
      erro: 'data_inicio não pode ser maior que data_fim.',
    });
    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });

  it('retorna erro de autenticacao quando token invalido', async () => {
    const { AuthError } = await import('../_lib/auth.js');
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

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
