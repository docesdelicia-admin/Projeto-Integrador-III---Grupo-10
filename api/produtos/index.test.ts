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

describe('/api/produtos', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 405 quando o metodo nao e suportado', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;
    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'OPTIONS' });

    await handler(req, res);

    expect(state.statusCode).toBe(405);
    expect(state.headers.Allow).toBe('GET, POST, PUT, DELETE');
    expect(state.jsonBody).toEqual({ erro: 'Metodo nao permitido' });
  });

  it('permite listagem publica somente com produtos ativos', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

    mockedPoolQuery.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: '1',
          nome: 'Bolo de Ninho com Morango',
          categoria: 'Bolos personalizados',
          descricao: 'Massa fofinha com recheio cremoso.',
          preco: '179.90',
          fotos: [],
          ativo: true,
          criado_em: '2024-01-01T10:00:00Z',
        },
      ],
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET', query: { publico: '1' } });

    await handler(req, res);

    expect(mockedAutenticarRequisicao).not.toHaveBeenCalled();
    expect(mockedPoolQuery).toHaveBeenCalledWith(
      'SELECT id, nome, categoria, descricao, preco, fotos, ativo, criado_em FROM produtos WHERE ativo = true ORDER BY criado_em DESC',
    );
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      total: 1,
      produtos: [
        {
          id: '1',
          nome: 'Bolo de Ninho com Morango',
          categoria: 'Bolos personalizados',
          descricao: 'Massa fofinha com recheio cremoso.',
          preco: '179.90',
          fotos: [],
          ativo: true,
          criado_em: '2024-01-01T10:00:00Z',
        },
      ],
    });
  });

  it('exige autenticacao na listagem privada', async () => {
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
    expect(mockedPoolQuery).not.toHaveBeenCalled();
  });
});