import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockReq, createMockRes } from '../tests/http-mocks.js';
import { gerarSenhaHash } from '../_lib/password.js';

const mockedDb = vi.hoisted(() => ({ query: vi.fn() }));
const mockedAutenticarRequisicao = vi.hoisted(() => vi.fn());

vi.mock('../_lib/db.js', () => ({
  default: mockedDb,
}));

vi.mock('../_lib/auth.js', async () => {
  const actual = await vi.importActual<typeof import('../_lib/auth.js')>('../_lib/auth.js');

  return {
    ...actual,
    autenticarRequisicao: mockedAutenticarRequisicao,
  };
});

describe('/api/usuarios', () => {
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

  it('retorna 403 para usuario operador', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

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

    expect(state.statusCode).toBe(403);
    expect(state.jsonBody).toEqual({ erro: 'Acesso Restrito a Administradores.' });
    expect(mockedDb.query).not.toHaveBeenCalled();
  });

  it('retorna lista de usuarios para admin', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: 1,
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    mockedDb.query.mockResolvedValue({
      rowCount: 2,
      rows: [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin@teste.com',
          tipo_usuario: 'admin',
          criado_em: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          nome: 'Operador',
          email: 'operador@teste.com',
          tipo_usuario: 'operador',
          criado_em: '2026-01-02T00:00:00.000Z',
        },
      ],
    });

    const { res, state } = createMockRes();
    const req = createMockReq({ method: 'GET' });

    await handler(req, res);

    expect(mockedDb.query).toHaveBeenCalledWith(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios ORDER BY id',
    );
    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      total: 2,
      usuarios: [
        {
          id: 1,
          nome: 'Administrador',
          email: 'admin@teste.com',
          tipo_usuario: 'admin',
          criado_em: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          nome: 'Operador',
          email: 'operador@teste.com',
          tipo_usuario: 'operador',
          criado_em: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
  });

  it('atualiza os dados do proprio usuario com senha atual', async () => {
    const handler = (await import('./index.js')).default as unknown as (
      req: VercelRequest,
      res: VercelResponse,
    ) => Promise<unknown>;

    const senhaHash = await gerarSenhaHash('senhaAtual123');

    mockedAutenticarRequisicao.mockReturnValue({
      sub: '1',
      id: '1',
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    mockedDb.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ senha_hash: senhaHash }] })
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: '1',
            nome: 'Administrador Atualizado',
            email: 'admin.novo@teste.com',
            tipo_usuario: 'admin',
            criado_em: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

    const { res, state } = createMockRes();
    const req = createMockReq({
      method: 'PUT',
      query: { id: '1' },
      body: {
        nome: 'Administrador Atualizado',
        email: 'admin.novo@teste.com',
        senha_atual: 'senhaAtual123',
      },
    });

    await handler(req, res);

    expect(state.statusCode).toBe(200);
    expect(state.jsonBody).toEqual({
      mensagem: 'Usuario atualizado com sucesso.',
      usuario: {
        id: '1',
        nome: 'Administrador Atualizado',
        email: 'admin.novo@teste.com',
        tipo_usuario: 'admin',
        criado_em: '2026-01-01T00:00:00.000Z',
      },
    });
  });
});
